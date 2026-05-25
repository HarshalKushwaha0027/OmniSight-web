import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

function ResidualShockCard({ chartData }) {
  // 1. Safe fallback for when data is loading
  const safeData = chartData || { dates: [], residuals: [] };

  // 2. Map the Python arrays into Recharts format
  const formattedChartData = safeData.dates.map((date, index) => {
    return {
      date: date,
      residual: safeData.residuals[index] || 0,
    };
  });

  // 3. Extract the most recent values for the KPIs
  const latestResidual = formattedChartData.length > 0
    ? formattedChartData[formattedChartData.length - 1].residual
    : 0;

  const isPositive = latestResidual >= 0;
  const shockClassification = isPositive ? "Positive Shock" : "Negative Shock";
  const shockColor = isPositive ? "text-emerald-400" : "text-red-400";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mt-10">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Idiosyncratic Shocks (Residuals)</h2>
        <p className="text-slate-400">
          Company-specific deviations after removing systematic market influence.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Latest Residual Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 mb-3">Latest Residual Shock</p>
          <h3 className={`text-5xl font-bold ${shockColor}`}>
            {latestResidual > 0 ? "+" : ""}{latestResidual.toFixed(4)}
          </h3>
          <p className="text-slate-500 mt-4 text-sm">
            Most recent company-specific deviation.
          </p>
        </div>

        {/* Classification Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 mb-3">Shock Classification</p>
          <h3 className={`text-5xl font-bold ${shockColor}`}>
            {shockClassification}
          </h3>
          <p className="text-slate-500 mt-4 text-sm">
            Indicates abnormal residual movement.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tickMargin={10}
              tickFormatter={(val) => {
                if(!val) return "";
                const d = new Date(val);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            
            {/* Zero Line */}
            <ReferenceLine y={0} stroke="#334155" />

            {/* Dynamic Colored Bars */}
            <Bar dataKey="residual">
              {formattedChartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.residual >= 0 ? "#00AB55" : "#EF4444"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Box */}
      <div className="mt-8 bg-slate-950 border border-slate-900 rounded-xl p-5">
        <p className="text-slate-300 leading-7">
          Residual shock analysis reveals elevated company-specific deviations independent of broader 
          market movements, suggesting localized instability drivers.
        </p>
      </div>

    </div>
  );
}

export default ResidualShockCard;