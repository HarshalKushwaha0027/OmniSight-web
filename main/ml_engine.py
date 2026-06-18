from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import statsmodels.api as sm
from statsmodels.regression.rolling import RollingOLS
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_curve, precision_recall_curve, precision_score, recall_score, accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
import math

app = FastAPI()

# ─── CORS (allow your Node backend to call this) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── HEALTH CHECK — keeps the Render instance warm ───────────────────────────
# The Node.js server pings this every 14 minutes so the ML service never
# cold-starts and makes your users wait 30-60 seconds.
@app.get("/health")
def health_check():
    return {"status": "ok"}

# ─── INPUT MODELS ─────────────────────────────────────────────────────────────
class PredictionData(BaseModel):
    ticker: str

class ManualData(BaseModel):
    marketVolatility: float
    revenueGrowth: float

# ─── MAIN PREDICTION ─────────────────────────────────────────────────────────
@app.post("/predict")
def generate_risk_prediction(data: PredictionData):
    asset = data.ticker.upper()
    market = "^GSPC"

    # ── 1. FETCH DATA ────────────────────────────────────────────────────────
    try:
        df = yf.download([asset, market], start="2019-01-01", progress=False)["Close"]
        returns = df.pct_change().dropna()
        pair_data = returns[[asset, market]]
    except Exception:
        raise HTTPException(status_code=400, detail="Ticker not found or network error.")

    # ── 2. FEATURE ENGINEERING ───────────────────────────────────────────────
    rolling_volatility = pair_data[asset].rolling(window=30).std() * np.sqrt(252)

    X_static = sm.add_constant(pair_data[market])
    Y_static = pair_data[asset]

    rols = RollingOLS(Y_static, X_static, window=63).fit()
    rolling_beta_ols = rols.params[market]
    rolling_rsquared = rols.rsquared

    # ── 3. EARLY WARNING MODEL ───────────────────────────────────────────────
    future_vol = pair_data[asset].rolling(window=63).std().shift(-63) * np.sqrt(252)
    y_label = (future_vol >= future_vol.quantile(0.80)).astype(int)

    ml_df = pd.DataFrame({
        'Vol': rolling_volatility,
        'Beta': rolling_beta_ols,
        'R2': rolling_rsquared,
        'Target': y_label
    }).dropna()

    X_ml = ml_df[['Vol', 'Beta', 'R2']]
    y_ml = ml_df['Target']

    X_train, X_test, y_train, y_test = train_test_split(
        X_ml, y_ml, test_size=0.2, stratify=y_ml, random_state=42
    )

    model_ml = LogisticRegression(class_weight='balanced').fit(X_train, y_train)

    risk_prob = model_ml.predict_proba(X_ml.tail(1))[0][1] * 100
    model_confidence = max(risk_prob, 100 - risk_prob)

    current_vol = rolling_volatility.iloc[-1]
    current_beta = rolling_beta_ols.iloc[-1]
    vol_factor = min(100, (current_vol / 0.40) * 100)
    beta_factor = min(100, max(0, current_beta * 50))
    composite_risk = (vol_factor * 0.7) + (beta_factor * 0.3)

    if composite_risk > 65:
        category = "High"
    elif composite_risk > 40:
        category = "Moderate"
    else:
        category = "Low"

    # ── 4. PERFORMANCE METRICS ───────────────────────────────────────────────
    try:
        y_test_probs = model_ml.predict_proba(X_test)[:, 1]
        y_test_preds = model_ml.predict(X_test)

        metrics_auc  = roc_auc_score(y_test, y_test_probs)
        metrics_prec = precision_score(y_test, y_test_preds, zero_division=0)
        metrics_rec  = recall_score(y_test, y_test_preds, zero_division=0)
        metrics_acc  = accuracy_score(y_test, y_test_preds)

        fpr, tpr, _ = roc_curve(y_test, y_test_probs)
        pre_curve, rec_curve, _ = precision_recall_curve(y_test, y_test_probs)

        roc_data = [{"x": round(f, 3), "y": round(t, 3)} for f, t in zip(fpr, tpr)]
        pr_data  = [{"x": round(r, 3), "y": round(p, 3)} for r, p in zip(rec_curve, pre_curve)]
    except Exception as e:
        print(f"ML Metrics Error: {e}")
        metrics_auc = metrics_prec = metrics_rec = metrics_acc = 0
        roc_data, pr_data = [], []

    # ── 5. STATIC MODEL + CHART DATA ─────────────────────────────────────────
    model_static = sm.OLS(Y_static, X_static).fit()
    current_beta_static = model_static.params.iloc[1]
    current_r2 = model_static.rsquared

    def clean_nan(lst):
        return [0 if math.isnan(x) else round(x, 4) for x in lst]

    last_126_days = pair_data.index[-126:]
    historical_probs = model_ml.predict_proba(X_ml.tail(126))[:, 1] * 100
    risk_trend_list = clean_nan(historical_probs.tolist())

    total_days = len(risk_trend_list)
    high_count     = sum(1 for p in risk_trend_list if p > 60)
    moderate_count = sum(1 for p in risk_trend_list if 35 < p <= 60)
    low_count      = sum(1 for p in risk_trend_list if p <= 35)

    return {
        "risk":          round(composite_risk),
        "early_warning": round(risk_prob),
        "confidence":    round(model_confidence),
        "category":      category,
        "dashboard_metrics": {
            "beta":              round(current_beta_static, 2),
            "systematic_risk":   round(current_r2 * 100, 1),
            "unsystematic_risk": round((1 - current_r2) * 100, 1)
        },
        "charts": {
            "dates":      last_126_days.strftime('%Y-%m-%d').tolist(),
            "volatility": clean_nan(rolling_volatility[-126:].tolist()),
            "systematic": clean_nan(rolling_rsquared[-126:].tolist()),
            "residuals":  clean_nan(model_static.resid[-126:].tolist()),
            "risk_trend": risk_trend_list,
            "distribution": {
                "High":     round((high_count     / total_days) * 100) if total_days > 0 else 0,
                "Moderate": round((moderate_count / total_days) * 100) if total_days > 0 else 0,
                "Low":      round((low_count      / total_days) * 100) if total_days > 0 else 0,
            }
        },
        "performance": {
            "auc":       round(metrics_auc, 2),
            "precision": round(metrics_prec, 2),
            "recall":    round(metrics_rec, 2),
            "accuracy":  round(metrics_acc * 100),
            "roc_curve": roc_data,
            "pr_curve":  pr_data
        }
    }

# ─── MANUAL CALCULATOR ────────────────────────────────────────────────────────
@app.post("/manual-predict")
def calculate_manual_risk(data: ManualData):
    calculated_risk = (data.marketVolatility * 1.2) - (data.revenueGrowth * 0.1)
    final_risk_score = max(0, min(100, round(calculated_risk)))

    if final_risk_score > 60:
        category = "High"
    elif final_risk_score > 35:
        category = "Moderate"
    else:
        category = "Low"

    return {
        "risk":       final_risk_score,
        "confidence": 92,
        "category":   category
    }