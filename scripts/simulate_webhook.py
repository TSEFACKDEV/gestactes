#!/usr/bin/env python3
"""Simule un webhook GitHub signé pour le développement local.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
Exemple :
    python scripts/simulate_webhook.py \
      --event pull_request \
      --delivery local-001 \
      --payload data/demo/webhook_pr_merged.json
"""

import argparse
import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request
from pathlib import Path


def build_payload(path: str | None) -> bytes:
    if path:
        return Path(path).read_bytes()
    return json.dumps(
        {"action": "closed", "pull_request": {"merged": True, "number": 1}}
    ).encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Simule un webhook GitHub.")
    parser.add_argument("--event", default="pull_request")
    parser.add_argument("--delivery", default="local-001")
    parser.add_argument("--payload", default=None)
    parser.add_argument(
        "--url",
        default="http://localhost:8000/api/v1/webhooks/github",
    )
    parser.add_argument(
        "--secret",
        default=os.environ.get("GITHUB_WEBHOOK_SECRET", "change-me"),
    )
    args = parser.parse_args()

    body = build_payload(args.payload)
    signature = "sha256=" + hmac.new(
        args.secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    request = urllib.request.Request(
        args.url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-GitHub-Event": args.event,
            "X-GitHub-Delivery": args.delivery,
            "X-Hub-Signature-256": signature,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            print(f"HTTP {response.status}")
            print(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"HTTP {exc.code}")
        print(exc.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        print(f"Impossible de joindre {args.url} : {exc.reason}")


if __name__ == "__main__":
    main()
