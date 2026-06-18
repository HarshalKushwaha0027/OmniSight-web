import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const API_BASE = "https://omnisight-api.onrender.com/api";
const SUGGESTION_DEBOUNCE_MS = 400; // wait 400ms after user stops typing

// ─── TINY HOOK: debounce a value ──────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── LOADING SKELETON for the 3 stat cards ───────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-pulse">
      <div className="h-4 w-24 bg-slate-700 rounded mb-6" />
      <div className="h-12 w-16 bg-slate-700 rounded" />
    </div>
  );
}

// ─── LOADING OVERLAY for main search ─────────────────────────────────────────
function LoadingOverlay({ ticker }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-slate-700 border-t-[#00AB55] rounded-full animate-spin" />
      <p className="text-white font-semibold text-lg tracking-wide">
        Analyzing <span className="text-[#00AB55]">{ticker}</span>{dots}
      </p>
      <p className="text-slate-400 text-sm">ML model is running — this takes ~10-30s on first load</p>
    </div>
  );
}

// ─── MANUAL CALCULATOR (split into its own component to stop re-renders) ──────
const ManualCalculator = ({ predictionRef }) => {
  const [volatility, setVolatility] = useState("");
  const [revenueGrowth, setRevenueGrowth] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [isCalcLoading, setIsCalcLoading] = useState(false);

  const handleManualCalculation = async () => {
    if (!volatility || !revenueGrowth) return;
    setIsCalcLoading(true);
    try {
      const response = await fetch(`${API_BASE}/manual-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketVolatility: Number(volatility),
          revenueGrowth: Number(revenueGrowth),
        }),
      });
      const data = await response.json();
      if (response.ok) setManualResult(data);
    } catch (error) {
      console.error("Calculator Error:", error);
    } finally {
      setIsCalcLoading(false);
    }
  };

  return (
    <div id="prediction" ref={predictionRef} className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-3xl font-semibold mb-8">Generate Risk Prediction</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-slate-400 mb-3">Market Volatility</label>
          <input
            type="number"
            placeholder="Enter value"
            value={volatility}
            onChange={(e) => setVolatility(e.target.value)}
            // No lag: this component only re-renders itself, not the whole Dashboard
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-3">Revenue Growth</label>
          <input
            type="number"
            placeholder="Enter value"
            value={revenueGrowth}
            onChange={(e) => setRevenueGrowth(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition-colors"
          />
        </div>
      </div>
      <button
        onClick={handleManualCalculation}
        disabled={isCalcLoading || !volatility || !revenueGrowth}
        className="mt-8 px-6 py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
      >
        {isCalcLoading ? "Calculating..." : "Generate Prediction"}
      </button>

      <div className="mt-8 bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">Prediction Result</h3>
        {manualResult ? (
          <div className="mt-4">
            <p className={`text-5xl font-bold ${
              manualResult.category === "High" ? "text-red-400"
              : manualResult.category === "Moderate" ? "text-yellow-400"
              : "text-green-400"
            }`}>
              {manualResult.category} Risk
            </p>
            <p className="text-slate-400 mt-4">
              Score: {manualResult.risk} | Confidence: {manualResult.confidence}%
            </p>
          </div>
        ) : (
          <p className="text-slate-500">Enter values above and click Generate.</p>
        )}
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard() {
  const [searchParams] = useSearchParams();
  const urlTicker = searchParams.get("ticker");

  const [recentInsights, setRecentInsights] = useState([]);
  const [prediction, setPrediction] = useState({ risk: 0, confidence: 0, category: "Loading..." });
  const [searchQuery, setSearchQuery] = useState(urlTicker || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Debounce the search query before firing suggestion requests
  const debouncedQuery = useDebounce(searchQuery, SUGGESTION_DEBOUNCE_MS);

  // Refs for sidebar scroll
  const overviewRef  = useRef(null);
  const warningRef   = useRef(null);
  const systematicRef = useRef(null);
  const volatilityRef = useRef(null);
  const residualRef  = useRef(null);
  const predictionRef = useRef(null);
  const performanceRef = useRef(null);

  // ── Fetch suggestions only when debounced value changes ──────────────────
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // Don't fetch if we're already loading a full analysis
    if (isLoading) return;

    let cancelled = false;
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`${API_BASE}/search?q=${debouncedQuery}`);
        const data = await response.json();
        if (!cancelled) {
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch {
        // Silently fail — suggestions are non-critical
      }
    };
    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedQuery]); // Only fires after 400ms pause — NOT on every keystroke

  // ── Fetch full prediction ─────────────────────────────────────────────────
  const executeSearch = useCallback(async (tickerToSearch) => {
    if (!tickerToSearch.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery(tickerToSearch.toUpperCase());

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: tickerToSearch.toUpperCase() }),
      });
      const data = await response.json();
      if (response.ok) {
        setPrediction(data);
        // Fetch history after prediction, not blocking the main response
        fetch(`${API_BASE}/history`)
          .then((r) => r.json())
          .then((d) => setRecentInsights(d))
          .catch(() => {});
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMainSearch = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(searchQuery);
    }
  }, [searchQuery, executeSearch]);

  // ── Scroll to hash section on load ───────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    const ticker = urlTicker ? urlTicker.toUpperCase() : "AAPL";
    setSearchQuery(ticker);
    executeSearch(ticker);
  }, [urlTicker]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Memoize category color to avoid re-computing on every render ──────────
  const categoryColor = useMemo(() => {
    if (prediction.category === "High") return "text-red-400";
    if (prediction.category === "Moderate") return "text-yellow-400";
    return "text-green-400";
  }, [prediction.category]);

  return (
    <>
      {/* Full-screen loading overlay with spinner — replaces silent waiting */}
      {isLoading && <LoadingOverlay ticker={searchQuery} />}

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
        {/* Live ticker pill */}
        <div className="fixed top-9 right-10 z-50 bg-slate-900/80 backdrop-blur-md border border-[#00AB55]/30 text-white px-5 py-2 rounded-full shadow-[0_0_15px_rgba(0,171,85,0.1)] flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#00AB55] animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-sm">
            {searchQuery || "MARKET"}
          </span>
        </div>

        {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
        <div ref={overviewRef}>
          <div className="space-y-5 pt-20">
            <h1 className="text-4xl font-bold text-[#75957B]">Risk Analysis Dashboard</h1>
            <p className="text-slate-400 mt-3 text-lg">
              Monitor predictive insights and analytical metrics.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-[500px] mb-10 mt-6">
            <div className={`flex items-center bg-slate-900 border rounded-2xl px-5 py-4 w-full transition-all duration-300 ${
              isLoading ? "border-slate-700 opacity-60" : "border-slate-800 focus-within:border-[#00AB55]"
            }`}>
              <svg className="h-5 w-5 text-slate-400 mr-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder={isLoading ? "Analyzing data..." : "Search ticker (e.g. AAPL)..."}
                value={searchQuery}
                // onChange only updates local state — the debounce hook fires the API call
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleMainSearch}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                disabled={isLoading}
                className="bg-transparent outline-none w-full text-white placeholder-slate-500 uppercase disabled:cursor-not-allowed"
              />
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && !isLoading && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-2xl">
                {suggestions.map((stock) => (
                  <div
                    key={stock.ticker}
                    onMouseDown={() => executeSearch(stock.ticker)} // mousedown fires before onBlur
                    className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-700/50 last:border-0 transition"
                  >
                    <span className="font-bold text-white">{stock.ticker}</span>
                    <span className="text-sm text-slate-400">{stock.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stat cards — show skeleton while loading */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
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
                <p className={`text-5xl font-bold ${categoryColor}`}>
                  {prediction.category} Risk
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── CARDS ───────────────────────────────────────────────────────── */}
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

        {/* ── CHARTS ROW ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Risk Trend</h2>
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              <RiskTrendChart chartData={prediction?.charts} />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Prediction Distribution</h2>
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              <RiskDistributionChart chartData={prediction?.charts} />
            </div>
          </div>
        </div>

        {/* ── RECENT INSIGHTS TABLE ────────────────────────────────────────── */}
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
                    <td colSpan="4" className="text-center py-6 text-slate-500">
                      No recent insights found.
                    </td>
                  </tr>
                ) : (
                  recentInsights.map((item, index) => (
                    <tr key={item._id || index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                      <td className="py-4 font-semibold text-white">{item.ticker}</td>
                      <td className="py-4 text-slate-300">{item.riskScore}</td>
                      <td className="py-4 text-slate-300">{item.confidence}%</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.category === "High"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : item.category === "Moderate"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
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

        {/* ── MANUAL CALCULATOR (isolated component — zero lag on inputs) ── */}
        <ManualCalculator predictionRef={predictionRef} />

        {/* ── MODEL PERFORMANCE ───────────────────────────────────────────── */}
        <div id="performance" ref={performanceRef}>
          <ModelPerformancePanel performanceData={prediction?.performance} />
        </div>
      </DashboardLayout>
    </>
  );
}

export default Dashboard;