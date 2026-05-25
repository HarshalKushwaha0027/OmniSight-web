import MainLayout from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom"; 
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from '../assets/name_logo.png';

function Home() {
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const MARKET_TICKERS = [
    { id: "TSLA", label: "Tesla" },
    { id: "NVDA", label: "NVIDIA" },
    { id: "BTC-USD", label: "Bitcoin" },
    { id: "AAPL", label: "Apple" },
    { id: "MSFT", label: "Microsoft" },
    { id: "AMD", label: "AMD" },
    { id: "META", label: "Meta" },
    { id: "AMZN", label: "Amazon" },
    { id: "NFLX", label: "Netflix" },
    { id: "ETH-USD", label: "Ethereum" }
  ];
  const [activeTickers, setActiveTickers] = useState(MARKET_TICKERS.slice(0, 3));

  //  The "Live Market" Rotator Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const shuffled = [...MARKET_TICKERS].sort(() => 0.5 - Math.random());
      setActiveTickers(shuffled.slice(0, 3));
    }, 4000); 
    
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchInput.trim() !== "") {
      e.preventDefault();
      navigate(`/dashboard?ticker=${searchInput.toUpperCase()}`);
    }
  };

  const handleQuickSearch = (tickerSymbol) => {
    navigate(`/dashboard?ticker=${tickerSymbol}`);
  };

  return (
    <MainLayout>
      {/* Changed background to slate-950 to match dashboard */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-32 gap-8 bg-slate-950">

        {/* Title updated to Dashboard's signature neon green */}
        <div className="mb-2 animate-fade-in-up">
          <img 
            src={logo} 
            alt="OmniSight Predictive Analytics" 
            // h-24 or h-32 makes it nice and big for the hero section
            className="h-28 md:h-48 w-auto object-contain drop-shadow-[0_0_25px_rgba(0,171,85,0.2)]" 
          />
        </div>
        {/* Subtitle updated to slate-400 */}
        <p className="text-slate-400 text-lg text-center max-w-2xl">
          AI-powered analytical platform for predictive risk assessment,
          market intelligence, and financial insights.
        </p>

        {/* Search Bar: Updated to dark slate, pill-shaped, with a green focus ring */}
        <div className="flex items-center bg-slate-900 border border-slate-800 focus-within:border-[#00AB55] rounded-full px-5 py-3 w-[500px] transition-colors">
          <svg
            className="h-5 w-5 text-slate-400 mr-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>

          <input
            type="text"
            placeholder="Search for analysis..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-transparent text-white placeholder-slate-500 outline-none" 
          />
        </div>

        {/* Dynamic Rotating Pills: Updated to dark theme with green accents */}
        <div className="flex gap-4 mt-6 justify-center h-10">
          {activeTickers.map((ticker) => (
            <button 
              key={ticker.id}
              onClick={() => handleQuickSearch(ticker.id)}
              className="px-6 py-2 bg-[#00AB55]/10 border border-[#00AB55]/30 text-[#00AB55] hover:bg-[#00AB55] hover:text-white rounded-full font-medium transition-all duration-300 animate-fade-in"
            >
              {ticker.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-15 w-full max-w-6xl px-6">

            {/* Card 1: Updated to Dashboard card styling (slate-900) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-[#00AB55]/50 transition duration-300">
              <h3 className="text-2xl font-semibold text-white mb-4">
                Predictive Risk Analysis
              </h3>
              <p className="text-slate-400 leading-7">
                Analyze potential financial and market risks using AI-powered
                predictive models and real-time analytical insights.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-[#00AB55]/50 transition duration-300">
              <h3 className="text-2xl font-semibold text-white mb-4">
                Trend & Pattern Detection
              </h3>
              <p className="text-slate-400 leading-7">
                Identify hidden market trends, anomalies, and behavioral patterns
                through intelligent data-driven monitoring systems.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-[#00AB55]/50 transition duration-300">
              <h3 className="text-2xl font-semibold text-white mb-4">
                Decision Intelligence
              </h3>
              <p className="text-slate-400 leading-7">
                Transform raw analytical data into actionable insights that support
                smarter financial and strategic decision-making.
              </p>
            </div>

          </div>

      {/* Footer background updated to match dark theme */}
      <footer className="w-full border-t border-slate-800 mt-32 bg-slate-950">

        <div className="max-w-7xl mx-auto px-8 py-16">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

            {/* Brand Section */}
            <div>
              <h2 className="text-3xl font-bold text-[#00AB55] mb-4">
                OmniSight
              </h2>
              <p className="text-slate-400 leading-7">
                AI-powered analytical platform for predictive risk analysis,
                financial intelligence, and data-driven decision systems.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-lg font-semibold text-[#75957B] mb-5">
                Product
              </h3>
              <div className="flex flex-col gap-3 text-slate-400">
                <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
                <Link to="/dashboard#volatility" className="hover:text-white transition">Volatility Analysis</Link>
                <Link to="/dashboard#prediction" className="hover:text-white transition">Risk Prediction</Link>
                <Link to="/dashboard#performance" className="hover:text-white transition">Model Metrics</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold text-[#75957B] mb-5">
                Resources
              </h3>
              <div className="flex flex-col gap-3 text-slate-400">
                <Link to="/docs" className="hover:text-white transition">Documentation</Link>
                <Link to="/api-info" className="hover:text-white transition">API</Link>
                <Link to="/guides" className="hover:text-white transition">Guides</Link>
                <Link to="/support" className="hover:text-white transition">Support</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold text-[#75957B] mb-5">
                Company
              </h3>
              <div className="flex flex-col gap-3 text-slate-400">
                <Link to="/about" className="hover:text-white transition">About</Link>
                <Link to="/contact" className="hover:text-white transition">Contact</Link>
                <a 
                  href="https://github.com/HarshalKushwaha0027/OmniSight" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition"
                >
                  GitHub
                </a>
                <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
            <p>
              © 2026 OmniSight. All rights reserved.
            </p>
            <p className="mt-4 md:mt-0">
              Built with React, Tailwind, and AI-driven analytics.
            </p>
          </div>

        </div>
      </footer>
      </div>
    </MainLayout>
  );
}

export default Home;