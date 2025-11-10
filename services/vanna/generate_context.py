
import os
import pandas as pd
from pathlib import Path
from sqlalchemy import create_engine, text
from schema_parser import parse_schema

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Connect to DB
engine = create_engine(os.getenv("DATABASE_URL"))
if not os.getenv("DATABASE_URL"):
    raise ValueError("DATABASE_URL not set in .env")

# Output directories
OUT = Path("context")
SAMPLES = Path("samples")
OUT.mkdir(exist_ok=True)
SAMPLES.mkdir(exist_ok=True)

# Parse schema from Markdown
schema = parse_schema()

# --- Generate schema_full.md ---
lines = ["# DATABASE CONTEXT (auto-generated)\n"]
for name, cols in schema["tables"].items():
    lines.append(f"## TABLE: {name}")
    for c in cols:
        nn = " NOT NULL" if c["not_null"] else ""
        pk = " PK" if c["pk"] else ""
        fk = " FK" if c["fk"] else ""
        lines.append(f"- **`{c['name']}`** ({c['type']}){nn}{pk}{fk}")
    lines.append("")

lines.append("## RELATIONSHIPS")
for fk in schema["fks"]:
    lines.append(f"- {fk}")

lines.append("## ENUMS")
for name, vals in schema["enums"].items():
    lines.append(f"- {name}: {', '.join(vals)}")

lines.append("## BUSINESS RULES")
for r in schema["rules"]:
    lines.append(r)

OUT.joinpath("schema_full.md").write_text("\n".join(lines), encoding="utf-8")

# --- Generate examples.sql ---
examples = "\n\n".join(f"-- Example {i+1}\n{sql}\n" for i, sql in enumerate(schema["examples"]))
OUT.joinpath("examples.sql").write_text(examples, encoding="utf-8")

# --- Generate business_rules.md ---
rules = "\n".join([
    "# BUSINESS RULES",
    "- totalAmount = subtotal + taxAmount - discountAmount",
    "- Negative totals = credit note",
    "- status must be valid InvoiceStatus",
    "- quantity > 0, unitPrice >= 0"
])
OUT.joinpath("business_rules.md").write_text(rules, encoding="utf-8")

# --- Sample real data ---
for table in schema["tables"]:
    try:
        df = pd.read_sql(text(f"SELECT * FROM {table} LIMIT 5"), engine)
        if not df.empty:
            df.to_csv(SAMPLES / f"{table}.csv", index=False)
    except Exception as e:
        print(f"Could not sample {table}: {e}")

print("Context generated in ./context/ and ./samples/")