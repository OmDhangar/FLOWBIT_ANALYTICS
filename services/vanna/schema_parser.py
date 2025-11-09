# schema_parser.py
import re
import textwrap
from pathlib import Path
from collections import defaultdict

DOC_PATH = Path("DATABASE_SCHEMA.md")

def parse_schema() -> dict:
    text = DOC_PATH.read_text(encoding="utf-8")  # <-- ADD encoding="utf-8"
    data = {
        "tables": {},
        "fks": [],
        "enums": {},
        "indexes": defaultdict(list),
        "examples": [],
        "rules": []
    }

    # --- Tables ---
    table_pat = re.compile(r"┌─+\n│\s+([A-Z_]+)\s+│.*?\n└─+\n", re.S)
    for block in table_pat.finditer(text):
        lines = [l for l in block.group(0).split("\n") if "│" in l]
        table_name = None
        cols = []
        for line in lines:
            if "│" not in line: continue
            parts = [p.strip() for p in line.split("│")[1:-1]]
            if len(parts) == 1 and parts[0].isdigit(): continue
            if not table_name:
                table_name = parts[0]
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
            data["tables"][table_name.lower()] = cols

    # --- FK relationships ---
    rel_pat = re.finditer(r"(\w+) → (\w+)", text)
    for m in rel_pat:
        data["fks"].append(f"{m.group(1)} → {m.group(2)}")

    # --- Enums ---
    enum_pat = re.finditer(r"enum \w+ \{([^}]+)\}", text, re.S)
    for m in enum_pat:
        name = m.group(0).split()[1]
        values = [v.strip().strip('"') for v in m.group(1).split("\n") if v.strip()]
        data["enums"][name] = values

    # --- Indexes ---
    idx_pat = re.finditer(r"- `(\w+)` - (.*)", text)
    for m in idx_pat:
        col, reason = m.groups()
        # guess table from context
        for tbl, cols in data["tables"].items():
            if any(c["name"] == col for c in cols):
                data["indexes"][tbl].append(col)

    # --- Sample queries ---
    sql_pat = re.finditer(r"```sql\n(.*?)\n```", text, re.S)
    data["examples"] = [m.group(1).strip() for m in sql_pat]

    # --- Validation rules ---
    rule_pat = re.finditer(r"### (.*)\n- (.*)", text)
    data["rules"] = [f"- {r[0]}: {r[1]}" for r in rule_pat]

    return data