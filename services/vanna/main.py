"""
Vanna AI Service - Natural Language to SQL
Powered by Groq LLM + PostgreSQL
Features:
- Auto-parses DATABASE_SCHEMA.md
- Real DB samples
- Self-healing SQL
- UTF-8 safe
- SELECT-only + LIMIT + timeout
"""

import os
import time
import re
import logging
import pandas as pd
from pathlib import Path
from functools import lru_cache
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy import create_engine, text
import sqlparse
import threading

# Load environment
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("VannaAI")

# FastAPI
app = FastAPI(
    title="Vanna AI Service",
    description="Natural Language to SQL with Groq + PostgreSQL",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    question: str
    sql: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None

# Global clients
groq_client = None
db_engine = None

# Cache
_schema_cache = None
_schema_ts = 0
CACHE_TTL = 300  # 5 min

# Paths
CONTEXT_DIR = Path("context")
SAMPLES_DIR = Path("samples")
SCHEMA_DOC = Path("DATABASE_SCHEMA.md")


# Column name normalizer (camelCase → exact match)

COLUMN_MAP = {
    # totalAmount
    "total_amount": "totalAmount",
    "totalamount": "totalAmount",
    "total_amount": "totalAmount",

    # subtotal
    "sub_total": "subtotal",
    "subtotal": "subtotal",

    # taxAmount
    "tax_amount": "taxAmount",
    "taxamount": "taxAmount",

    # discountAmount
    "discount_amount": "discountAmount",
    "discountamount": "discountAmount",

    # issueDate
    "issue_date": "issueDate",
    "issuedate": "issueDate",

    # dueDate
    "due_date": "dueDate",
    "duedate": "dueDate",

    # invoiceNumber
    "invoice_number": "invoiceNumber",
    "invoicenumber": "invoiceNumber",

    # vendorId
    "vendor_id": "vendorId",
    "vendorid": "vendorId",
    "vendor_id": "vendorId",

    # customerId
    "customer_id": "customerId",
    "customerid": "customerId",

    # status
    "status": "status",
}

def normalize_sql_columns(sql: str) -> str:
    for wrong, correct in COLUMN_MAP.items():
        # Match \bvendorid\b, \bVendorId\b, etc.
        sql = re.sub(rf'\b{re.escape(wrong)}\b', correct, sql, flags=re.IGNORECASE)
    return sql


# 1. Initialize clients

def init_clients():
    global groq_client, db_engine
    if groq_client is None or db_engine is None:
        groq_key = os.getenv("GROQ_API_KEY")
        db_url = os.getenv("DATABASE_URL")

        if not groq_key:
            raise ValueError("GROQ_API_KEY missing in .env")
        if not db_url:
            raise ValueError("DATABASE_URL missing in .env")

        groq_client = Groq(api_key=groq_key)
        db_engine = create_engine(db_url)
        logger.info("Groq + PostgreSQL initialized")

    return groq_client, db_engine


# 2. Parse DATABASE_SCHEMA.md

def parse_schema() -> dict:
    if not SCHEMA_DOC.exists():
        raise FileNotFoundError("DATABASE_SCHEMA.md not found")

    text = SCHEMA_DOC.read_text(encoding="utf-8")
    data = {
        "tables": {},
        "fks": [],
        "enums": {},
        "indexes": defaultdict(list),
        "examples": [],
        "rules": []
    }

    # Tables
    table_blocks = re.finditer(r"┌─+\n│\s+([A-Z_]+)\s+│.*?\n└─+\n", text, re.S)
    for block in table_blocks:
        lines = [l for l in block.group(0).split("\n") if "│" in l]
        table_name = None
        cols = []
        for line in lines:
            parts = [p.strip() for p in line.split("│")[1:-1]]
            if not parts: continue
            if not table_name:
                table_name = parts[0].lower()
                continue
            col = parts[0]
            typ = parts[1] if len(parts) > 1 else ""
            pk = "PK" in col
            fk = "FK" in col
            col = col.replace("PK", "").replace("FK", "").strip()
            cols.append({
                "name": col,
                "type": typ.split()[0],
                "pk": pk,
                "fk": fk,
                "not_null": "NOT NULL" in typ,
                "default": "DEFAULT" in typ
            })
        if table_name:
            data["tables"][table_name] = cols

    # FK relationships
    for m in re.finditer(r"(\w+\.\w+) → (\w+\.\w+)", text):
        data["fks"].append(f"{m.group(1)} → {m.group(2)}")

    # Enums
    for m in re.finditer(r"enum \w+ \{([^}]+)\}", text, re.S):
        name = m.group(0).split()[1]
        values = [v.strip().strip('"') for v in m.group(1).split("\n") if v.strip()]
        data["enums"][name] = values

    # Sample queries
    data["examples"] = [m.group(1).strip() for m in re.finditer(r"```sql\n(.*?)\n```", text, re.S)]

    # Validation rules
    data["rules"] = [f"- {m.group(1)}: {m.group(2)}" for m in re.finditer(r"### (.*)\n- (.*)", text)]

    return data


# 3. Load context (cached)

def load_schema_context() -> str:
    global _schema_cache, _schema_ts
    now = time.time()
    if _schema_cache and now - _schema_ts < CACHE_TTL:
        return _schema_cache

    if not CONTEXT_DIR.exists():
        raise FileNotFoundError("Run generate_context.py first")

    parts = []
    for fn in ["business_rules.md", "schema_full.md"]:
        parts.append((CONTEXT_DIR / fn).read_text(encoding="utf-8"))

    # Sample rows
    for csv_file in SAMPLES_DIR.glob("*.csv"):
        try:
            df = pd.read_csv(csv_file).head(3)
            parts.append(f"### SAMPLE {csv_file.stem}\n{df.to_markdown(index=False)}\n")
        except:
            pass

    # Few-shot examples
    examples = (CONTEXT_DIR / "examples.sql").read_text(encoding="utf-8")
    parts.append(f"## FEW-SHOT EXAMPLES\n{examples}")

    ctx = "\n\n".join(parts)
    _schema_cache = ctx
    _schema_ts = now
    return ctx


# 4. Prompt

SYSTEM_PROMPT = """You are a PostgreSQL expert. Generate ONE valid SELECT query.
- Use only tables/columns from the context.
- End with semicolon.
- No markdown, no explanation."""

def build_prompt(question: str):
    ctx = load_schema_context()
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Context:\n{ctx}\n\nQuestion: {question}\nSQL:"}
    ]


