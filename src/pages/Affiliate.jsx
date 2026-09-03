import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import {
  Link2, Users, BarChart3, Award, Trophy, Lightbulb, Copy, Check,
  MousePointerClick, UserPlus, CalendarCheck, ShoppingBag, Info, Share2, Wallet,
} from "lucide-react";

const TABS = [
  { id: "links", label: "Affiliate Links", icon: Link2 },
  { id: "referrals", label: "My Referrals", icon: Users },
  { id: "stats", label: "Track Stats", icon: BarChart3 },
  { id: "ledger", label: "Earnings Ledger", icon: Award },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "tips", label: "Tips & Strategies", icon: Lightbulb },
];

const RANKS = [
  { name: "Bronze", emoji: "🥉", min: 0, next: 500 },
  { name: "Silver", emoji: "🥈", min: 500, next: 2000 },
  { name: "Gold", emoji: "🥇", min: 2000, next: 5000 },
  { name: "Platinum", emoji: "💎", min: 5000, next: 5000 },
];

const LEADERS = [
  { rank: 1, name: "Aarav Mehta", points: 12450 },
  { rank: 2, name: "Diya Sharma", points: 8120 },
  { rank: 3, name: "Kabir Rao", points: 5940 },
];

const POLICIES = [
  { icon: MousePointerClick, title: "Link Clicks", desc: "Earn 1 PC Point per unique click on your referral links, capped at 50 points per day to prevent spam." },
  { icon: UserPlus, title: "Registrations", desc: "Earn 100 PC Points immediately when a user signs up using your link." },
  { icon: CalendarCheck, title: "Turf Bookings", desc: "Earn 50 PC Points for every turf or stadium slot booking made by your referred users." },
  { icon: ShoppingBag, title: "Purchases", desc: "Earn 25 PC Points for every marketplace transaction your referrals complete." },
];

const TIPS = [
  { title: "Share in sports groups", desc: "Post your link in local WhatsApp/Telegram sports communities — turf players convert 5× better than random audiences." },
  { title: "Target venue owners", desc: "Convince one turf operator to list on PlayConnect and earn a lifetime share of every booking they receive." },
  { title: "Use the directory link", desc: "The Sports Businesses link attributes entire business onboarding to you — your biggest point source." },
  { title: "Post after matches", desc: "Share your link right after weekend tournaments when players are most excited about the sport." },
];

