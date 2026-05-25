import React from 'react';

function EarlyWarningCard({ probability, status }) {
  // 1. Dynamic colors based on the ML Status
  const statusColors = {
    High: "text-red-400",
    Moderate: "text-yellow-400",
    Low: "text-green-400",
  };

  const badgeColors = {
    High: "bg-red-500/20 text-red-400 border border-red-500/30",
    Moderate: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    Low: "bg-green-500/20 text-green-400 border border-green-500/30",
  };

  // 2. Dynamic AI Insights based on the ML Status
  const getInsightMessage = (currentStatus) => {
    switch (currentStatus) {
      case "High":
        return "Critical warning: High probability of a significant risk event in the near term. Immediate defensive positioning is advised.";
      case "Moderate":
        return "Elevated risk factors detected. AI models suggest moderate clustering activity. Monitor market conditions closely.";
      case "Low":
      default:
        return "Market volatility remains within controlled ranges, though minor clustering activity has been detected in recent trading sessions.";
    }
  };

  // Fallback to "Low" if status is still loading
  const safeStatus = status === "Loading..." ? "Low" : status;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mt-10">
      
      {/* Header section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">3-Month Early Warning Signal</h2>
          <p className="text-slate-400 text-sm mt-1">AI-based probability estimation for upcoming high-risk events.</p>
        </div>
      </div>

      {/* Probability Display */}
      <div className="mb-8">
        <p className="text-slate-400 mb-2">Probability of High-Risk Event</p>
        <div className="flex items-baseline gap-4">
          <h3 className={`text-6xl font-bold ${statusColors[safeStatus] || statusColors.Low}`}>
            {probability}%
          </h3>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${badgeColors[safeStatus] || badgeColors.Low}`}>
            {safeStatus} Risk
          </span>
        </div>
      </div>

      {/* AI Insight Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <p className="text-slate-300 leading-relaxed">
          {getInsightMessage(safeStatus)}
        </p>
      </div>

    </div>
  );
}

export default EarlyWarningCard;