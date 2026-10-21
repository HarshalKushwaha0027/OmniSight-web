// Centralized API configuration.
//
// Previously every page declared its own copy of the backend URL:
//   const API_BASE = "https://omnisight-api.onrender.com/api";
// repeated across 6 files. That duplication is exactly what caused the
// recurring bugs: http vs https, a trailing /api present in some files and
// missing in others, and localhost left in by accident after local testing
// in one file while the rest still pointed at production. Import from here
// instead of hardcoding a new copy anywhere.
//
// VITE_BACKEND_URL / VITE_ML_ENGINE_URL let you override these for local
// development (e.g. in a frontend/.env.local file, which Vite loads
// automatically and which stays untracked by git) without touching any
// source file. They fall back to the deployed Render URLs so production
// behavior is unchanged if no env file is present.

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL || "https://omnisight-api.onrender.com/"
).replace(/\/+$/, "");

const ML_ENGINE_URL = (
  import.meta.env.VITE_ML_ENGINE_URL || "https://omnisight-ml-engine.onrender.com/"
).replace(/\/+$/, "");

// Every REST call in the app goes through API_BASE: the Express backend's
// root plus its /api router prefix. Defined once, here, so it can never
// drift out of sync with BACKEND_URL again.
export const API_BASE = `${BACKEND_URL}/api`;

// ServiceWarmup pings the bare service roots (no /api) to detect a Render
// cold start, so it needs the un-suffixed URLs directly.
export { BACKEND_URL, ML_ENGINE_URL };