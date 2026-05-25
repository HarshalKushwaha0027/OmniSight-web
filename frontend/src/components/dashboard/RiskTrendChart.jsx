import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function RiskTrendChart({ chartData }) {
  const safeData = chartData || { dates: [], risk_trend: [] };

  const formattedData = safeData.dates.map((date, index) => ({
    date: date,
    risk: safeData.risk_trend[index] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8" 
          tickFormatter={(val) => {
            if(!val) return "";
            return new Date(val).toLocaleDateString('en-US', { month: 'short' });
          }}
        />
        <YAxis stroke="#94a3b8" domain={[0, 100]} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
          formatter={(value) => [`${value.toFixed(1)}`, 'Risk Score']}
        />
        <Line 
          type="monotone" 
          dataKey="risk" 
          stroke="#00AB55" 
          strokeWidth={3} 
          dot={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default RiskTrendChart;