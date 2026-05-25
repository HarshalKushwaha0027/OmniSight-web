import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

function History() {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFullHistory = async () => {
      try {
        // Notice we are calling the new /history/all route!
        const response = await fetch("https://omnisight-api.onrender.com/api/history/all");
        const data = await response.json();
        if (response.ok) {
          setHistoryData(data);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullHistory();
  }, []);

  return (
    <DashboardLayout>
      <div className="pt-20 max-w-6xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#75957B]">Risk History</h1>
          <p className="text-slate-400 mt-3 text-lg">
            A complete log of all historical risk assessments and predictions.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="pb-4 px-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">Entity</th>
                  <th className="pb-4 font-medium">Risk Score</th>
                  <th className="pb-4 font-medium">Confidence</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-500">Loading history...</td>
                  </tr>
                ) : historyData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-500">No historical data found.</td>
                  </tr>
                ) : (
                  historyData.map((item, index) => (
                    <tr key={item._id || index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                      <td className="py-5 px-4 text-slate-400 text-sm">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-5 font-bold text-white tracking-wide">{item.ticker}</td>
                      <td className="py-5 text-slate-300">{item.riskScore}</td>
                      <td className="py-5 text-slate-300">{item.confidence}%</td>
                      <td className="py-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide ${
                          item.category === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                          item.category === "Moderate" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : 
                          "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}>
                          {item.category} Risk
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default History;