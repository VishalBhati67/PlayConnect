import { useState } from "react";
import {
  Handshake, Coins, Wallet, Store, Dumbbell, MapPin, User, Award,
  Gift, Check, TrendingUp, BadgeCheck,
} from "lucide-react";

const TYPE_ICONS = {
  "Sports Shop": Store,
  "Turf / Venue": MapPin,
  Gym: Dumbbell,
  Coach: User,
};

const INITIAL_REFERRALS = [
  { id: 1, business: "Sharma Sports Shop", type: "Sports Shop", city: "Jaipur", status: "Earning", earned: 2150 },
  { id: 2, business: "GreenField Turf", type: "Turf / Venue", city: "Ahmedabad", status: "Approved", earned: 1250 },
];

const REWARDS = [
  { id: "turf", title: "Free Turf Booking (1 hr)", cost: 500, icon: MapPin, note: "Any partner venue · any sport" },
  { id: "voucher", title: "₹500 Gear Voucher", cost: 800, icon: Gift, note: "Valid on the PlayConnect Shop" },
  { id: "bottle", title: "Pro Sports Bottle", cost: 200, icon: Award, note: "1L insulated · PC branded" },
];

const PARTNERS = [
  { name: "SG Sports", tier: "Gold", perk: "10% off for PC members", category: "Cricket Equipment", initials: "SG" },
  { name: "Nivia Sports", tier: "Gold", perk: "Free delivery on orders ₹999+", category: "Multi-sport Gear", initials: "NV" },
  { name: "Cosco Active", tier: "Silver", perk: "Buy 1 Get 1 on balls", category: "Sports Balls", initials: "CA" },
  { name: "UrbanTurf Partners", tier: "Bronze", perk: "₹100 off first booking", category: "Venue Network", initials: "UT" },
];

const TIER_STYLES = {
  Gold: "bg-[#FBBF24] text-slate-950",
  Silver: "bg-slate-300 text-slate-900",
  Bronze: "bg-orange-400 text-slate-950",
};

const STATUS_STYLES = {
  Pending: "bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24]",
  Approved: "bg-blue-500/15 border border-blue-500/40 text-blue-400",
  Earning: "bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]",
};

const STEPS = [
  { n: "1", title: "Refer a business", desc: "Sports shops, turfs, gyms or coaches — submit their details in 30 seconds." },
  { n: "2", title: "We onboard them", desc: "Our team verifies & lists the business on PlayConnect within 7 days." },
  { n: "3", title: "Earn forever", desc: "Lifetime share of their bookings & sales + bonus PC Points on every payout." },
];

