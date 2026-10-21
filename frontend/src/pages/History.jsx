import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";

import { API_BASE } from "../config";

function History() {
  const { isAuthenticated, authHeader } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Personal history — nothing to fetch for a guest
    if (!isAuthenticated) {
      setHistoryData([]);
      setIsLoading(false);
      return;
    }

    const fetchFullHistory = async () => {
      setIsLoading(true);
      try {
        // FIX: capital H to match the route definition /api/History/all
        // (was lowercase /history/all, which 404s on Render's case-sensitive routing)
        const response = await fetch(`${API_BASE}/History/all`, {
          headers: authHeader(),
          cache: "no-store", // prevent the browser from reusing a stale cached response
        });
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
  }, [isAuthenticated, authHeader]);

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
                  <th className="pb-4 font-medium text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {!isAuthenticated ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">
                      <Link to="/login" className="text-[#00AB55] hover:underline">Log in</Link> to view your risk history.
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">Loading history...</td>
                  </tr>
                ) : historyData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">No historical data found.</td>
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
                      <td className="py-5 text-right pr-2">
                        <Link
                          to={`/dashboard?ticker=${item.ticker}`}
                          title="Analyze in Dashboard"
                          className="inline-flex p-2 text-slate-400 hover:text-[#00AB55] hover:bg-[#00AB55]/10 rounded-lg transition"
                        >
                          <ExternalLink size={18} />
                        </Link>
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