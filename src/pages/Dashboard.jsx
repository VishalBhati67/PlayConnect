import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import {
  CalendarDays, MapPin, Clock, Package, Coins, Wallet, X, Check,
  ChevronRight, Gamepad2, Star, Lock, Zap, Loader2,
} from "lucide-react";

const PLANS = [
  { name: "Starter", price: 599, features: ["Booking Manager", "Basic venue listing", "Email support"], hot: false },
  { name: "Pro", price: 999, features: ["Booking + Event Manager", "Priority search listing", "Chat support"], hot: true },
  { name: "Elite", price: 1999, features: ["All 4 Managers", "Top search rank", "Dedicated account manager"], hot: false },
];

const TABS = [
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "games", label: "My Games", icon: Gamepad2 },
  { id: "orders", label: "Orders", icon: Package },
];

const BADGE = {
  Confirmed: "bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]",
  Completed: "bg-slate-800 border border-slate-600 text-slate-400",
  Cancelled: "bg-red-500/15 border border-red-500/40 text-red-400",
  Delivered: "bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]",
  "Out for Delivery": "bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24]",
  Processing: "bg-blue-500/15 border border-blue-500/40 text-blue-400",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("bookings");
  const [showPlans, setShowPlans] = useState(false);
  const [planMsg, setPlanMsg] = useState("");

  /* ✅ LIVE BOOKINGS from Firestore */
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setBookingsLoading(false); return; }
    const q = query(collection(db, "bookings"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBookingsLoading(false);
    });
    return () => unsub();
  }, [user]);

  /* ✅ LIVE GAMES (games you joined) from Firestore */
  const [myGames, setMyGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    if (!user) { setGamesLoading(false); return; }
    const q = query(collection(db, "games"), where("joinedBy", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMyGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setGamesLoading(false);
    });
    return () => unsub();
  }, [user]);

  /* ✅ LIVE ORDERS from Firestore */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) { setOrdersLoading(false); return; }
    const q = query(collection(db, "orders"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [user]);

  /* ✅ Cancel booking in Firestore */
  const cancelBooking = async (id) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "Cancelled" });
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const upcoming = bookings.filter((b) => b.status === "Confirmed").length;
  const displayName = user?.name || "Player";
  const initials = displayName.slice(0, 2).toUpperCase();

  const scrollToPlayer = () =>
    document.getElementById("player-section")?.scrollIntoView({ behavior: "smooth" });

  const choosePlan = (name) =>
    setPlanMsg(`🚀 Razorpay checkout arrives in Phase 4 — "${name}" plan noted for your account!`);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* ── Profile header (real user data) ─────────── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 flex flex-col md:flex-row md:items-center gap-6">
        <span className="grid place-items-center w-20 h-20 rounded-full bg-[#F59E0B] text-2xl font-black text-slate-950 shrink-0">
          {initials}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">Hey, {displayName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">{user?.phone || "Add your details"}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FBBF24]/15 border border-[#FBBF24]/40 px-3 py-1 text-xs font-bold text-[#FBBF24]">
              <Star size={11} fill="currentColor" /> {user?.tier || "Bronze"} Member
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
              Member since 2026
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
              <MapPin size={11} className="text-[#10B981]" /> India
            </span>
          </div>
        </div>
        <div className="flex md:flex-col gap-6 md:text-right">
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 md:justify-end">
              <Coins size={13} className="text-[#FBBF24]" /> PC Points
            </p>
            <p className="text-2xl font-black text-[#FBBF24]">{(user?.points ?? 0).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 md:justify-end">
              <Wallet size={13} className="text-[#10B981]" /> Earnings
            </p>
            <p className="text-2xl font-black text-[#10B981]">₹{(user?.earnings ?? 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* ── Dashboard hub cards ─────────────────────── */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 flex items-center gap-5">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-[#10B981]/15 text-2xl shrink-0">🎮</span>
          <div className="flex-1">
            <h2 className="font-bold text-white">Player Dashboard</h2>
            <p className="text-sm text-slate-400 mt-0.5">Your bookings, games, orders & PC Points</p>
          </div>
          <button onClick={scrollToPlayer} className="rounded-full bg-[#10B981] hover:bg-[#059669] px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95">
            Open ↓
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 flex items-center gap-5">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-[#FBBF24]/15 text-2xl shrink-0">🤝</span>
          <div className="flex-1">
            <h2 className="font-bold text-white">Affiliate Dashboard</h2>
            <p className="text-sm text-slate-400 mt-0.5">Share links, track stats, rank up & earn PC Points</p>
          </div>
          {/* ✅ FIXED: Now links to /affiliate */}
          <Link to="/affiliate" className="rounded-full bg-[#F59E0B] hover:bg-[#D97706] px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95">
            Open →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 flex items-center gap-5 opacity-80">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-slate-800/80 text-2xl shrink-0">🛡️</span>
          <div className="flex-1">
            <h2 className="font-bold text-slate-300">Admin Center</h2>
            <p className="text-sm text-slate-500 mt-0.5">Platform management & moderation</p>
          </div>
          <button onClick={() => { setShowPlans(true); setPlanMsg(""); }} className="inline-flex items-center gap-2 rounded-full border border-red-500/50 px-6 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
            <Lock size={14} /> Upgrade
          </button>
        </div>
      </div>

      {/* ── Unlock All Dashboards upsell ────────────── */}
      <div className="rounded-2xl border border-[#F59E0B]/40 bg-slate-900/60 p-8 md:p-10 text-center space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
        <h2 className="text-lg md:text-xl font-black text-[#FBBF24] flex items-center justify-center gap-2">
          <Zap size={18} fill="currentColor" /> Unlock All Dashboards
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Get full access to Booking Manager, Event Manager, Club Manager, and Tournament Manager starting at ₹599/quarter.
        </p>
        <button
          onClick={() => { setShowPlans((v) => !v); setPlanMsg(""); }}
          className="rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] px-8 py-3.5 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#F59E0B]/25"
        >
          {showPlans ? "Hide Membership Plans" : "View Membership Plans"}
        </button>
        {planMsg && <p className="text-sm font-semibold text-[#10B981]">{planMsg}</p>}
      </div>

      {/* ── Membership plans ────────────────────────── */}
      {showPlans && (
        <div className="grid sm:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <article key={p.name} className={`rounded-2xl border p-6 space-y-4 bg-slate-900/80 backdrop-blur-md transition-all hover:-translate-y-1 ${p.hot ? "border-[#F59E0B] shadow-lg shadow-[#F59E0B]/10" : "border-slate-700/60"}`}>
              {p.hot && <span className="inline-block rounded-full bg-[#F59E0B] px-3 py-1 text-[10px] font-black text-slate-950">⭐ MOST POPULAR</span>}
              <h3 className="font-bold text-white">{p.name}</h3>
              <p className="text-2xl font-black text-[#FBBF24]">₹{p.price.toLocaleString("en-IN")}<span className="text-xs text-slate-500 font-medium">/quarter</span></p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                    <Check size={12} className="text-[#10B981] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => choosePlan(p.name)} className={`w-full rounded-full py-2.5 text-xs font-bold transition-all active:scale-95 ${p.hot ? "bg-[#F59E0B] hover:bg-[#D97706] text-slate-950" : "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white"}`}>
                Choose {p.name}
              </button>
            </article>
          ))}
        </div>
      )}

      {/* ── PLAYER SECTION ──────────────────────────── */}
      <section id="player-section" className="space-y-6 pt-4">
        <h2 className="text-xl font-bold text-white">🎮 Player Dashboard</h2>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Upcoming Bookings", value: upcoming },
            { label: "Active Games", value: myGames.length },
            { label: "Shop Orders", value: orders.length },
            { label: "PC Points", value: (user?.points ?? 0).toLocaleString("en-IN") },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold border transition-all active:scale-95 ${
                tab === t.id
                  ? "bg-[#10B981] border-[#10B981] text-slate-950 shadow-lg shadow-[#10B981]/20"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════ BOOKINGS TAB ═══════════════ */}
        {tab === "bookings" && (
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
                <Loader2 size={20} className="animate-spin text-[#10B981]" /> Loading bookings…
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
                <CalendarDays size={26} className="text-slate-600" />
                <p className="text-sm text-slate-400">No bookings yet. Book a venue to see them here.</p>
                <Link to="/venues" className="text-sm font-semibold text-[#10B981]">Browse venues →</Link>
              </div>
            ) : (
              bookings.map((b) => (
                <article key={b.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{b.venue}</h3>
                    <p className="text-xs text-slate-500 mt-1">{b.sport} · {b.court}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-[#FBBF24]" /> {b.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#FBBF24]" /> {b.slots?.join(", ") || "—"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-black text-white">₹{(b.total || 0).toLocaleString("en-IN")}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${BADGE[b.status] || BADGE.Processing}`}>{b.status}</span>
                    {b.status === "Confirmed" && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <X size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
            <Link to="/venues" className="inline-flex items-center gap-1 text-sm font-semibold text-[#10B981] hover:text-[#34D399]">
              Book a new venue <ChevronRight size={15} />
            </Link>
          </div>
        )}

        {/* ═══════════════ GAMES TAB ═══════════════ */}
        {tab === "games" && (
          <div className="space-y-4">
            {gamesLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
                <Loader2 size={20} className="animate-spin text-[#10B981]" /> Loading games…
              </div>
            ) : myGames.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
                <Gamepad2 size={26} className="text-slate-600" />
                <p className="text-sm text-slate-400">You haven't joined any games yet.</p>
                <Link to="/games" className="text-sm font-semibold text-[#10B981]">Find games →</Link>
              </div>
            ) : (
              myGames.map((g) => {
                const isHost = g.createdBy === user?.uid;
                const joinedCount = g.joinedBy?.length || 0;
                return (
                  <article key={g.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{g.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-[#10B981]" /> {g.venue} · {g.city}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={12} className="text-[#FBBF24]" /> {g.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#FBBF24]" /> {g.time}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{joinedCount}/{g.needed} players</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${isHost ? "bg-[#FBBF24] text-slate-950" : "bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]"}`}>
                        {isHost ? "🎯 Host" : "Player"}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
            <Link to="/games" className="inline-flex items-center gap-1 text-sm font-semibold text-[#10B981] hover:text-[#34D399]">
              Find more games <ChevronRight size={15} />
            </Link>
          </div>
        )}

        {/* ═══════════════ ORDERS TAB ═══════════════ */}
        {tab === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
                <Loader2 size={20} className="animate-spin text-[#10B981]" /> Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
                <Package size={26} className="text-slate-600" />
                <p className="text-sm text-slate-400">No orders yet. Your Shop purchases will appear here.</p>
                <Link to="/shop" className="text-sm font-semibold text-[#10B981]">Start shopping →</Link>
              </div>
            ) : (
              orders.map((o) => (
                <article key={o.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{o.items?.map((i) => `${i.name} ×${i.qty}`).join(", ")}</h3>
                    <p className="text-xs text-slate-500 mt-1">Order #{o.id.slice(0, 6).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-black text-white">₹{o.total?.toLocaleString("en-IN")}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${BADGE[o.status] || BADGE.Processing}`}>{o.status}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}