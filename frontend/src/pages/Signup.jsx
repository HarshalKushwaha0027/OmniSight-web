import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Mail } from "lucide-react";

function Signup() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resumeEmail = location.state?.resumeEmail;

  const [step, setStep] = useState(resumeEmail ? "otp" : "details"); // "details" | "otp"
  const [name, setName] = useState("");
  const [email, setEmail] = useState(resumeEmail || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only single digits
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email, code);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMessage("");
    try {
      await resendOtp(email);
      setResendMessage("A new code has been sent.");
      setTimeout(() => setResendMessage(""), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">

        {step === "details" ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-slate-400 mb-8">Get a unique OmniSight user ID and start tracking risk.</p>

            {error && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Full name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters" required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white focus:border-[#00AB55] transition"
                />
              </div>
              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] transition font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Sending code…" : "Create Account"}
              </button>
            </form>

            <p className="text-slate-500 text-sm text-center mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[#00AB55] hover:underline">Log in</Link>
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#00AB55]/10 border border-[#00AB55]/30 flex items-center justify-center text-[#00AB55] mb-5">
              <Mail size={26} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify your email</h1>
            <p className="text-slate-400 mb-8">
              We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
            </p>

            {error && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}
            {resendMessage && (
              <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm">
                {resendMessage}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:border-[#00AB55] transition"
                  />
                ))}
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#00AB55] hover:bg-[#007B55] transition font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Verifying…" : "Verify & Continue"}
              </button>
            </form>

            <p className="text-slate-500 text-sm text-center mt-6">
              Didn't get a code?{" "}
              <button onClick={handleResend} className="text-[#00AB55] hover:underline">
                Resend code
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
}

export default Signup;