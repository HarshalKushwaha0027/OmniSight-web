from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yfinance as yf
import statsmodels.api as sm
from statsmodels.regression.rolling import RollingOLS
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    roc_curve, precision_recall_curve,
    precision_score, recall_score, accuracy_score,
    roc_auc_score, f1_score
)
from sklearn.model_selection import train_test_split
import shap
import math

app = FastAPI()

FEATURE_LABELS = {
    "Vol":  "Volatility",
    "Beta": "Market Beta",
    "R2":   "Systematic Risk (R²)",
}

# ─── Helper: evaluate any trained classifier on the test set ─────────────────
def evaluate_model(model, X_test, y_test):
    """Returns a dict of metrics for one model."""
    try:
        probs = model.predict_proba(X_test)[:, 1]
        preds = model.predict(X_test)
        return {
            "auc":       round(roc_auc_score(y_test, probs), 3),
            "precision": round(precision_score(y_test, preds, zero_division=0), 3),
            "recall":    round(recall_score(y_test, preds, zero_division=0), 3),
            "f1":        round(f1_score(y_test, preds, zero_division=0), 3),
            "accuracy":  round(accuracy_score(y_test, preds) * 100, 1),
        }
    except Exception as e:
        print(f"evaluate_model error: {e}")
        return {"auc": 0, "precision": 0, "recall": 0, "f1": 0, "accuracy": 0}


# ─── Helper: SHAP drivers for the best model ─────────────────────────────────
def get_shap_drivers(best_model, model_name, X_train, X_ml):
    """
    Returns (drivers list, base_value).
    Uses LinearExplainer for LR, TreeExplainer for RF / GBM.
    """
    try:
        latest_row = X_ml.tail(1)

        if model_name == "Logistic Regression":
            explainer = shap.LinearExplainer(
                best_model, X_train, feature_perturbation="interventional"
            )
            shap_vals = explainer.shap_values(latest_row)
            # LinearExplainer returns a list [class-0-array, class-1-array]
            raw = shap_vals[1][0] if isinstance(shap_vals, list) else shap_vals[0]
            base = explainer.expected_value
            base_val = float(base[1] if isinstance(base, (list, np.ndarray)) else base)

        else:
            # TreeExplainer works for both RandomForest and GradientBoosting
            explainer = shap.TreeExplainer(best_model)
            shap_vals = explainer.shap_values(latest_row)
            # RF returns [class-0, class-1]; GBM returns a single array
            if isinstance(shap_vals, list):
                raw = shap_vals[1][0]
                base = explainer.expected_value[1]
            else:
                raw = shap_vals[0]
                base = explainer.expected_value
            base_val = float(base)

        feature_names = ["Vol", "Beta", "R2"]
        drivers = []
        for fname, sv in zip(feature_names, raw):
            drivers.append({
                "feature":    FEATURE_LABELS[fname],
                "raw_name":   fname,
                "shap_value": round(float(sv), 4),
                "direction":  "increases" if sv > 0 else "decreases",
                "impact_pct": round(abs(float(sv)) * 100, 1),
            })
        drivers.sort(key=lambda d: abs(d["shap_value"]), reverse=True)

        return drivers, round(base_val * 100, 1)

    except Exception as e:
        print(f"SHAP Error ({model_name}): {e}")
        return [], 50


# ─── Input schema ─────────────────────────────────────────────────────────────
class PredictionData(BaseModel):
    ticker: str


