import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function SystematicRiskCard({ chartData }) {
  // 1. Safe fallback for when data is loading
  const safeData = chartData || { dates: [], systematic: [] };

  // 2. Map the Python arrays into Recharts format
  // Systematic is R-squared (0 to 1). Unsystematic is 1 - Systematic.
  const formattedChartData = safeData.dates.map((date, index) => {
    const sysValue = safeData.systematic[index] || 0;
    const unsysValue = Math.max(0, 1 - sysValue); // Ensure it doesn't drop below 0

    return {
      date: date,
      Systematic: sysValue,
      Unsystematic: unsysValue,
    };
  });

  // 3. Extract the most recent values for the top KPI boxes
  const latestData = formattedChartData.length > 0 
    ? formattedChartData[formattedChartData.length - 1] 
    : { Systematic: 0, Unsystematic: 0 };

  const sysPercent = (latestData.Systematic * 100).toFixed(1);
  const unsysPercent = (latestData.Unsystematic * 100).toFixed(1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mt-10">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Systematic vs Unsystematic Risk</h2>
        <p className="text-slate-400">
          Rolling decomposition of market-driven and company-specific exposure.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Systematic Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 mb-3">Systematic Risk (R²)</p>
          <h3 className="text-5xl font-bold text-[#00AB55]">
            {sysPercent}%
          </h3>
          <p className="text-slate-500 mt-4 text-sm">
            Market-driven component of total risk.
          </p>
        </div>

        {/* Unsystematic Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 mb-3">Unsystematic Risk</p>
          <h3 className="text-5xl font-bold text-yellow-400">
            {unsysPercent}%
          </h3>
          <p className="text-slate-500 mt-4 text-sm">
            Company-specific residual exposure.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tickMargin={10}
              tickFormatter={(val) => {
                // Optional: Shorten date for clean X-axis (e.g., "2026-05-20" -> "May 20")
                if(!val) return "";
                const d = new Date(val);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis stroke="#94a3b8" />
            
            {/* Tooltip formats the decimals into readable percentages */}
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [`${(value * 100).toFixed(1)}%`]}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />

            {/* Systematic Area (Green) */}
            <Area
              type="monotone"
              dataKey="Systematic"
              stroke="#00AB55"
              strokeWidth={3}
              fill="#00AB55"
              fillOpacity={0.2}
            />
            
            {/* Unsystematic Area (Yellow) */}
            <Area
              type="monotone"
              dataKey="Unsystematic"
              stroke="#F59E0B"
              strokeWidth={3}
              fill="#F59E0B"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Box */}
      <div className="mt-8 bg-slate-950 border border-slate-900 rounded-xl p-5">
        <p className="text-slate-300 leading-7">
          Market-wide factors currently account for {sysPercent}% of observed volatility, 
          indicating {latestData.Systematic > 0.5 ? "elevated" : "lower"} systematic 
          exposure relative to company-specific risk behavior.
        </p>
      </div>
      
    </div>
  );
}

export default SystematicRiskCard;