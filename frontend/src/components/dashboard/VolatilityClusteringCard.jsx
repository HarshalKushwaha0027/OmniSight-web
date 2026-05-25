import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

function VolatilityClusteringCard({ chartData }) {
  // 1. Provide a safe fallback in case the API hasn't responded yet
  const safeData = chartData || { dates: [], volatility: [] };

  // 2. Map the separate arrays from Python into the format Recharts needs
  const formattedChartData = safeData.dates.map((date, index) => {
    return {
      date: date, // We will use this for the X-Axis
      volatility: safeData.volatility[index],
    };
  });

  // 3. Calculate real dynamic KPIs based on the Python data
  const currentVolatility =
    safeData.volatility.length > 0
      ? safeData.volatility[safeData.volatility.length - 1]
      : 0;

  // Calculate the actual average of the last 6 months
  const meanVolatility =
    safeData.volatility.length > 0
      ? safeData.volatility.reduce((a, b) => a + b, 0) / safeData.volatility.length
      : 0;

  const volatilityState =
    currentVolatility > meanVolatility ? "Elevated" : "Stable";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mt-10">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Volatility Clustering (30-Day)</h2>
        <p className="text-slate-400 mt-2">
          Analysis of rolling annualized volatility and persistence of market
          instability.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Current Volatility */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 mb-3">Current Annualized Volatility</p>
          <h3 className="text-5xl font-bold text-orange-400">
            {(currentVolatility * 100).toFixed(1)}%
          </h3>
          <p className="text-slate-500 mt-4 text-sm">
            Based on rolling 30-day observations.
          </p>
        </div>

        {/* Volatility State */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 mb-3">Volatility State</p>
          <div className="flex items-center gap-4">
            <h3 className="text-4xl font-bold text-yellow-400">
              {volatilityState}
            </h3>
            {/* Conditionally render the cluster tag based on state */}
            {volatilityState === "Elevated" && (
              <span className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                Cluster Detected
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-4 text-sm">
            Elevated persistence relative to mean volatility.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          {/* Feed the real mapped data here */}
          <LineChart data={formattedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            
            {/* Update dataKey to "date" to match our mapping function */}
            <XAxis dataKey="date" stroke="#94a3b8" />
            
            <YAxis stroke="#94a3b8" />
            <Tooltip />

            {/* Mean Volatility Line */}
            <ReferenceLine
              y={meanVolatility}
              stroke="#EF4444"
              strokeDasharray="6 6"
              label="Mean"
            />

            {/* Main Line */}
            <Line
              type="monotone"
              dataKey="volatility"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Box */}
      <div className="mt-8 bg-slate-950 border border-slate-900 rounded-xl p-5">
        <p className="text-slate-300 leading-7">
          Recent volatility behavior indicates clustering around elevated ranges,
          suggesting increased persistence of market uncertainty and unstable
          price dynamics.
        </p>
      </div>
    </div>
  );
}

export default VolatilityClusteringCard;