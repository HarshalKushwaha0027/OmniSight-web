import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const BACKEND_URL = "https://omnisight-api.onrender.com/";
const ML_ENGINE_URL = "https://omnisight-ml-engine.onrender.com/";
const MAX_WAIT_MS = 60000;      // never block longer than 60s no matter what
const MIN_SHOW_MS = 1500;       // avoid an annoying flash if services are already warm

// Rotating messages so a 30-60s cold-start wait doesn't feel like dead time.
const MESSAGES = [
  "Waking up the risk models…",
  "Spinning up the prediction engine…",
  "Warming the servers (free hosting naps after 15 minutes idle)…",
  "Almost there — training data is loading…",
  "Thanks for your patience, this only happens after inactivity…",
  "Connecting to the ML engine…",
];

// Only show this once per browser tab session — once the services are
// confirmed warm, subsequent navigation within the app shouldn't repeat it.
const SESSION_KEY = "omnisight_warmed";

function ServiceWarmup({ children }) {
  const [status, setStatus] = useState(
    sessionStorage.getItem(SESSION_KEY) === "true" ? "ready" : "checking"
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (status !== "checking") return;

    startTimeRef.current = Date.now();
    let cancelled = false;

    // Rotate the micro-copy every 4s so it feels alive, not stuck
    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);

    // Ping both services — Promise.allSettled so one failing doesn't block
    // the other from being detected as ready.
    const checkReady = async () => {
      try {
        await Promise.allSettled([
          fetch(BACKEND_URL, { mode: "no-cors" }),
          fetch(ML_ENGINE_URL, { mode: "no-cors" }),
        ]);
      } catch {
        // no-cors responses are opaque — we can't actually read success/fail
        // from them. What matters is the request completed instead of
        // hanging, which means the service responded (even a 404 means
        // "awake"). Ignore errors here.
      }

      if (cancelled) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MIN_SHOW_MS - elapsed);

      setTimeout(() => {
        if (cancelled) return;
        sessionStorage.setItem(SESSION_KEY, "true");
        setStatus("ready");
      }, remaining);
    };

    checkReady();

    // Hard ceiling — never leave someone stuck on this screen forever,
    // even if both services are somehow unreachable.
    const maxWaitTimer = setTimeout(() => {
      if (cancelled) return;
      sessionStorage.setItem(SESSION_KEY, "true");
      setStatus("ready");
    }, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      clearInterval(messageTimer);
      clearTimeout(maxWaitTimer);
    };
  }, [status]);

  if (status === "ready") {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center px-6">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#00AB55]/10 border border-[#00AB55]/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00AB55] animate-spin" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-3">OmniSight</h1>

      <p className="text-slate-400 text-center max-w-sm transition-opacity duration-300" key={messageIndex}>
        {MESSAGES[messageIndex]}
      </p>

      {/* Indeterminate progress bar — doesn't claim to know exact progress,
          just signals "something is happening" */}
      <div className="w-64 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden">
        <div className="h-full w-1/3 bg-[#00AB55] rounded-full animate-[slide_1.5s_ease-in-out_infinite]" />
      </div>

      <p className="text-xs text-slate-600 mt-6">
        First load after inactivity takes up to a minute — thanks for waiting.
      </p>

      <style>{`
        @keyframes slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}

export default ServiceWarmup;