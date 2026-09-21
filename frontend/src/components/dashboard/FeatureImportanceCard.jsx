// components/dashboard/FeatureImportanceCard.jsx

function FeatureImportanceCard({ featureImportance = [], bestModel = {} }) {
  if (!featureImportance || featureImportance.length === 0) return null;

  const maxImportance = Math.max(...featureImportance.map((f) => f.importance));

  return (
    <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Feature Importance</h2>
          <p className="text-slate-400 text-sm mt-1">
            Which of the 11 engineered features drive this model's predictions.
          </p>
        </div>
        {bestModel?.name && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/10 text-[#00AB55] border border-green-500/20 shrink-0 ml-4">
            {bestModel.name}
          </span>
        )}
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {featureImportance.map((f, index) => {
          const widthPct = maxImportance > 0 ? (f.importance / maxImportance) * 100 : 0;
          const isTop3   = index < 3;

          return (
            <div key={f.raw_name} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-xs text-slate-600 w-5 text-right shrink-0">
                {index + 1}
              </span>

              {/* Feature name */}
              <span className={`text-sm w-40 shrink-0 truncate ${
                isTop3 ? "text-white font-medium" : "text-slate-400"
              }`}>
                {f.feature}
              </span>

              {/* Bar */}
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    isTop3 ? "bg-[#00AB55]" : "bg-slate-600"
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              {/* Value */}
              <span className="text-xs font-mono text-slate-500 w-12 text-right shrink-0">
                {(f.importance * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-600 mt-5 pt-4 border-t border-slate-800">
        Importance calculated from {bestModel?.name === "Logistic Regression"
          ? "normalised absolute coefficients"
          : "built-in Gini importance"} · Top 3 features highlighted
      </p>
    </div>
  );
}

export default FeatureImportanceCard;