# ─── Main prediction endpoint ─────────────────────────────────────────────────
@app.post("/predict")
def generate_risk_prediction(data: PredictionData):
    asset  = data.ticker.upper()
    market = "^GSPC"

    # -------- 1. FETCH DATA --------
    try:
        df        = yf.download([asset, market], start="2019-01-01", progress=False)["Close"]
        returns   = df.pct_change().dropna()
        pair_data = returns[[asset, market]]
    except Exception:
        raise HTTPException(status_code=400, detail="Ticker not found or network error.")

    # -------- 2. FEATURE ENGINEERING --------
    rolling_volatility = pair_data[asset].rolling(window=30).std() * np.sqrt(252)

    X_static = sm.add_constant(pair_data[market])
    Y_static = pair_data[asset]

    rols             = RollingOLS(Y_static, X_static, window=63).fit()
    rolling_beta_ols = rols.params[market]
    rolling_rsquared = rols.rsquared

    # -------- 3. BUILD ML DATASET --------
    future_vol = pair_data[asset].rolling(window=63).std().shift(-63) * np.sqrt(252)
    y_label    = (future_vol >= future_vol.quantile(0.80)).astype(int)

    ml_df = pd.DataFrame({
        "Vol":    rolling_volatility,
        "Beta":   rolling_beta_ols,
        "R2":     rolling_rsquared,
        "Target": y_label,
    }).dropna()

    X_ml = ml_df[["Vol", "Beta", "R2"]]
    y_ml = ml_df["Target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X_ml, y_ml, test_size=0.2, stratify=y_ml, random_state=42
    )

    # -------- 4. TRAIN ALL THREE MODELS --------
    models = {
        "Logistic Regression": LogisticRegression(class_weight="balanced", max_iter=1000),
        "Random Forest":       RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42),
        "Gradient Boosting":   GradientBoostingClassifier(n_estimators=100, random_state=42),
    }

    trained   = {}
    comparison = []   # list of dicts for the frontend comparison table

    for name, clf in models.items():
        clf.fit(X_train, y_train)
        trained[name] = clf
        metrics = evaluate_model(clf, X_test, y_test)
        comparison.append({
            "model":     name,
            "auc":       metrics["auc"],
            "precision": metrics["precision"],
            "recall":    metrics["recall"],
            "f1":        metrics["f1"],
            "accuracy":  metrics["accuracy"],
        })

    # -------- 5. PICK THE BEST MODEL (by AUC) --------
    best_entry      = max(comparison, key=lambda m: m["auc"])
    best_model_name = best_entry["model"]
    best_model      = trained[best_model_name]

    print(f"[{asset}] Best model: {best_model_name} (AUC {best_entry['auc']})")

    # -------- 6. RISK SCORE (uses best model) --------
    risk_prob        = best_model.predict_proba(X_ml.tail(1))[0][1] * 100
    model_confidence = max(risk_prob, 100 - risk_prob)

    current_vol  = rolling_volatility.iloc[-1]
    current_beta = rolling_beta_ols.iloc[-1]

    vol_factor     = min(100, (current_vol / 0.40) * 100)
    beta_factor    = min(100, max(0, current_beta * 50))
    composite_risk = (vol_factor * 0.7) + (beta_factor * 0.3)

    if composite_risk > 65:
        category = "High"
    elif composite_risk > 40:
        category = "Moderate"
    else:
        category = "Low"

    # -------- 7. SHAP (on best model) --------
    drivers, base_value = get_shap_drivers(best_model, best_model_name, X_train, X_ml)

    # -------- 8. ROC + PR curves (best model on test set) --------
    try:
        y_test_probs = best_model.predict_proba(X_test)[:, 1]
        fpr, tpr, _              = roc_curve(y_test, y_test_probs)
        pre_curve, rec_curve, _  = precision_recall_curve(y_test, y_test_probs)
        roc_data = [{"x": round(f, 3), "y": round(t, 3)} for f, t in zip(fpr, tpr)]
        pr_data  = [{"x": round(r, 3), "y": round(p, 3)} for r, p in zip(rec_curve, pre_curve)]
    except Exception as e:
        print(f"Curve error: {e}")
        roc_data, pr_data = [], []

    # -------- 9. STATIC OLS METRICS --------
    model_static        = sm.OLS(Y_static, X_static).fit()
    current_beta_static = model_static.params.iloc[1]
    current_r2          = model_static.rsquared

    # -------- 10. CHART DATA (based on best model) --------
    def clean_nan(lst):
        return [0 if math.isnan(x) else round(x, 4) for x in lst]

    last_126_days    = pair_data.index[-126:]
    historical_probs = best_model.predict_proba(X_ml.tail(126))[:, 1] * 100
    risk_trend_list  = clean_nan(historical_probs.tolist())

    total_days     = len(risk_trend_list)
    high_count     = sum(1 for p in risk_trend_list if p > 60)
    moderate_count = sum(1 for p in risk_trend_list if 35 < p <= 60)
    low_count      = sum(1 for p in risk_trend_list if p <= 35)

    # -------- 11. RETURN --------
    return {
        "risk":          round(composite_risk),
        "early_warning": round(risk_prob),
        "confidence":    round(model_confidence),
        "category":      category,

        # Which model was selected and why
        "best_model": {
            "name":    best_model_name,
            "metrics": best_entry,
        },

        # Full comparison table — all three models side by side
        "model_comparison": comparison,

        # SHAP explanation (from best model)
        "explanation": {
            "base_value": base_value,
            "drivers":    drivers,
            "summary": (
                f"{drivers[0]['feature']} is the biggest risk driver "
                f"({'increasing' if drivers[0]['shap_value'] > 0 else 'reducing'} risk) "
                f"· explained by {best_model_name}"
                if drivers else "No explanation available."
            ),
        },

        "dashboard_metrics": {
            "beta":              round(current_beta_static, 2),
            "systematic_risk":   round(current_r2 * 100, 1),
            "unsystematic_risk": round((1 - current_r2) * 100, 1),
        },
        "charts": {
            "dates":      last_126_days.strftime("%Y-%m-%d").tolist(),
            "volatility": clean_nan(rolling_volatility[-126:].tolist()),
            "systematic": clean_nan(rolling_rsquared[-126:].tolist()),
            "residuals":  clean_nan(model_static.resid[-126:].tolist()),
            "risk_trend": risk_trend_list,
            "distribution": {
                "High":     round((high_count    / total_days) * 100) if total_days > 0 else 0,
                "Moderate": round((moderate_count / total_days) * 100) if total_days > 0 else 0,
                "Low":      round((low_count     / total_days) * 100) if total_days > 0 else 0,
            },
        },
        "performance": {
            "auc":       best_entry["auc"],
            "precision": best_entry["precision"],
            "recall":    best_entry["recall"],
            "accuracy":  best_entry["accuracy"],
            "roc_curve": roc_data,
            "pr_curve":  pr_data,
        },
    }


# ─── Manual calculator (unchanged) ───────────────────────────────────────────
class ManualData(BaseModel):
    marketVolatility: float
    revenueGrowth:    float

@app.post("/manual-predict")
def calculate_manual_risk(data: ManualData):
    calculated_risk  = (data.marketVolatility * 1.2) - (data.revenueGrowth * 0.1)
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
        "category":   category,
    }