export default function Sponsors() {
  const [points, setPoints] = useState(1250);
  const [referrals, setReferrals] = useState(INITIAL_REFERRALS);
  const [redeemed, setRedeemed] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({ business: "", type: "Sports Shop", city: "", contact: "" });

  const totalEarned = referrals.reduce((sum, r) => sum + r.earned, 0);

  const handleRefer = (e) => {
    e.preventDefault();
    if (!form.business.trim() || !form.contact.trim()) return;
    setReferrals((prev) => [
      { id: Date.now(), business: form.business.trim(), type: form.type, city: form.city.trim() || "—", status: "Pending", earned: 0 },
      ...prev,
    ]);
    setPoints((p) => p + 100);
    setMessage("🎉 Referral submitted! +100 PC Points added to your wallet.");
    setForm({ business: "", type: "Sports Shop", city: "", contact: "" });
  };

  const handleRedeem = (reward) => {
    if (points < reward.cost || redeemed.includes(reward.id)) return;
    setPoints((p) => p - reward.cost);
    setRedeemed((prev) => [...prev, reward.id]);
    setMessage(`✅ Redeemed "${reward.title}" for ${reward.cost} PC Points!`);
  };

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FBBF24]";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* ── Header ─────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-1.5 text-xs font-black tracking-[0.14em] text-[#FBBF24]">
          🤝 PLAYCONNECT AFFILIATE PROGRAM
        </span>
        <h1 className="mt-5 text-3xl md:text-4xl font-black text-white">
          Own a sports business or know one? <span className="text-[#FBBF24]">Partner & Earn!</span>
        </h1>
        <p className="mt-4 text-sm md:text-base text-slate-400 leading-relaxed">
          Refer sports shops, turfs, gyms, or coaches to PlayConnect. You'll receive a lifetime
          share of their bookings and ticket sales, plus bonus PC Points to redeem for free turf
          bookings and pro gear!
        </p>
      </div>

      {/* ── Stats strip ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
          <p className="flex items-center gap-2 text-xs text-slate-400"><Coins size={14} className="text-[#FBBF24]" /> PC Points</p>
          <p className="mt-2 text-2xl font-black text-[#FBBF24]">{points.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
          <p className="flex items-center gap-2 text-xs text-slate-400"><Wallet size={14} className="text-[#10B981]" /> Lifetime Earnings</p>
          <p className="mt-2 text-2xl font-black text-[#10B981]">₹{totalEarned.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
          <p className="flex items-center gap-2 text-xs text-slate-400"><Store size={14} className="text-blue-400" /> Businesses Referred</p>
          <p className="mt-2 text-2xl font-black text-white">{referrals.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
          <p className="flex items-center gap-2 text-xs text-slate-400"><Award size={14} className="text-[#FBBF24]" /> Partner Tier</p>
          <p className="mt-2 text-2xl font-black text-[#FBBF24]">Gold ⭐</p>
        </div>
      </div>

      {/* ── How it works ───────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-5">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-[#10B981] text-slate-950 font-black">
              {s.n}
            </span>
            <h3 className="mt-4 font-bold text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Success message ────────────────────────── */}
      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4 text-sm font-medium text-[#10B981]">
          <BadgeCheck size={18} /> {message}
        </div>
      )}

      {/* ── Refer form + referrals ─────────────────── */}
      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleRefer} className="h-fit rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#FBBF24]">📨 Refer & Earn</h2>

          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Business Name</span>
            <input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} placeholder="e.g., Raju Sports Corner" className={inputCls} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${inputCls} cursor-pointer`}>
                {Object.keys(TYPE_ICONS).map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">City</span>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g., Jaipur" className={inputCls} />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Contact (phone / email)</span>
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g., 98765 43210" className={inputCls} />
          </label>

          <button
            type="submit"
            disabled={!form.business.trim() || !form.contact.trim()}
            className="w-full rounded-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-bold text-slate-950 transition-all active:scale-[0.98]"
          >
            Submit Referral · +100 PC Points
          </button>
        </form>

        {/* Your referrals */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">Your Referrals ({referrals.length})</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {referrals.map((r) => {
              const Icon = TYPE_ICONS[r.type] || Store;
              return (
                <article key={r.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid place-items-center w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                        <Icon size={17} />
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm">{r.business}</h3>
                        <p className="text-xs text-slate-500">{r.type} · {r.city}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-700/50 pt-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-[#10B981]" /> Earned so far
                    </span>
                    <span className="font-bold text-[#10B981]">₹{r.earned.toLocaleString("en-IN")}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Redeem PC Points ───────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">🎁 Redeem PC Points</h2>
          <span className="text-sm font-bold text-[#FBBF24] flex items-center gap-1.5">
            <Coins size={15} /> {points.toLocaleString("en-IN")} available
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {REWARDS.map((rw) => {
            const done = redeemed.includes(rw.id);
            const affordable = points >= rw.cost;
            return (
              <article key={rw.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 space-y-3">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-[#FBBF24]/15 text-[#FBBF24]">
                  <rw.icon size={20} />
                </span>
                <h3 className="font-bold text-white text-sm">{rw.title}</h3>
                <p className="text-xs text-slate-500">{rw.note}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-sm font-black text-[#FBBF24]">{rw.cost} pts</span>
                  <button
                    onClick={() => handleRedeem(rw)}
                    disabled={done || !affordable}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                      done
                        ? "bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981]"
                        : affordable
                        ? "bg-[#FBBF24] hover:bg-[#D97706] text-slate-950"
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {done ? (<><Check size={13} /> Redeemed</>) : "Redeem"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Partner Directory ──────────────────────── */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">🏪 Partner Directory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PARTNERS.map((p) => (
            <article key={p.name} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 space-y-3 hover:-translate-y-1 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-slate-800 border border-slate-700 text-sm font-black text-white">
                  {p.initials}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${TIER_STYLES[p.tier]}`}>
                  {p.tier} Partner
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.category}</p>
              </div>
              <p className="text-xs font-semibold text-[#10B981]">🎁 {p.perk}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
