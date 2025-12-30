release: cd backend && python init_db.py
web: uvicorn main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}

