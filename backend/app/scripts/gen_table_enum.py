#!/usr/bin/env python3
import json
from pathlib import Path

# 1. Locate JSON and target file
BASE = Path(__file__).parent.parent
TABLE_JSON = BASE / "database" / "table_names.json"
OUT_FILE = BASE / "models" / "table_enum.py"

# 2. Read the JSON mapping
data: dict[str, str] = json.loads(TABLE_JSON.read_text())

# 3. Emit Python enum using StrEnum (Python 3.11+)
with open(OUT_FILE, "w") as f:
    f.write("# Auto Generate Table Names Enum\n")
    f.write("from enum import StrEnum\n\n")
    f.write("class ModelName(StrEnum):\n")
    for member, value in data.items():
        name = member.upper()
        f.write(f"    {name} = {value!r}\n")
