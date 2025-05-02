#!/usr/bin/env python3
import json
from pathlib import Path

# 1. Locate JSON and target file
BASE = Path(__file__).parent.parent

TABLE_JSON = BASE / "database" / "table_names.json"

# changing this file name,will require match that change in it importation in model.base.py
# and delete the prev name existing file
OUT_FILE = BASE / "models" / "table.py"

# 2. Read the JSON mapping
data: dict[str, str] = json.loads(TABLE_JSON.read_text())

# 3. Emit Python enum using StrEnum (Python 3.12+)
with open(OUT_FILE, "w") as f:
    f.write("# Auto Generate Table Names Enum\n\n")

    f.write("from enum import StrEnum\n\n\n")

    f.write("class ModelName(StrEnum):\n")
    f.write('\t"""class for the enum of database table names."""\n\n')

    for member, value in data.items():
        f.write(f'\t{member} = "{value}"\n')
