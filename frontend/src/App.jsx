import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

// Render's free tier spins services down after ~15 min idle, and the first
// request after that takes 30-60s to wake them back up. Firing a throwaway
// request to each service the moment the app loads means that wake-up delay
// happens silently in the background while the person is still looking at
// the homepage, instead of blocking their first real search.
//
// Both services need waking: /predict goes Frontend -> Node -> Python ML
// engine, so pinging only one still leaves the other cold on first use.
function wakeServices() {
  const targets = [
    "https://omnisight-api.onrender.com/",
    "https://omnisight-ml-engine.onrender.com/",
  ];

  targets.forEach((url) => {
    fetch(url, { mode: "no-cors" }).catch(() => {
      // Expected to fail sometimes (cold start timeout, CORS opacity with
      // no-cors mode, etc.) — this is fire-and-forget, we don't care about
      // the result, only that the request was sent.
    });
  });
}

function App() {
  useEffect(() => {
    wakeServices();
  }, []); // once per full page load, not per route change

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;