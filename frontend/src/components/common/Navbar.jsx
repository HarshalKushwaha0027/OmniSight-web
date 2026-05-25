import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
function Navbar() {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      
      <nav
          className="
            flex items-center justify-between
            w-[800px]
            px-8 py-4
            rounded-full

            bg-slate-900/80
            backdrop-blur-md

            border border-slate-700/50

            shadow-[0_8px_30px_rgba(0,0,0,0.35)]
            hover:text-white transition-colors duration-200

            
          "
        >

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src={logo} 
            alt="OmniSight Logo" 
            // h-10 keeps it appropriately sized for a navbar, w-auto keeps the aspect ratio
            className="h-10 w-auto object-contain" 
          />
           
      </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-8 text-[#75957B]">

          <Link
            to="/"
            className="hover:text-[#41e096] transition"
          >
            Home
          </Link>

          <Link
            to="/dashboard"
            className="hover:text-[#41e096] transition"
          >
            Dashboard
          </Link>

          <Link
            to="/about"
            className="hover:text-[#41e096] transition"
          >
            About
          </Link>

        </div>

      </nav>

    </div>
  );
}

export default Navbar;