import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0
           w-64 h-screen
           bg-slate-900
           border-r border-slate-800
           p-6">

      <h2 className="text-2xl font-bold mb-10">
        Dashboard
      </h2>

      <div ref={overviewRef} className="flex flex-col gap-5 text-slate-400">

        <Link to="/" className="hover:text-white transition">
          Overview
        </Link>

        <Link to="/" className="hover:text-white transition">
          Predictions
        </Link>

        <Link to="/" className="hover:text-white transition">
          Analytics
        </Link>

        <Link to="/" className="hover:text-white transition">
          Reports
        </Link>

      </div>

    </aside>
  );
}

export default Sidebar;