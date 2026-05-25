from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yfinance as yf
import statsmodels.api as sm
from statsmodels.regression.rolling import RollingOLS
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
import math
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_curve, precision_recall_curve, precision_score, recall_score, accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split # <--- ADD THIS LINE
app = FastAPI()

# 1. Update the expected input to match your Streamlit logic (A Ticker Symbol)
class PredictionData(BaseModel):
    ticker: str

@app.post("/predict")
def generate_risk_prediction(data: PredictionData):
    asset = data.ticker.upper()
    market = "^GSPC" # S&P 500 benchmark
    
    # -------- 1. FETCH DATA --------
    try:
        tickers = [asset, market]
        # Adding progress=False keeps your terminal clean from download bars
        df = yf.download(tickers, start="2019-01-01", progress=False)["Close"]
        returns = df.pct_change().dropna()
        pair_data = returns[[asset, market]]
    except Exception as e:
        raise HTTPException(status_code=400, detail="Ticker not found or network error.")

    # -------- 2. FEATURE ENGINEERING --------
    rolling_volatility = pair_data[asset].rolling(window=30).std() * np.sqrt(252)
    
    X_static = sm.add_constant(pair_data[market])
    Y_static = pair_data[asset]
    
    rols = RollingOLS(Y_static, X_static, window=63).fit()
    rolling_beta_ols = rols.params[market]
    rolling_rsquared = rols.rsquared

    # -------- 3. EARLY WARNING MODEL (ML) --------
    
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

    
    # Stratify ensures both Train and Test sets get a proportional mix of 0s and 1s!
    X_train, X_test, y_train, y_test = train_test_split(
        X_ml, y_ml, test_size=0.2, stratify=y_ml, random_state=42
    )

    # Train Logistic Regression
    model_ml = LogisticRegression(class_weight='balanced').fit(X_train, y_train)
    
    # 1. EARLY WARNING (Future ML Probability)
    risk_prob = model_ml.predict_proba(X_ml.tail(1))[0][1] * 100

    # 2. DYNAMIC CONFIDENCE
    # If prob is 26%, it is 74% confident in "Low Risk". If prob is 85%, it's 85% confident.
    model_confidence = max(risk_prob, 100 - risk_prob)

    # 3. CURRENT RISK SCORE (Composite of Today's Volatility & Beta)
    current_vol = rolling_volatility.iloc[-1]
    current_beta = rolling_beta_ols.iloc[-1]
    
    # Scale them to a 0-100 score (Assuming 40% vol and 2.0 Beta are "Max Risk")
    vol_factor = min(100, (current_vol / 0.40) * 100)
    beta_factor = min(100, max(0, current_beta * 50)) 
    composite_risk = (vol_factor * 0.7) + (beta_factor * 0.3)

    if composite_risk > 65:
        category = "High"
    elif composite_risk > 40:
        category = "Moderate"
    else:
        category = "Low"

    # --- CALCULATE PERFORMANCE METRICS ---
    try:
        y_test_probs = model_ml.predict_proba(X_test)[:, 1]
        y_test_preds = model_ml.predict(X_test)

        metrics_auc = roc_auc_score(y_test, y_test_probs)
        metrics_prec = precision_score(y_test, y_test_preds, zero_division=0)
        metrics_rec = recall_score(y_test, y_test_preds, zero_division=0)
        metrics_acc = accuracy_score(y_test, y_test_preds)

        # Get coordinates for the curves
        fpr, tpr, _ = roc_curve(y_test, y_test_probs)
        pre_curve, rec_curve, _ = precision_recall_curve(y_test, y_test_probs)

        # Format for React charts
        roc_data = [{"x": round(f, 3), "y": round(t, 3)} for f, t in zip(fpr, tpr)]
        pr_data = [{"x": round(r, 3), "y": round(p, 3)} for r, p in zip(rec_curve, pre_curve)]
        
    except Exception as e:
        # --- ADD A PRINT HERE SO WE CAN SEE ANY FUTURE ERRORS ---
        print(f"ML Metrics Error: {e}")
        
        metrics_auc = metrics_prec = metrics_rec = metrics_acc = 0
        roc_data, pr_data = [], []


    # Calculate current metrics for your dashboard cards
    model_static = sm.OLS(Y_static, X_static).fit()
    current_beta_static = model_static.params.iloc[1]
    current_r2 = model_static.rsquared

    # --- NEW: EXTRACT DATA FOR CHARTS (Last 126 days) ---
    def clean_nan(lst):
        return [0 if math.isnan(x) else round(x, 4) for x in lst]

    last_126_days = pair_data.index[-126:]
    
    # Run the ML model on the last 126 days for the Risk Trend line
    historical_probs = model_ml.predict_proba(X_ml.tail(126))[:, 1] * 100
    risk_trend_list = clean_nan(historical_probs.tolist())
    
    # Calculate percentages for the Pie Chart Distribution
    total_days = len(risk_trend_list)
    high_count = sum(1 for p in risk_trend_list if p > 60)
    moderate_count = sum(1 for p in risk_trend_list if 35 < p <= 60)
    low_count = sum(1 for p in risk_trend_list if p <= 35)

    # -------- 4. RETURN DATA TO NODE.JS --------
    return {
        "risk": round(composite_risk),      # The new Current Risk Score
        "early_warning": round(risk_prob),  # The future ML Probability
        "confidence": round(model_confidence), # The new dynamic confidence
        "category": category,
        "dashboard_metrics": {
            "beta": round(current_beta_static, 2),
            "systematic_risk": round(current_r2 * 100, 1),
            "unsystematic_risk": round((1 - current_r2) * 100, 1)
        },
        "charts": {
            "dates": last_126_days.strftime('%Y-%m-%d').tolist(),
            "volatility": clean_nan(rolling_volatility[-126:].tolist()),
            "systematic": clean_nan(rolling_rsquared[-126:].tolist()),
            "residuals": clean_nan(model_static.resid[-126:].tolist()),
            # --- NEW DATA FOR THE LAST TWO CHARTS ---
            "risk_trend": risk_trend_list,
            "distribution": {
                "High": round((high_count / total_days) * 100) if total_days > 0 else 0,
                "Moderate": round((moderate_count / total_days) * 100) if total_days > 0 else 0,
                "Low": round((low_count / total_days) * 100) if total_days > 0 else 0
            }
        },

        # ... your existing charts dictionary ...
        "performance": {
            "auc": round(metrics_auc, 2),
            "precision": round(metrics_prec, 2),
            "recall": round(metrics_rec, 2),
            "accuracy": round(metrics_acc * 100),
            "roc_curve": roc_data,
            "pr_curve": pr_data
        }
    }

    # --- MANUAL CALCULATOR ROUTE ---
# 1. Define the expected incoming data for the calculator
class ManualData(BaseModel):
    marketVolatility: float
    revenueGrowth: float

# 2. Create the new specific endpoint
@app.post("/manual-predict")
def calculate_manual_risk(data: ManualData):
    
    # Run the simple manual formula
    calculated_risk = (data.marketVolatility * 1.2) - (data.revenueGrowth * 0.1)
    
    # Keep it between 0 and 100
    final_risk_score = max(0, min(100, round(calculated_risk)))
    
    # Determine Category
    if final_risk_score > 60:
        category = "High"
    elif final_risk_score > 35:
        category = "Moderate"
    else:
        category = "Low"

    return {
        "risk": final_risk_score,
        "confidence": 92, # Static for manual calculations
        "category": category
    }