# Quantum Inventory & Order Management System

A high-performance, full-stack supply chain application built with **React**, **FastAPI**, and **PostgreSQL**. Featuring a modern dark glassmorphic dashboard, responsive layout, live inventory stock validations, and automatic price calculations.

---

## Technical Stack
- **Frontend:** React (Vite, Vanilla CSS, Lucide Icons)
- **Backend:** Python (FastAPI, SQLAlchemy ORM, Pydantic data validation)
- **Database:** PostgreSQL
- **Containerization:** Docker & Docker Compose

---

## Features
- **Dashboard Analytics:** Live summaries of products, customers, and orders with automated alerts for low stock items.
- **Product Catalog:** Full CRUD operations on products with SKU uniqueness checks and non-negative quantity validations.
- **Customer Directory:** Register customers and track profiles with email format and uniqueness validation.
- **Order Processing:** Create orders containing multiple products with:
  - Client-side stock availability checks.
  - Backend transaction safety (automatically reduces product quantities upon order completion).
  - Automatic total amount calculation in backend database.
  - Detailed Order Registry showing historic item quantities and prices.
  - Deleting/canceling an order automatically returns the quantities back to inventory stock.

---

## Project Structure
```
inventory-order-system/
├── backend/
│   ├── app/
│   │   ├── routes/              # FastAPI Router files (products, customers, orders)
│   │   ├── config.py            # App settings loading (Pydantic Settings)
│   │   ├── database.py          # SQLAlchemy Session and Engine
│   │   ├── models.py            # Database tables schema
│   │   ├── schemas.py           # Input and response validation
│   │   ├── crud.py              # Core business logic / DB transactions
│   │   └── main.py              # Main app entrypoint, CORS, auto-migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React layout modules (Dashboard, Managers, Modals)
│   │   ├── utils/
│   │   │   └── api.js           # API wrapper for network calls
│   │   ├── App.jsx              # Application state and navigation skeleton
│   │   ├── index.css            # Custom HSL-theme CSS variables & glassmorphism styles
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Getting Started: running with Docker (Recommended)

Ensure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

1. Open a terminal in the project root directory.
2. Build and start the services in the background:
   ```bash
   docker compose up --build -d
   ```
3. Once running, access the services:
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **FastAPI Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **API Root Check:** [http://localhost:8000/](http://localhost:8000/)

4. To stop the containers:
   ```bash
   docker compose down
   ```

---

## Local Development (Without Docker)

### Prerequisites
- Python 3.10+
- Node.js 18+
- A running PostgreSQL server (port 5432)

### 1. Set Up PostgreSQL
Create a database named `inventory_db` on your local PostgreSQL engine.

### 2. Configure Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (Command Prompt)
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (create a `.env` file in `backend/` or set directly):
   ```bash
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/inventory_db
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will start at [http://localhost:8000](http://localhost:8000).

### 3. Configure Frontend
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend will start at [http://localhost:5173](http://localhost:5173).

---

## Deployment Guidelines

### 1. Backend (Render / Railway / Fly.io)
- **Database:** Spin up a hosted PostgreSQL database instance on Render or Supabase, and copy the Connection URL string.
- **FastAPI Service:** Deploy the backend directory as a Web Service.
  - Set Build Command to: `pip install -r requirements.txt`
  - Set Start Command to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Set Environment Variables:
    - `DATABASE_URL`: Your hosted PostgreSQL connection string.

### 2. Frontend (Vercel / Netlify)
- Deploy the frontend directory as a static SPA.
- Set Build Command to: `npm run build`
- Set Output Directory to: `dist`
- Set Environment Variables:
  - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://your-backend-service.onrender.com`).
