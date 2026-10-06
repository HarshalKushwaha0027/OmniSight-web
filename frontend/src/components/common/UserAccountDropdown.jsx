import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function UserAccountDropdown() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  // Not logged in — show a simple Log In link instead of the dropdown
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 rounded-full text-sm font-medium bg-[#00AB55]/10 border border-[#00AB55]/30 text-[#00AB55] hover:bg-[#00AB55]/20 transition"
      >
        Log In
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-full transition-all duration-300 focus:outline-none flex items-center justify-center border ${
          isOpen
            ? "bg-[#00AB55]/10 border-[#00AB55]/30 text-[#00AB55]"
            : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
      >
        <User size={22} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50">
            <p className="text-sm text-white font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
            <p className="text-[10px] text-slate-600 font-mono mt-1">{user?.userId}</p>
          </div>

          <div className="p-2 space-y-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors outline-none"
            >
              <User size={16} />
              My Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors outline-none"
            >
              <Settings size={16} />
              Settings
            </Link>
          </div>

          <div className="p-2 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors outline-none"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAccountDropdown;