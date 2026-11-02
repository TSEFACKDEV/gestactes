"""Exporte le contrat OpenAPI dans docs/openapi.json.

Propriétaire : TSEFACK CALVIN KLEIN
Usage : depuis backend/, `python scripts/export_openapi.py`.
"""

import json
from pathlib import Path

from app.main import create_app


def main() -> None:
    application = create_app(init_database=False)
    output = Path(__file__).resolve().parents[2] / "docs" / "openapi.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(application.openapi(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Contrat OpenAPI exporté : {output}")


if __name__ == "__main__":
    main()
