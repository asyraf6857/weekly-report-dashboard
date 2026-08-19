import csv
import io
import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SHEET_ID = "1t9wtgfKNouncZ0QN5A2JhfAq0EPVMMofGQTDriVF8nY"
RAW_SHEET = "RECONCILIATION WEEKLY 2026"
DISPUTE_SHEET = "DISPUTE"
OUT = Path(__file__).resolve().parents[1] / "data.json"


def fetch_sheet(sheet_name):
    params = urllib.parse.urlencode({
        "tqx": "out:csv",
        "sheet": sheet_name,
    })
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")
    if text.lstrip().startswith("<!DOCTYPE") or "accounts.google.com" in text[:1000]:
        raise RuntimeError(f"Google Sheet '{sheet_name}' is not publicly readable")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        clean = {str(k).strip(): ("" if v is None else str(v).strip()) for k, v in row.items() if k is not None}
        if any(clean.values()):
            rows.append(clean)
    return rows


def main():
    raw = fetch_sheet(RAW_SHEET)
    disputes = fetch_sheet(DISPUTE_SHEET)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sheet_id": SHEET_ID,
        "raw_sheet": RAW_SHEET,
        "rows": raw,
        "disputes": disputes,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(raw)} raw rows and {len(disputes)} dispute rows to {OUT}")


if __name__ == "__main__":
    main()
