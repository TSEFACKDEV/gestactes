"""Permet `python -m app.worker`.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER


TODO : maintenir l'entrée `python -m app.worker`.
"""

import asyncio

from app.worker.main import run

if __name__ == "__main__":
    asyncio.run(run())
