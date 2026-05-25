import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function RiskDistributionChart({ chartData }) {
  const dist = chartData?.distribution || { High: 0, Moderate: 0, Low: 100 };

  // Format data specifically for Recharts PieChart
  const data = [
    { name: "High Risk", value: dist.High, color: "#EF4444" },
    { name: "Moderate Risk", value: dist.Moderate, color: "#F59E0B" },
    { name: "Low Risk", value: dist.Low, color: "#00AB55" },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
          formatter={(value) => [`${value}%`, 'Frequency']}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default RiskDistributionChart;