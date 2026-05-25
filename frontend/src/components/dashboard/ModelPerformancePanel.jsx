import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState } from "react";
 
function ModelPerformancePanel({ performanceData }) {
  // Safe fallback
  const [showAnalysis, setShowAnalysis] = useState(true);
  const safeData = performanceData || {
    auc: 0, precision: 0, recall: 0, accuracy: 0, roc_curve: [], pr_curve: []
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mt-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Model Performance Metrics</h2>
          <p className="text-slate-400">Evaluation metrics for the early warning prediction model.</p>
        </div>
        <button 
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-sm"
        >
          {showAnalysis ? "Hide Analysis" : "Show Analysis"}
        </button>
      </div>

      {showAnalysis && (
        <div className="transition-all duration-300">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 mb-2 text-sm">ROC-AUC</p>
            <h3 className="text-4xl font-bold text-emerald-400">{safeData.auc.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 mb-2 text-sm">Precision</p>
            <h3 className="text-4xl font-bold text-cyan-400">{safeData.precision.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 mb-2 text-sm">Recall</p>
            <h3 className="text-4xl font-bold text-yellow-400">{safeData.recall.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 mb-2 text-sm">Accuracy</p>
            <h3 className="text-4xl font-bold text-red-400">{safeData.accuracy}%</h3>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ROC Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">ROC Curve</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeData.roc_curve} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#94a3b8" tickCount={6} />
                  <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#94a3b8" tickCount={5} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Line type="monotone" dataKey="y" stroke="#00AB55" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Precision-Recall Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Precision-Recall Curve</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeData.pr_curve} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#94a3b8" tickCount={6} />
                  <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#94a3b8" tickCount={5} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Line type="monotone" dataKey="y" stroke="#A855F7" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-950 border border-slate-900 rounded-xl p-5">
          <p className="text-slate-300 leading-7 text-sm">
            The early warning model demonstrates strong classification capability with high ROC-AUC performance and stable precision-recall tradeoffs across volatility regimes.
          </p>
        </div>

        </div>
      )}
    </div>
  );
}

export default ModelPerformancePanel;