export default function Affiliate() {
  const { user } = useAuth();
  const [tab, setTab] = useState("links");
  const [copied, setCopied] = useState("");
  const [referrals, setReferrals] = useState([]);

  const points = user?.points ?? 0;
  const rank = [...RANKS].reverse().find((r) => points >= r.min) || RANKS[0];
  const progress = rank.name === "Platinum" ? 100 : Math.min(100, Math.round((points / rank.next) * 100));

  const refLink = `${window.location.origin}/?ref=${user?.uid || "you"}`;
  const bizLink = `${window.location.origin}/venues?ref=${user?.uid || "you"}`;

  /* live referrals: users who signed up with your code */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), where("referredBy", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => setReferrals(snap.docs.map((d) => d.data())));
    return () => unsub();
  }, [user]);

  const copy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* ── HERO ───────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
        <div className="max-w-xl">
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">🤝 PlayConnect Affiliate Hub</h1>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Recommend PlayConnect to your friends, venue operators, or local sports businesses.
            Earn PC Points for every click, signup, turf booking, or market purchase they make.
          </p>
        </div>
        <div className="w-full lg:w-80 rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-widest text-slate-400">YOUR AFFILIATE RANK</p>
            <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-300">
              {rank.emoji} {rank.name}
            </span>
          </div>
          <p className="mt-4 text-3xl font-black text-white">{points.toLocaleString("en-IN")} <span className="text-sm font-semibold text-slate-400">Points Earned</span></p>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Progress to {rank.name === "Platinum" ? "max" : RANKS[RANKS.indexOf(rank) + 1]?.name}</span>
              <span>{points}/{rank.next} pts</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id ? "text-[#FBBF24] border-[#FBBF24]" : "text-slate-400 border-transparent hover:text-white"
            }`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ AFFILIATE LINKS ═══════════ */}
      {tab === "links" && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 md:p-8 space-y-6">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-white"><Share2 size={17} className="text-[#FBBF24]" /> Quick Referrals</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Copy any of your official affiliate referral links below and share them. When users land on our platform using these links, we attribute all their signups, check-ins, bookings, and purchases to you!
            </p>
          </div>

          {[
            { id: "portal", title: "General Portal Link", reward: "100 PC Points on Signup", link: refLink },
            { id: "biz", title: "Sports Businesses Directory", reward: "Promote local sports facilities · 50 pts per onboarding", link: bizLink },
          ].map((l) => (
            <div key={l.id} className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="text-sm font-bold text-white">{l.title}</h3>
                <span className="text-xs font-bold text-[#FBBF24]">{l.reward}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <input readOnly value={l.link} className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-300 focus:outline-none" />
                <button onClick={() => copy(l.link, l.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors shrink-0">
                  {copied === l.id ? <><Check size={13} className="text-[#10B981]" /> Copied!</> : <><Copy size={13} /> Copy Link</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ MY REFERRALS ═══════════ */}
      {tab === "referrals" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { label: "Total Referrals", value: referrals.length, color: "text-[#FBBF24]" },
              { label: "Actions by Referrals", value: 0, color: "text-[#10B981]" },
              { label: "Points from Referrals", value: 0, color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="mt-2 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 md:p-8">
            <h2 className="flex items-center gap-2 font-bold text-white"><UserPlus size={17} className="text-[#FBBF24]" /> Users Who Joined via Your Link</h2>
            <p className="mt-2 text-sm text-slate-400">These users signed up on PlayConnect using your referral link. All their bookings, purchases, and check-ins earn you affiliate points.</p>
            {referrals.length === 0 ? (
              <div className="py-14 text-center">
                <Users size={32} className="mx-auto text-slate-700" />
                <p className="mt-4 text-sm font-bold text-slate-300">No referrals yet</p>
                <p className="mt-1 text-xs text-slate-500">Share your affiliate link from the "Affiliate Links" tab to start earning!</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {referrals.map((r, i) => (
                  <div key={i} className="flex justify-between rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm">
                    <span className="text-white font-semibold">{r.name}</span>
                    <span className="text-slate-400">{r.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TRACK STATS ═══════════ */}
      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: MousePointerClick, label: "Link Clicks", value: 0, color: "text-blue-400" },
              { icon: Users, label: "User Signups", value: referrals.length, color: "text-[#10B981]" },
              { icon: CalendarCheck, label: "Venue Bookings", value: 0, color: "text-[#FBBF24]" },
              { icon: ShoppingBag, label: "Market Purchases", value: 0, color: "text-orange-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 flex items-center gap-4">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 md:p-8">
            <h2 className="font-bold text-white">📈 Affiliate Referral Activity</h2>
            <div className="py-14 text-center">
              <Info size={28} className="mx-auto text-slate-700" />
              <p className="mt-4 text-sm text-slate-500">No referral conversions recorded yet. Start sharing your link to trigger activities!</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EARNINGS LEDGER ═══════════ */}
      {tab === "ledger" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">ACCUMULATED AFFILIATE POINTS</p>
              <p className="mt-3 text-3xl font-black text-[#FBBF24]">{points.toLocaleString("en-IN")} <span className="text-sm text-slate-400">Points</span></p>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">These points are part of your main wallet and can be redeemed for discounts, memberships, and slot booking codes.</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">APPROX. CASH EQUIVALENT</p>
              <p className="mt-3 text-3xl font-black text-white">₹{(points * 0.1).toFixed(2)}</p>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">1 PC Point = ₹0.10. Use points at checkout to save directly on slot bookings and tournaments.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 md:p-8">
            <h2 className="font-bold text-white mb-5">📋 Point Earning Policies</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {POLICIES.map((p) => (
                <div key={p.title} className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white"><p.icon size={15} className="text-[#FBBF24]" /> {p.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ LEADERBOARD ═══════════ */}
      {tab === "leaderboard" && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 md:p-8 space-y-3">
          <h2 className="flex items-center gap-2 font-bold text-white mb-4"><Trophy size={17} className="text-[#FBBF24]" /> Top Affiliates This Season</h2>
          {LEADERS.map((l) => (
            <div key={l.rank} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/60 px-5 py-4">
              <span className="flex items-center gap-3 text-sm font-bold text-white">
                <span className="text-lg">{["🥇", "🥈", ""][l.rank - 1]}</span> {l.name}
              </span>
              <span className="text-sm font-black text-[#FBBF24]">{l.points.toLocaleString("en-IN")} pts</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-5 py-4">
            <span className="flex items-center gap-3 text-sm font-bold text-[#FBBF24]"><Wallet size={16} /> You ({user?.name || "Player"})</span>
            <span className="text-sm font-black text-[#FBBF24]">{points.toLocaleString("en-IN")} pts</span>
          </div>
        </div>
      )}

      {/* ═══════════ TIPS ═══════════ */}
      {tab === "tips" && (
        <div className="grid sm:grid-cols-2 gap-5">
          {TIPS.map((t, i) => (
            <div key={t.title} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] font-black">{i + 1}</span>
              <h3 className="mt-3 font-bold text-white text-sm">{t.title}</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}