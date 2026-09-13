// components/dashboard/ModelPerformancePanel.jsx
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Honest dynamic summary based on actual metric values ─────────────────────
function getSummary(auc, precision, recall, bestModelName) {
  const model = bestModelName || "The model";

  if (auc >= 0.80 && precision >= 0.70) {
    return `${model} shows strong classification performance (AUC ${auc}). High precision means few false alarms, and recall of ${recall} captures most real risk events.`;
  }
  if (auc >= 0.70) {
    return `${model} shows moderate discriminative ability (AUC ${auc}). Precision of ${precision} is limited — some false positives are expected. Useful as an early signal, not a sole decision tool.`;
  }
  if (auc >= 0.60) {
    return `${model} performance is below average (AUC ${auc}). With precision at ${precision}, the model produces a meaningful number of false alarms. Consider adding more features or extending the training window.`;
  }
  return `${model} is performing near-random (AUC ${auc}). The current features may not be sufficient to discriminate risk events for this ticker. Results should be interpreted with caution.`;
}

// ── Colour-code a metric value ────────────────────────────────────────────────
function metricColor(key, value) {
  const thresholds = {
    auc:       [0.80, 0.70],   // green ≥ 0.80, yellow ≥ 0.70, red below
    precision: [0.70, 0.50],
    recall:    [0.70, 0.50],
    accuracy:  [80,   65],
  };
  const [good, ok] = thresholds[key] || [0.75, 0.60];
  if (value >= good) return "text-[#00AB55]";
  if (value >= ok)   return "text-yellow-400";
  return "text-red-400";
}

function ModelPerformancePanel({ performanceData, bestModel }) {
  const [showCharts, setShowCharts] = useState(true);

  if (!performanceData) return null;

  const { auc, precision, recall, accuracy, roc_curve, pr_curve } = performanceData;
  const bestModelName = bestModel?.name;

  const kpis = [
    { label: "ROC-AUC",   key: "auc",      value: auc,      display: auc },
    { label: "Precision",  key: "precision", value: precision, display: precision },
    { label: "Recall",     key: "recall",    value: recall,   display: recall },
    { label: "Accuracy",   key: "accuracy",  value: accuracy, display: `${accuracy}%` },
  ];

  const summary = getSummary(auc, precision, recall, bestModelName);

  // Summarise whether summary is a warning
  const isWeakModel = auc < 0.70;

  return (
    <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Model Performance Metrics</h2>
          <p className="text-slate-400 text-sm mt-1">
            Evaluation metrics for the{" "}
            <span className="text-white font-medium">{bestModelName || "prediction"}</span> model.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {bestModelName && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/10 text-[#00AB55] border border-green-500/20">
              ✓ {bestModelName}
            </span>
          )}
          <button
            onClick={() => setShowCharts((v) => !v)}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition"
          >
            {showCharts ? "Hide Charts" : "Show Charts"}
          </button>
        </div>
      </div>

      {/* KPI cards — colour-coded by actual value */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, key, value, display }) => (
          <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-2">{label}</p>
            <p className={`text-3xl font-bold font-mono ${metricColor(key, value)}`}>
              {display}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ROC Curve */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-1">ROC Curve</h3>
            <p className="text-xs text-slate-500 mb-4">
              AUC = {auc} — area under this curve. Closer to top-left corner = better.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={roc_curve} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "FPR", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "TPR", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} formatter={(v) => v.toFixed(3)} />
                {/* Random classifier baseline */}
                <ReferenceLine x={0} y={0} stroke="#334155" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="y" stroke="#00AB55" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PR Curve */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-1">Precision-Recall Curve</h3>
            <p className="text-xs text-slate-500 mb-4">
              High precision = fewer false alarms. High recall = fewer missed events.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pr_curve} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "Recall", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "Precision", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} formatter={(v) => v.toFixed(3)} />
                <Line type="monotone" dataKey="y" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dynamic honest summary */}
      <div className={`rounded-xl px-5 py-4 flex items-start gap-3 ${
        isWeakModel
          ? "bg-yellow-500/5 border border-yellow-500/15"
          : "bg-slate-800/60 border border-slate-700/50"
      }`}>
        <span className={`text-base shrink-0 mt-0.5 ${isWeakModel ? "text-yellow-400" : "text-[#00AB55]"}`}>
          {isWeakModel ? "⚠" : "✓"}
        </span>
        <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
      </div>

      <p className="text-xs text-slate-600 mt-3">
        Metrics evaluated on held-out 20% test set · Stratified split · Random seed 42
      </p>
    </div>
  );
}

export default ModelPerformancePanel;