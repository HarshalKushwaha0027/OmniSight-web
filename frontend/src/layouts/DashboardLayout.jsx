import { useState, useEffect } from "react";
import {
  Menu,
  LayoutDashboard,
  BrainCircuit,
  BarChart3,
  FileText,
  ArrowUp
} from "lucide-react";
import Navbar from "../components/common/Navbar";

function DashboardLayout({ children, sections }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [activeSection, setActiveSection] = useState("overview");
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // FIX 1: New state to track when the user is actively resizing
  const [isDragging, setIsDragging] = useState(false);

  // Resize Logic
  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevents accidental text highlighting while dragging
    setIsDragging(true);

    const handleMouseMove = (e) => {
      // Constrain width between 80px and 320px
      const newWidth = Math.max(80, Math.min(e.clientX, 320));
      setSidebarWidth(newWidth);
      setCollapsed(newWidth < 160);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Attach listeners to document instead of window for better drag reliability
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (!sections) return;

    let ticking = false; // Flag for requestAnimationFrame

    const handleScroll = () => {
      // FIX 2: Throttle scroll events using requestAnimationFrame
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 300);

          let currentSection = "overview";

          Object.entries(sections).forEach(([key, ref]) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            // Trigger section change slightly higher up the screen
            if (rect.top <= window.innerHeight * 0.4) {
              currentSection = key;
            }
          });

          // Check if user has reached the absolute bottom
          if (window.innerHeight + Math.round(window.scrollY) >= document.body.offsetHeight - 10) {
            currentSection = "performance";
          }

          setActiveSection(currentSection);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <div className="flex min-h-screen rounded-r-3xl bg-black text-white">
      <Navbar />

      {/* Sidebar */}
      <aside
        style={{ width: collapsed ? "80px" : `${sidebarWidth}px` }}
        className={`
          fixed left-0 top-0 h-screen bg-slate-950
          border-r border-slate-800 z-50 flex flex-col
          ${isDragging ? "" : "transition-[width] duration-300"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          {!collapsed && (
            <h2 className="text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
              Dashboard
            </h2>
          )}
          <button
            onClick={() => {
              if (collapsed) {
                setSidebarWidth(260);
                setCollapsed(false);
              } else {
                setCollapsed(true);
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-800 transition outline-none focus:outline-none focus:ring-0"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
            { id: "warning", label: "Early Warning", icon: <BrainCircuit size={20} className="-rotate-[-90deg]" /> },
            { id: "systematic", label: "Systematic Risk", icon: <BarChart3 size={20} /> },
            { id: "volatility", label: "Volatility", icon: <BarChart3 size={20} /> },
            { id: "residual", label: "Residual Shocks", icon: <BarChart3 size={20} /> },
            { id: "prediction", label: "Prediction", icon: <BrainCircuit size={20} className="-rotate-[-90deg]" /> },
            { id: "performance", label: "Model Metrics", icon: <FileText size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sections[item.id]?.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                outline-none focus:outline-none
                ${
                  activeSection === item.id
                    ? "bg-[#00AB55]/20 text-[#00AB55] border border-[#00AB55]/30"
                    : "border border-transparent hover:bg-slate-900 text-slate-400"
                }
              `}
            >
              {item.icon}
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Resize Handle */}
        {!collapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-slate-800 hover:bg-[#00AB55]"
          />
        )}
      </aside>

      {/* Main Content */}
      <main
        style={{
          marginLeft: collapsed ? "80px" : `${sidebarWidth}px`,
        }}
        className={`
          flex-1 p-8 
          /* FIX 4: Disable transition on the main content margin while dragging */
          ${isDragging ? "" : "transition-[margin] duration-300"}
        `}
      >
        {children}
      </main>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[#00AB55] text-white shadow-[0_4px_14px_0_rgba(0,171,85,0.39)] hover:bg-[#007B55] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,171,85,0.23)] transition-all duration-300 focus:outline-none"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}

export default DashboardLayout;