<div align="center">
  
# 📦 StockSense

**Enterprise Inventory Management System**

A modern, full-stack application for managing inventory, tracking stock movements, and streamlining warehouse operations.

</div>

---

## 🚀 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS (Vanilla CSS structure)
- Lucide React (Icons)

**Backend:**
- Python 3
- Flask
- SQLAlchemy (ORM)
- PyJWT (Authentication)
- SQLite (Local development) / MySQL (Production)

---

## 🛠️ Local Development Setup

To run this project locally, you will need to start both the backend server and the frontend development server.

### 1. Start the Backend API

Open a terminal and navigate to the `backend` folder:

```powershell
cd backend
python -m pip install -r requirements.txt
python run.py
```
*The backend API will run on `http://localhost:5000`.*

### 2. Start the Frontend UI

Open a second, separate terminal and navigate to the `frontend` folder:

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
*The frontend web application will run on `http://localhost:5173`.*

---

## 🔐 Default Login Credentials

When you run the backend for the first time, it automatically creates the necessary database tables and seeds them with default user accounts. 

You can log in to the web interface using either of these accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin/Owner** | `ssksanjeevakumar198@gmail.com` | `password123` |
| **Demo Manager** | `manager@example.com` | `password123` |

---

## 🧪 Running Tests & Verification

If you want to verify the backend logic or build the frontend for production:

```powershell
# Run backend tests
cd backend
python -m pytest backend/tests/test_stock_math.py -q

# Build frontend production bundle
cd frontend
npm run build
```

---

## 💾 Database Configuration (Production)

By default, the app uses a local SQLite file (`stocksense.db`) for easy and safe local development. 

To use a production MySQL database, set the connection string in your environment variables before starting the backend:

```powershell
$env:DATABASE_URL="mysql+pymysql://user:password@host:3306/stocksense"
```
