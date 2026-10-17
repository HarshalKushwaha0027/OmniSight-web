import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  error:   { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    Icon: AlertTriangle },
  success: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", Icon: CheckCircle2 },
  info:    { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400",   Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // type: "error" | "success" | "info" — defaults to "error" since that's
  // the most common case (network failures, API errors)
  const showToast = useCallback((message, type = "error", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}

      {/* Toast stack — fixed bottom-right, above everything */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(({ id, message, type }) => {
          const style = STYLES[type] || STYLES.error;
          const { Icon } = style;
          return (
            <div
              key={id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl bg-slate-900/95 ${style.border} animate-in slide-in-from-bottom-2 fade-in duration-200`}
            >
              <span className={`shrink-0 mt-0.5 ${style.text}`}>
                <Icon size={18} />
              </span>
              <p className="text-sm text-slate-200 flex-1 leading-snug">{message}</p>
              <button
                onClick={() => dismiss(id)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}