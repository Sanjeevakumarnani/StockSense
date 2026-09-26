# StockSense

This workspace contains a Flask + SQLAlchemy backend and a React + TypeScript frontend for the StockSense inventory management prototype.

## Backend

From the workspace root:

```powershell
cd backend
python -m pip install -r requirements.txt
python run.py
```

The app will run on `http://localhost:5000`.

Set a MySQL connection string before using the production database:

```powershell
$env:DATABASE_URL="mysql+pymysql://user:password@host:3306/stocksense"
```

If no database URL is set, the app falls back to a local SQLite file for safe local development and tests.

## Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

The web UI will run at `http://localhost:5173`.

## Verification

```powershell
cd backend
python -m pytest backend/tests/test_stock_math.py -q
cd ../frontend
npm run build
```
