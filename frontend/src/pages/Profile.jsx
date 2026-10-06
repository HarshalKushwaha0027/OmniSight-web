import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, KeyRound, Bookmark, Trash2, Eye, EyeOff, ExternalLink, AlertTriangle, CheckCircle2
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https://omnisight-api.onrender.com";

function Profile() {
  const { user, authHeader, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Watchlist — now real, fetched from the server
  const [watchlist, setWatchlist] = useState([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: ""
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setIsLoadingWatchlist(true);
    try {
      const response = await fetch(`${API_BASE}/watchlist`, { headers: authHeader() });
      const data = await response.json();
      if (response.ok) setWatchlist(data);
    } catch (error) {
      console.error("Failed to load watchlist:", error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update password.");

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleRemoveFromWatchlist = async (ticker) => {
    setWatchlist((prev) => prev.filter((item) => item.ticker !== ticker)); // optimistic
    try {
      await fetch(`${API_BASE}/watchlist/${ticker}`, {
        method: "DELETE",
        headers: authHeader(),
      });
    } catch (error) {
      console.error("Failed to remove ticker:", error);
      fetchWatchlist(); // revert on failure
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    try {
      const response = await fetch(`${API_BASE}/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ confirmUserId: deleteConfirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete account.");

      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  if (!user) return null; // ProtectedRoute handles redirect; this avoids a flash

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pt-16 pb-20 space-y-10">

        <div>
          <h1 className="text-4xl font-bold text-[#75957B]">Account Settings</h1>
          <p className="text-slate-400 mt-2 text-lg">
            Manage your personal profile, security credentials, and tracked assets.
          </p>
        </div>

        {/* ── User Info Card ── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#00AB55]/10 border border-[#00AB55]/30 flex items-center justify-center text-[#00AB55] font-bold text-2xl shrink-0">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-xl flex items-center gap-6 text-sm">
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">User ID</span>
                <span className="font-mono text-white font-medium">{user.userId}</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Member Since</span>
                <span className="text-slate-300 font-medium">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Watchlist ── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00AB55]/10 rounded-xl border border-[#00AB55]/20 text-[#00AB55]">
                <Bookmark size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Your Watchlist</h2>
                <p className="text-slate-400 text-sm">Quick access to assets you are actively tracking.</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {watchlist.length} Saved Tickers
            </span>
          </div>

          {isLoadingWatchlist ? (
            <div className="text-center py-10 text-slate-500">Loading…</div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/60">
              <p className="text-slate-500">Your watchlist is currently empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 pl-2">Ticker</th>
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Added Date</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {watchlist.map((item) => (
                    <tr key={item.ticker} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 pl-2 font-bold text-white">{item.ticker}</td>
                      <td className="py-4 text-slate-300">{item.name || "—"}</td>
                      <td className="py-4 text-slate-400 text-sm">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/dashboard?ticker=${item.ticker}`}
                            className="p-2 text-slate-400 hover:text-[#00AB55] hover:bg-[#00AB55]/10 rounded-lg transition"
                            title="Analyze in Dashboard"
                          >
                            <ExternalLink size={18} />
                          </Link>
                          <button
                            onClick={() => handleRemoveFromWatchlist(item.ticker)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Remove Ticker"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Security ── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[#00AB55]/10 rounded-xl border border-[#00AB55]/20 text-[#00AB55]">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Password & Security</h2>
              <p className="text-slate-400 text-sm">Update your password to secure your account access.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="max-w-2xl space-y-5">
            {passwordSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-3">
                <CheckCircle2 size={18} />
                <span>Password updated successfully!</span>
              </div>
            )}
            {passwordError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
                <AlertTriangle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-sm mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition pr-12"
                />
                <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300">
                  {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-400 text-sm mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition pr-12"
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300">
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition"
                />
              </div>
            </div>

            <button type="submit"
              className="mt-2 px-6 py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] transition font-semibold text-white flex items-center gap-2">
              Update Password
            </button>
          </form>
        </section>

        {/* ── Danger Zone ── */}
        <section className="bg-slate-900 border border-red-500/20 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle size={22} />
                Danger Zone
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Permanently delete your account, saved insights, and watchlist history. This action is non-reversible.
              </p>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition font-medium shrink-0"
            >
              Delete Account
            </button>
          </div>
        </section>

      </div>

      {/* ── Delete Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Account Deletion</h3>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              This will permanently wipe all your records. Please type your User ID{" "}
              <strong className="text-white font-mono">{user.userId}</strong> below to confirm.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {deleteError}
              </div>
            )}

            <input
              type="text"
              placeholder="Enter User ID"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-red-500 font-mono transition"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation(""); setDeleteError(""); }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmation !== user.userId}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Profile;