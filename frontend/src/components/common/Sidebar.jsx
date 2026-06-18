import { Link, useLocation } from "react-router-dom";

// Each nav item: label + the section id it scrolls to on Dashboard
const NAV_ITEMS = [
  { label: "Overview",    id: "overview"    },
  { label: "Warning",     id: "warning"     },
  { label: "Systematic",  id: "systematic"  },
  { label: "Volatility",  id: "volatility"  },
  { label: "Residual",    id: "residual"    },
  { label: "Prediction",  id: "prediction"  },
  { label: "Performance", id: "performance" },
];

function Sidebar({ sections = {} }) {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  const scrollTo = (id) => {
    // If a ref map was passed, use it; otherwise fall back to getElementById
    const el = sections[id]?.current ?? document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    // h-screen + sticky top-0 = always full viewport height, stays in place while content scrolls
    <aside className="sticky top-0 h-screen w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-10 text-white">Dashboard</h2>

      <nav className="flex flex-col gap-1">
        {isDashboard ? (
          // On the Dashboard page: smooth-scroll to each section
          NAV_ITEMS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
            >
              {label}
            </button>
          ))
        ) : (
          // On other pages: normal links
          <>
            <Link to="/"          className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm">Home</Link>
            <Link to="/dashboard" className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm">Dashboard</Link>
            <Link to="/History"   className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm">History</Link>
          </>
        )}
      </nav>

      {/* Push version badge to the bottom */}
      <div className="mt-auto pt-6 border-t border-slate-800">
        <p className="text-xs text-slate-600">OmniSight v1.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;