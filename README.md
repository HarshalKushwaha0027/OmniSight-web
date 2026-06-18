# 👁️ OmniSight: Predictive Risk Analysis Dashboard

OmniSight is a comprehensive, full-stack financial technology platform designed to analyze, visualize, and predict market risk. By combining real-time market data with machine learning algorithms, OmniSight provides users with dynamic risk scores, future volatility warnings, and historical insight tracking.

## 🚀 Live Demo
* **Frontend:** [https://omni-sight-web.vercel.app/]
* **Backend API:** [https://omnisight-api.onrender.com]
* **ML Engine:** [https://omnisight-ml-engine.onrender.com]

---

## 🏗️ Architecture & Tech Stack

This project utilizes a modern microservices architecture housed within a single monorepo:

* **Frontend (User Interface):** React.js, Vite, Tailwind CSS, Recharts
* **Backend (API Gateway & Database Routing):** Node.js, Express.js, Mongoose
* **Machine Learning Engine:** Python, FastAPI, Scikit-Learn, Statsmodels, yfinance
* **Database:** MongoDB Atlas
* **Deployment:** Vercel (Frontend) & Render (Backend & ML Engine)

---

## ✨ Key Features

* **Real-Time Ticker Search:** Live autocomplete search powered by the Yahoo Finance API with customized debouncing to prevent rate limiting.
* **Predictive ML Modeling:** Evaluates systematic vs. unsystematic risk using rolling OLS regressions and predicts future high-volatility events using Logistic Regression.
* **Dynamic Dashboards:** Visualizes confidence intervals, historical risk trends, and performance metrics (ROC/AUC, Precision-Recall) using interactive charts.
* **Manual Calculator:** Allows users to input hypothetical market volatility and revenue growth to calculate custom risk thresholds.
* **Persistent History:** Automatically logs predictions to MongoDB, allowing users to track and review recent insights.

---

## 📁 Repository Structure

```text
OmniSight/
├── frontend/             # React/Vite web application
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/              # Node.js/Express API server
│   ├── controllers/      # Route logic & ML engine communication
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   └── server.js         # Express entry point
└── main/                 # Python/FastAPI Machine Learning Engine
    ├── ml_engine.py      # Data fetching, model training, and prediction logic
    └── requirements.txt  # Python dependencies
```

# Local Development Setup

To run OmniSight locally, open **three separate terminal windows** to run the microservices simultaneously.

---

# 1. Machine Learning Engine (Python)

Navigate to the `main` directory, install dependencies, and start the FastAPI server.

```bash
cd main
pip install -r requirements.txt
python -m uvicorn ml_engine:app --reload --port 8000
```

The ML engine will run locally on:

```txt
http://127.0.0.1:8000
```

---

# 2. Backend API (Node.js / Express)

Navigate to the `backend` directory, install dependencies, configure environment variables, and start the Express server.

```bash
cd backend
npm install
npm run dev
```

## Required `.env` Variables

Create a `.env` file inside the `backend` directory and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
pythonResponse=[http://127.0.0.1:8000](http://127.0.0.1:8000)
```

> Keep `pythonResponse` set to localhost for local testing, or replace it with the deployed Render ML API URL when testing against the cloud engine.

---

# 3. Frontend (React / Vite)

Navigate to the `frontend` directory, install dependencies, and start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```

Frontend typically runs on:

```txt
http://localhost:5173
```

---

# API Reference

---

# Backend Routes (Node.js / Express)

Production Base URL:

```txt
https://omnisight-api.onrender.com
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/predict` | Fetches ML prediction for a specific ticker (`req.body.ticker`) and logs it to MongoDB. |
| POST | `/api/manual-predict` | Calculates a custom risk score based on manual volatility and revenue inputs. |
| GET | `/api/search?q={query}` | Returns live autocomplete ticker suggestions from Yahoo Finance. |
| GET | `/api/History` | Retrieves the 5 most recent risk insights from the database. |
| GET | `/api/History/all` | Retrieves up to 100 historical insights for the full history page. |

---

# ML Engine Routes (Python / FastAPI)

Production Base URL:

```txt
https://omnisight-ml-engine.onrender.com
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Ingests a ticker, fetches historical data, runs Logistic Regression and OLS models, and returns the JSON risk payload. |
| POST | `/manual-predict` | Processes the mathematical risk calculation logic for the manual risk calculator. |

---

# Tech Stack

## Frontend
- React
- Vite
- Tailwind CSS

## Backend
- Node.js
- Express.js
- MongoDB

## Machine Learning
- Python
- FastAPI
- Logistic Regression
- OLS Regression

---

# Architecture

```txt
Frontend (React/Vite)
        │
        ▼
Backend API (Node.js/Express)
        │
        ▼
ML Engine (FastAPI/Python)
        │
        ▼
ML Models + Financial Data Processing
```


# Deployment

## Backend Deployment
Hosted on Render:
```txt
https://omnisight-api.onrender.com
```

## ML Engine Deployment
Hosted on Render:
```txt
https://omnisight-ml-engine.onrender.com
```

---

# Running the Full Stack Locally

Open three terminals:

## Terminal 1 — ML Engine

```bash
cd main
python -m uvicorn ml_engine:app --reload --port 8000
```

## Terminal 2 — Backend

```bash
cd backend
npm run dev
```

## Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

---

# Future Improvements

- Real-time market streaming
- Advanced ML ensemble models
- User authentication
- Alert notifications
- Portfolio risk analytics
- Dockerized deployment
- CI/CD integration

---

# License

MIT License