# Clean + Quote ONLY identifiers (columns, tables, aliases) — NOT keywords

def clean_sql_response(raw: str) -> str:
    m = re.search(r"```(?:sql)?\s*(.*?)\s*```", raw, re.S | re.I)
    sql = (m.group(1) if m else raw).strip()
    sql = re.sub(r'^\s*sql\s*[:\-]?\s*', '', sql, flags=re.I)

    # 1. Normalize column names (snake_case → camelCase)
    sql = normalize_sql_columns(sql)

    # 2. Parse with sqlparse
    parsed = sqlparse.parse(sql)
    if not parsed:
        raise ValueError("Empty SQL")
    stmt = parsed[0]

    if not any(t.value.upper() == 'SELECT' for t in stmt.tokens if t.ttype in (sqlparse.tokens.DML,)):
        raise ValueError("Only SELECT allowed")

    # 3. Rebuild SQL with ONLY identifiers quoted
    def format_token(token):
        if token.is_group:
            return ''.join(format_token(t) for t in token.tokens)
        
        # Only quote: column names, table names, aliases
        if token.ttype in (sqlparse.tokens.Name,) and token.value not in ('*',):
            # Don't quote if it's a function like SUM, COUNT
            if token.value.upper() in ('SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'AS', 'FROM', 'JOIN', 'ON', 'WHERE', 'GROUP', 'ORDER', 'BY', 'LIMIT', 'OFFSET'):
                return token.value
            return f'"{token.value}"'
        
        # Preserve everything else
        return str(token)

    sql = ''.join(format_token(t) for t in stmt.tokens).strip()

    # 4. Remove any LIMIT from LLM
    sql = re.sub(r'\bLIMIT\s+\d+\s*(;|$)', '', sql, flags=re.I).strip()
    if sql.endswith(';'):
        sql = sql[:-1].strip()
    if not sql.endswith(';'):
        sql += ';'

    return sql


# 6. Windows-safe timeout using threading

class TimeoutException(Exception):
    pass

def _run_with_timeout(func, args=(), kwargs=None, timeout=15):
    if kwargs is None:
        kwargs = {}
    result = [None]
    exception = [None]

    def target():
        try:
            result[0] = func(*args, **kwargs)
        except Exception as e:
            exception[0] = e

    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()
    thread.join(timeout)

    if thread.is_alive():
        raise TimeoutException(f"Query timed out after {timeout} seconds")
    if exception[0]:
        raise exception[0]
    return result[0]



# 6. Execute with timeout + limit (SAFE: removes duplicate LIMIT)

def execute_sql(sql: str):
    def _query():
        sql_clean = re.sub(r'\bLIMIT\s+\d+\s*(;|$)', '', sql, flags=re.I).strip()
        if sql_clean.endswith(';'):
            sql_clean = sql_clean[:-1].strip()
        safe_sql = f"{sql_clean} LIMIT 500;"
        logger.info(f"Executing SQL:\n{safe_sql}")
        with db_engine.connect() as conn:
            return pd.read_sql(text(safe_sql), conn)
    return _run_with_timeout(_query, timeout=15)



# 7. Self-healing loop

def run_with_healing(question: str):
    last_sql = last_err = None
    for attempt in range(3):
        msgs = build_prompt(question)
        if attempt > 0:
            msgs.append({"role": "assistant", "content": last_sql})
            msgs.append({"role": "user", "content": f"Error: {last_err}\nFix the SQL. Only SQL."})

        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=msgs,
            temperature=0.0,
            max_tokens=1024,
        )
        raw = resp.choices[0].message.content
        try:
            sql = clean_sql_response(raw)
            df = execute_sql(sql)
            return sql, df
        except Exception as e:
            last_sql = sql if 'sql' in locals() else raw
            # Extract helpful hint from PostgreSQL
            err_msg = str(e)
            if "UndefinedColumn" in err_msg:
                hint = re.search(r'HINT: (.*)', err_msg)
                if hint:
                    err_msg = f"{err_msg}\n\nHINT FROM DB: {hint.group(1)}"
            last_err = err_msg
            logger.warning(f"Attempt {attempt+1} failed: {e}")
    raise HTTPException(500, "AI failed after 3 attempts")


# 8. Endpoints

@app.on_event("startup")
async def startup():
    init_clients()
    logger.info("Vanna AI Service started")

@app.get("/")
async def root():
    return {"service": "Vanna AI", "status": "running"}

@app.get("/health")
async def health():
    try:
        init_clients()
        return {"status": "healthy"}
    except Exception as e:
        raise HTTPException(503, detail=str(e))

@app.post("/api/query", response_model=QueryResponse)
async def query_data(req: QueryRequest):
    start = time.time()
    try:
        sql, df = run_with_healing(req.question)
        return QueryResponse(
            question=req.question,
            sql=sql,
            results=df.to_dict(orient="records"),
            execution_time=round(time.time() - start, 3)
        )
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(500, detail=str(e))


# 9. Run

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)