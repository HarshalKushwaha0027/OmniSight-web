import { useState, useEffect } from "react";
import { Settings as SettingsIcon, CheckCircle2, AlertTriangle, Moon, Sun, Bell, Target } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https://omnisight-api.onrender.com";

function Settings() {
  const { user, authHeader, refreshUser } = useAuth();

  const [prefs, setPrefs] = useState({
    theme: "dark",
    defaultTicker: "AAPL",
    riskAlertThreshold: 65,
    emailNotifications: true,
    defaultModel: "Auto",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.preferences) {
      setPrefs(user.preferences);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/auth/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(prefs),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save preferences.");

      refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pt-16 pb-20 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[#75957B]">Settings</h1>
          <p className="text-slate-400 mt-2 text-lg">
            Customize how OmniSight analyzes and alerts you about risk.
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span>Preferences saved.</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Theme */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#00AB55]/10 rounded-lg border border-[#00AB55]/20 text-[#00AB55]">
                <Moon size={18} />
              </div>
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
            </div>
            <div className="flex gap-3">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, theme: t })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
                    prefs.theme === t
                      ? "bg-[#00AB55]/10 border-[#00AB55]/40 text-[#00AB55]"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {t === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">Light theme coming soon — saved but not yet applied.</p>
          </section>

          {/* Default ticker + model */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#00AB55]/10 rounded-lg border border-[#00AB55]/20 text-[#00AB55]">
                <Target size={18} />
              </div>
              <h2 className="text-lg font-semibold text-white">Dashboard defaults</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Default ticker</label>
                <input
                  type="text"
                  value={prefs.defaultTicker}
                  onChange={(e) => setPrefs({ ...prefs, defaultTicker: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white uppercase focus:border-[#00AB55] transition"
                />
                <p className="text-xs text-slate-600 mt-1.5">Loaded automatically when you open the Dashboard.</p>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Preferred model</label>
                <select
                  value={prefs.defaultModel}
                  onChange={(e) => setPrefs({ ...prefs, defaultModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition"
                >
                  <option value="Auto">Auto (best by F1 score)</option>
                  <option value="Logistic Regression">Logistic Regression</option>
                  <option value="Random Forest">Random Forest</option>
                  <option value="Gradient Boosting">Gradient Boosting</option>
                </select>
              </div>
            </div>
          </section>

          {/* Risk alert threshold */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#00AB55]/10 rounded-lg border border-[#00AB55]/20 text-[#00AB55]">
                <Bell size={18} />
              </div>
              <h2 className="text-lg font-semibold text-white">Risk alert threshold</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Flag a prediction as "High Risk" once the composite score passes this value.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={prefs.riskAlertThreshold}
                onChange={(e) => setPrefs({ ...prefs, riskAlertThreshold: Number(e.target.value) })}
                className="flex-1 accent-[#00AB55]"
              />
              <span className="text-2xl font-bold text-[#00AB55] w-16 text-right">
                {prefs.riskAlertThreshold}
              </span>
            </div>

            <label className="flex items-center gap-3 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}
                className="w-4 h-4 accent-[#00AB55]"
              />
              <span className="text-slate-300 text-sm">Email me when a watched ticker crosses this threshold</span>
            </label>
          </section>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] transition font-semibold text-white disabled:opacity-50 flex items-center gap-2"
          >
            <SettingsIcon size={18} />
            {isSaving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default Settings;