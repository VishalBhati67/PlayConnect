import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../store/AuthContext";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ THE FIX: as soon as AuthContext sees the logged-in user, go to dashboard
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }
    if (!window.confirmationResult) { setError("No OTP requested. Go back and send OTP first."); return; }
    setLoading(true);
    try {
      await window.confirmationResult.confirm(otp);
      setSuccess(true); // redirect happens automatically via the effect above
    } catch {
      setError("Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-20">
      <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-8 md:p-10 shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="text-center mb-8">
          <span className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 mb-4">
            <ShieldCheck size={28} className="text-[#FBBF24]" />
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white">Verify OTP</h1>
          <p className="text-sm text-slate-400 mt-2">We've sent a 6-digit code to your mobile.</p>
        </div>

        {success ? (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 size={40} className="mx-auto text-[#10B981]" />
            <p className="text-sm font-bold text-[#10B981]">Verified! Taking you to your dashboard…</p>
            <Loader2 size={18} className="mx-auto animate-spin text-slate-400" />
          </div>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-5">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-slate-600 focus:outline-none focus:border-[#FBBF24]"
            />

            {error && <p className="text-xs font-semibold text-red-400">⚠️ {error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed py-3.5 text-sm font-bold text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-[#F59E0B]/20"
            >
              {loading ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Verifying…</span> : "Verify & Continue"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}