import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { Phone, Shield, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../store/AuthContext";

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
  </svg>
);

export default function Login() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  /* ✅ GOOGLE LOGIN — free, no SMS needed */
  const googleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(`[${err.code || "unknown"}] ${err.message}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (phone.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (!window.recaptchaVerifier) { setError("reCAPTCHA is loading. Please wait a second and try again."); return; }
    setLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      navigate("/verify-otp");
    } catch (err) {
      console.error(err);
      setError(`[${err.code || "unknown"}] ${err.message}`);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-20">
      <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <span className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 mb-4">
            <Phone size={28} className="text-[#10B981]" />
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white">Sign In</h1>
          <p className="text-sm text-slate-400 mt-2">Enter your mobile number to receive a 6-digit OTP.</p>
        </div>

        <form onSubmit={sendOTP} className="space-y-5">
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Mobile Number</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 focus-within:border-[#10B981]">
              <span className="text-sm font-bold text-slate-300">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                inputMode="numeric"
                className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-base tracking-wider"
              />
            </div>
          </label>

          {error && <p className="text-xs font-semibold text-red-400 break-all">⚠️ {error}</p>}

          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed py-3.5 text-sm font-bold text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-[#10B981]/20"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP…</> : <>Send OTP <ArrowRight size={16} /></>}
          </button>
        </form>

        {/* ✅ divider + Google button */}
        <div className="my-6 flex items-center gap-3 text-[11px] text-slate-500">
          <span className="h-px flex-1 bg-slate-700/60" /> or continue with <span className="h-px flex-1 bg-slate-700/60" />
        </div>

        <button
          type="button"
          onClick={googleLogin}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-slate-600 bg-white hover:bg-slate-100 disabled:opacity-60 py-3.5 text-sm font-bold text-slate-800 transition-all active:scale-[0.98]"
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 mt-6">
          <Shield size={12} /> By continuing you agree to our Terms & Privacy Policy.
        </p>

        <div id="recaptcha-container" />
      </div>
    </main>
  );
}