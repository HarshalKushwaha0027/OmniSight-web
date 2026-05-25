import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";  
import DashboardLayout from "../layouts/DashboardLayout";
import RiskTrendChart from "../components/dashboard/RiskTrendChart";
import RiskDistributionChart from "../components/dashboard/RiskDistributionChart";
import EarlyWarningCard from "../components/dashboard/EarlyWarningCard";
import SystematicRiskCard from "../components/dashboard/SystematicRiskCard";
import VolatilityClusteringCard from "../components/dashboard/VolatilityClusteringCard";
import ResidualShockCard from "../components/dashboard/ResidualShockCard";
import ModelPerformancePanel from "../components/dashboard/ModelPerformancePanel";
import { Link } from "react-router-dom";

function Dashboard() {
  const [searchParams] = useSearchParams();
  const urlTicker = searchParams.get("ticker");
  const [recentInsights, setRecentInsights] = useState([]);
  // --- STATE VARIABLES ---
  const [prediction, setPrediction] = useState({
    risk: 0,
    confidence: 0,
    category: "Loading...",
  });

  // Set the initial search query to the URL ticker (if it exists)
  const [searchQuery, setSearchQuery] = useState(urlTicker || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);


  // NEW: Function that fetches suggestions as you type
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    // If the box is empty, clear the dropdown
    if (val.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Ask Node.js for global stock suggestions
    try {
      const response = await fetch(`http://localhost:5000/api/search?q=${val}`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  // Reusable Search Function (used by both Enter key and Dropdown click)
  const executeSearch = async (tickerToSearch) => {
    if (!tickerToSearch.trim()) return;
    
    setIsLoading(true);
    setShowSuggestions(false); 
    setSearchQuery(tickerToSearch.toUpperCase()); 

    try {
      const response = await fetch("http://localhost:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: tickerToSearch.toUpperCase() }),
      });
      const data = await response.json();
      if (response.ok) {
        setPrediction(data);
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setIsLoading(false);
      fetchHistory();
    }
  };

  // 2. CLEANED UP: Now it just fires the executeSearch function!
  const handleMainSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(searchQuery);
    }
  };

  const [volatility, setVolatility] = useState("");
  const [revenueGrowth, setRevenueGrowth] = useState("");
  const [manualResult, setManualResult] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/history");
      const data = await response.json();
      if (response.ok) {
        setRecentInsights(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  // --- AUTOMATIC INITIAL LOAD ---
  useEffect(() => {
    // Check if there is a hash in the URL (e.g., #volatility)
    const hash = window.location.hash;
    if (hash) {
      // Remove the '#' to get just the ID string
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      
      if (element) {
        // Wait a tiny bit for the components to render, then scroll smoothly
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
    const fetchInitialData = async () => {
      setIsLoading(true); // Show loading state immediately

      // If URL has a ticker, use it. Otherwise, fallback to AAPL.
      const tickerToSearch = urlTicker ? urlTicker.toUpperCase() : "AAPL";
      setSearchQuery(tickerToSearch); // Update the visual search box

      try {
        const response = await fetch("http://localhost:5000/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: tickerToSearch }), 
        });
        const data = await response.json();
        if (response.ok) {
          setPrediction(data);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [urlTicker]);

  

  // --- MANUAL CALCULATOR ---
  const handleManualCalculation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/manual-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketVolatility: Number(volatility),
          revenueGrowth: Number(revenueGrowth),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setManualResult(data);
      }
    } catch (error) {
      console.error("Calculator Error:", error);
    }
  };

  const overviewRef = useRef(null);
  const warningRef = useRef(null);
  const systematicRef = useRef(null);
  const volatilityRef = useRef(null);
  const residualRef = useRef(null);
  const predictionRef = useRef(null);
  const performanceRef = useRef(null);

  return (
    <DashboardLayout
      sections={{
        overview: overviewRef,
        warning: warningRef,
        systematic: systematicRef,
        volatility: volatilityRef,
        residual: residualRef,
        prediction: predictionRef,
        performance: performanceRef,
      }}
    >
      {/* --- NEW: STATIC FLOATING NAME PILL --- */}
      <div className="fixed top-9 right-10 z-50 bg-slate-900/80 backdrop-blur-md border border-[#00AB55]/30 text-white px-5 py-2 rounded-full shadow-[0_0_15px_rgba(0,171,85,0.1)] flex items-center gap-3">
        {/* Pulsing "Live" Indicator */}
        <div className="w-2 h-2 rounded-full bg-[#00AB55] animate-pulse"></div>
        
        {/* Company Ticker Name */}
        <span className="font-bold tracking-wider uppercase text-sm">
          {searchQuery || "MARKET"}
        </span>
      </div>

      <div ref={overviewRef}>
        <div className=" space-y-5 pt-20">
          <h1 className="text-4xl font-bold text-[#75957B]">
            Risk Analysis Dashboard
          </h1>
          <p className="space-y-5 text-slate-400 mt-3 text-lg">
            Monitor predictive insights and analytical metrics.
          </p>
        </div>

         
        {/* --- UPGRADED CONNECTED SEARCH BAR --- */}
        <div className="relative w-[500px] mb-10">
          
          <div className={`flex items-center bg-slate-900 border rounded-2xl px-5 py-4 w-full transition-all duration-300 ${isLoading ? 'border-slate-700 opacity-60 bg-slate-800' : 'border-slate-800 focus-within:border-[#00AB55]'}`}>
            <svg className="h-5 w-5 text-slate-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>

            <input
              type="search"
              placeholder={isLoading ? "Analyzing Data..." : "Search for analysis (e.g. AAPL)..."}
              value={searchQuery}
              onChange={handleSearchChange} // <--- UPDATED THIS LINE
              onKeyDown={handleMainSearch}
              disabled={isLoading}
              className="bg-transparent outline-none w-full text-white placeholder-slate-500 uppercase disabled:cursor-not-allowed"
            />
          </div>

          {/* --- AUTOCOMPLETE SUGGESTIONS DROPDOWN --- */}
          {showSuggestions && !isLoading && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-2xl">
              {suggestions.map((stock) => (
                <div
                  key={stock.ticker}
                  onClick={() => executeSearch(stock.ticker)}
                  className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-700/50 last:border-0 transition"
                >
                  <span className="font-bold text-white">{stock.ticker}</span>
                  <span className="text-sm text-slate-400">{stock.name}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-400 text-lg">Risk Score</h2>
            <p className="text-5xl font-bold text-[#00AB55] mt-6">{prediction.risk}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-400 text-lg">Confidence</h2>
            <p className="text-5xl font-bold text-[#00AB55] mt-6">{prediction.confidence}%</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-400 text-lg">Category</h2>
            <p className={`text-5xl font-bold ${prediction.category === "High" ? "text-red-400" : prediction.category === "Moderate" ? "text-yellow-400" : "text-green-400"}`}>
              {prediction.category} Risk
            </p>
          </div>
        </div>
      </div>
      
      <div ref={warningRef}>
        <EarlyWarningCard 
          probability={prediction?.early_warning || 0} 
          status={prediction?.category || "Low"} 
        />
      </div>
      
      <div ref={systematicRef}>
        <SystematicRiskCard chartData={prediction?.charts} />
      </div>

      <div id="volatility" ref={volatilityRef}>
        <VolatilityClusteringCard chartData={prediction?.charts} />
      </div>

      <div ref={residualRef}>
        <ResidualShockCard chartData={prediction?.charts} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Risk Trend</h2>
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            {/* Added chartData prop here */}
            <RiskTrendChart chartData={prediction?.charts} />
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Prediction Distribution</h2>
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            {/* Added chartData prop here */}
            <RiskDistributionChart chartData={prediction?.charts} />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Recent Risk Insights</h2>
          <Link to="/History" className="text-sm text-slate-400 hover:text-white transition">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="pb-4">Entity</th>
                <th className="pb-4">Risk Score</th>
                <th className="pb-4">Confidence</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInsights.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">No recent insights found.</td>
                </tr>
              ) : (
                recentInsights.map((item, index) => (
                  <tr key={item._id || index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="py-4 font-semibold text-white">{item.ticker}</td>
                    <td className="py-4 text-slate-300">{item.riskScore}</td>
                    <td className="py-4 text-slate-300">{item.confidence}%</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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

      <div id="prediction" ref={predictionRef} className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-3xl font-semibold mb-8">Generate Risk Prediction</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 mb-3">Market Volatility</label>
            <input type="number" placeholder="Enter value" value={volatility} onChange={(e) => setVolatility(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white" />
          </div>
          <div>
            <label className="block text-slate-400 mb-3">Revenue Growth</label>
            <input type="number" placeholder="Enter value" value={revenueGrowth} onChange={(e) => setRevenueGrowth(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white" />
          </div>
        </div>
        <button onClick={handleManualCalculation} className="mt-8 px-6 py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] transition font-semibold">
          Generate Prediction
        </button>

        <div className="mt-8 bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Prediction Result</h3>
          {manualResult && (
            <div className="mt-4">
              <p className={`text-5xl font-bold ${manualResult.category === "High" ? "text-red-400" : manualResult.category === "Moderate" ? "text-yellow-400" : "text-green-400"}`}>
                {manualResult.category} Risk
              </p>
              <p className="text-slate-400 mt-4">Score: {manualResult.risk} | Confidence: {manualResult.confidence}%</p>
            </div>
          )}
        </div>
      </div>

      <div id="performance" ref={performanceRef}>
        <ModelPerformancePanel performanceData={prediction?.performance} />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;