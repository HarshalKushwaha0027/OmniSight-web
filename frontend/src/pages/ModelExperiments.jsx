// pages/ModelExperiments.jsx
import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = "https://omnisight-api.onrender.com/api";

const modelBadge = {
  "Logistic Regression": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "Random Forest":       "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  "Gradient Boosting":   "bg-green-500/10 text-[#00AB55] border border-green-500/20",
};

function ModelExperiments() {
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [tickerFilter, setTickerFilter] = useState("");

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    setIsLoading(true);
    try {
      const url = tickerFilter
        ? `${API_BASE}/experiments/${tickerFilter.toUpperCase()}`
        : `${API_BASE}/experiments?limit=50`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) setExperiments(data);
    } catch (error) {
      console.error("Failed to load experiments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchExperiments();
  };

  return (
    <DashboardLayout>
      <div className="pt-20 space-y-5">
        <h1 className="text-4xl font-bold text-[#75957B]">Model Experiments</h1>
        <p className="text-slate-400 text-lg">
          Every training run logged — which models were compared, which one won, and how it was validated.
        </p>
      </div>

      {/* Filter */}
      <form onSubmit={handleFilterSubmit} className="flex gap-3 my-8 max-w-md">
        <input
          type="text"
          placeholder="Filter by ticker (e.g. AAPL)"
          value={tickerFilter}
          onChange={(e) => setTickerFilter(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white uppercase focus:border-[#00AB55] transition"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] transition font-semibold whitespace-nowrap"
        >
          Filter
        </button>
        {tickerFilter && (
          <button
            type="button"
            onClick={() => { setTickerFilter(""); fetchExperiments(); }}
            className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Loading experiments…</div>
        ) : experiments.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No experiments logged yet. Run a prediction on the Dashboard to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="p-4">Ticker</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Best Model</th>
                  <th className="p-4">AUC</th>
                  <th className="p-4">F1</th>
                  <th className="p-4">Features</th>
                  <th className="p-4">Validation</th>
                  <th className="p-4">Top Driver</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr
                    key={exp._id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/20 transition"
                  >
                    <td className="p-4 font-semibold text-white">{exp.ticker}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(exp.createdAt).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${modelBadge[exp.bestModel?.name] || ""}`}>
                        {exp.bestModel?.name || "—"}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#00AB55]">
                      {exp.bestModel?.metrics?.auc ?? "—"}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {exp.bestModel?.metrics?.f1 ?? "—"}
                    </td>
                    <td className="p-4 text-slate-400">{exp.featureCount}</td>
                    <td className="p-4 text-slate-500 text-xs">
                      {exp.validation?.trainRows}/{exp.validation?.testRows}
                      <span className="block text-slate-600">
                        {exp.validation?.method?.includes("chronological") ? "time-series" : "random"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {exp.topFeatures?.[0]?.feature || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 mt-4">
        Showing {experiments.length} experiment{experiments.length !== 1 ? "s" : ""}
        {tickerFilter && ` for ${tickerFilter.toUpperCase()}`} · Sorted newest first
      </p>
    </DashboardLayout>
  );
}

export default ModelExperiments;