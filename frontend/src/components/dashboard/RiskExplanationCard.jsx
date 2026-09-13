// components/dashboard/RiskExplanationCard.jsx
// Displays the SHAP explanation returned by ml_engine.py

function RiskExplanationCard({ explanation }) {
  if (!explanation || explanation.drivers.length === 0) {
    return null;
  }

  const { drivers, base_value, summary } = explanation;

  // Find the largest absolute shap value so we can scale all bars to 100%
  const maxImpact = Math.max(...drivers.map((d) => Math.abs(d.shap_value)));

  return (
    <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Risk Drivers</h2>
        <p className="text-slate-400 text-sm mt-1">
          Why the model gave this risk score — based on SHAP values.
        </p>
      </div>

      {/* Summary sentence */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300">
        {summary}
      </div>

      {/* Base value */}
      <p className="text-xs text-slate-500 mb-4">
        Model baseline (average prediction): {base_value}% risk
      </p>

      {/* Driver bars */}
      <div className="space-y-4">
        {drivers.map((driver) => {
          const isPositive = driver.shap_value > 0;
          const barWidth   = maxImpact > 0
            ? (Math.abs(driver.shap_value) / maxImpact) * 100
            : 0;

          return (
            <div key={driver.raw_name}>
              {/* Feature name + direction label */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">
                  {driver.feature}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isPositive
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-green-500/10 text-green-400 border border-green-500/20"
                  }`}
                >
                  {isPositive ? "↑ increases risk" : "↓ decreases risk"}
                </span>
              </div>

              {/* Bar track */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isPositive ? "bg-red-400" : "bg-[#00AB55]"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* SHAP value */}
              <p className="text-xs text-slate-500 mt-1">
                SHAP value: {driver.shap_value > 0 ? "+" : ""}
                {driver.shap_value.toFixed(4)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          Pushes risk higher
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00AB55] inline-block" />
          Pulls risk lower
        </span>
      </div>
    </div>
  );
}

export default RiskExplanationCard;