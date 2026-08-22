import { Link, useLocation } from "react-router-dom";

// Accept the scroll-to-section helper from DashboardLayout as a prop
function Sidebar({ onNavigate }) {
  const location = useLocation();
  const isActive = location.pathname === "/dashboard";

  const sections = [
    { id: "overview",     label: "Overview" },
    { id: "warning",      label: "Early Warning" },
    { id: "systematic",   label: "Systematic Risk" },
    { id: "volatility",   label: "Volatility" },
    { id: "residual",     label: "Residual Shock" },
    { id: "prediction",   label: "Predictions" },
    { id: "performance",  label: "Model Performance" },
  ];

  return (
    <aside
      className="
        fixed left-0 top-0
        w-56
        h-screen            /* full viewport height */
        bg-slate-900
        border-r border-slate-800
        flex flex-col
        p-6
        z-40
        overflow-y-auto     /* scroll if content ever overflows */
      "
    >
      {/* Logo / title */}
      <h2 className="text-xl font-bold mb-10 text-white tracking-tight">
        Omni<span className="text-[#00AB55]">Sight</span>
      </h2>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1 text-slate-400 flex-1">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onNavigate && onNavigate(id)}
            className="
              text-left px-3 py-2 rounded-lg text-sm
              hover:bg-slate-800 hover:text-white
              transition-colors duration-150
              focus:outline-none focus:ring-1 focus:ring-[#00AB55]/40
            "
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom link back to home */}
      <Link
        to="/"
        className="text-xs text-slate-600 hover:text-slate-400 transition mt-6"
      >
        ← Back to Home
      </Link>
    </aside>
  );
}

export default Sidebar;