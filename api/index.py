import os

os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/inventory.db")

from backend.app.main import app
