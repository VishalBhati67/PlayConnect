import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Search, ShoppingBag, Menu, X, Bell, Shield, Home, MapPin, Gamepad2, Users, UserRound } from "lucide-react";
import { useCart } from "../../store/CartContext";
import { useAuth } from "../../store/AuthContext";
import { isUserAdmin } from "../../adminConfig";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Venues", path: "/venues" },
  { label: "Events", path: "/events" },
  { label: "Games", path: "/games" },
  { label: "Shop", path: "/shop" },
  { label: "Sponsors", path: "/sponsors" },
  { label: "Community", path: "/community" },
  { label: "Sports Hub", path: "/hub" },
  { label: "Dashboard", path: "/dashboard" },
];

/* ── relative time helper ─────────────────────────── */
const timeAgo = (ts) => {
  if (!ts?.toMillis) return "just now";
  const m = Math.floor((Date.now() - ts.toMillis()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { user, logout } = useAuth();

  const displayName = user?.name || "Player";
  const isAdmin = isUserAdmin(user); // ✅ NEW

  /* ── ✅ LIVE notifications from Firestore ─────────── */
  useEffect(() => {
    if (!user) { setBookings([]); setOrders([]); return; }
    const bUnsub = onSnapshot(
      query(collection(db, "bookings"), where("uid", "==", user.uid)),
      (snap) => setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const oUnsub = onSnapshot(
      query(collection(db, "orders"), where("uid", "==", user.uid)),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { bUnsub(); oUnsub(); };
  }, [user]);

  const notifs = useMemo(() => [
    ...bookings.map((b) => ({
      key: "b" + b.id,
      icon: "🏟️",
      title: `Booking ${b.status}`,
      desc: `${b.venue} · ${b.date} · ${b.slots?.join(", ") || ""}`,
      at: b.createdAt,
    })),
    ...orders.map((o) => ({
      key: "o" + o.id,
      icon: "📦",
      title: `Order ${o.status}`,
      desc: `${o.items?.map((i) => i.name).join(", ")} · ₹${o.total?.toLocaleString("en-IN")}`,
      at: o.createdAt,
    })),
  ].sort((a, b) => (b.at?.toMillis?.() || 0) - (a.at?.toMillis?.() || 0)).slice(0, 10), [bookings, orders]);

  /* ── unread badge count ─────────────────────────── */
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const seen = Number(localStorage.getItem(`pc_notif_seen_${user.uid}`) || 0);
    setUnread(notifs.filter((n) => (n.at?.toMillis?.() || Date.now()) > seen).length);
  }, [notifs, user]);

  const submitSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    if (q) navigate(`/venues?search=${encodeURIComponent(q)}`);
    else navigate("/venues");
  };

  const toggleNotifs = () => {
    if (!user) { navigate("/login"); return; }
    if (!notifOpen) {
      localStorage.setItem(`pc_notif_seen_${user.uid}`, String(Date.now()));
      setUnread(0);
    }
    setNotifOpen((v) => !v);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* ── Brand ───────────────────────────────── */}
          <Link to="/" className="flex items-center shrink-0">
            <img src="/assets/playconnect-logo.png" alt="PlayConnect" className="h-10 w-auto object-contain" />
          </Link>

          {/* ── Center Links (desktop) ────────────────── */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.path ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
                {pathname === link.path && (
                  <span className="absolute left-3 right-3 -bottom-[3px] h-[3px] rounded-full bg-[#FBBF24]" />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Right Utilities ───────────────────────── */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className={`p-2.5 rounded-full border text-white transition-all ${searchOpen ? "bg-[#10B981]/15 border-[#10B981]/50 text-[#6EE7B7]" : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700"}`}>
              <Search size={17} />
            </button>

            <Link to="/cart" aria-label="Cart" className="relative p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white transition-colors">
              <ShoppingBag size={17} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-[#10B981] text-[10px] font-bold text-slate-950">
                  {count}
                </span>
              )}
            </Link>

            {/* ✅ NEW: Admin shield (admins only) */}
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Admin Center"
                title="Admin Center"
                className="p-2.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 transition-colors"
              >
                <Shield size={17} />
              </Link>
            )}

            {/* ✅ LIVE notification bell + dropdown */}
            <div className="relative">
              <button aria-label="Notifications" onClick={toggleNotifs} className="relative p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white transition-colors">
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <span className="text-[10px] font-bold text-[#10B981]">● Live</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={24} className="mx-auto text-slate-600" />
                          <p className="mt-3 text-xs text-slate-400">No notifications yet.</p>
                          <p className="text-[11px] text-slate-500">Book a venue or place an order to get updates!</p>
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <div key={n.key} className="flex gap-3 px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                            <span className="grid place-items-center w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 text-base shrink-0">{n.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white">{n.title}</p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{n.desc}</p>
                              <p className="text-[10px] text-slate-500 mt-1">{timeAgo(n.at)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/dashboard" onClick={() => setNotifOpen(false)} className="block px-4 py-2.5 text-center text-xs font-bold text-[#10B981] hover:bg-slate-800/60 transition-colors">
                      View Dashboard →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* ✅ AUTH-AWARE: avatar → /profile + logout OR sign in */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/profile"
                  title={displayName}
                  className="grid place-items-center w-10 h-10 rounded-full bg-[#F59E0B] text-slate-950 text-sm font-black shadow-lg shadow-[#F59E0B]/20 hover:ring-2 hover:ring-[#10B981]/60 transition-all"
                >
                  {displayName.slice(0, 2).toUpperCase()}
                </Link>
                <button onClick={logout} className="rounded-full border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold text-sm rounded-full px-5 py-2.5 transition-colors">
                Sign In
              </Link>
            )}

            <button aria-label="Menu" onClick={() => setMobileOpen((v) => !v)} className="xl:hidden p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white">
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-slate-800 bg-[#0B1120]/95 backdrop-blur-xl px-4 py-3">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 p-1.5 shadow-2xl">
            <Search size={16} className="ml-3 text-slate-500" />
            <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search venues, sports, games..." className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
            <button type="submit" className="rounded-xl bg-[#10B981] px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-[#34D399]">Search</button>
          </form>
        </div>
      )}

      {/* ── Mobile Dropdown ───────────────────────────── */}
      {mobileOpen && (
        <nav className="xl:hidden border-t border-slate-800 bg-[#0B1120]/95 backdrop-blur-md px-4 py-3 grid grid-cols-2 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                pathname === link.path
                  ? "bg-slate-800 text-[#FBBF24] border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* ✅ NEW: mobile admin link */}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-full text-sm font-bold text-red-400 border border-red-500/40 bg-red-500/10">
              🛡️ Admin Center
            </Link>
          )}

          {user ? (
            <div className="col-span-2 mt-1 flex gap-2 sm:hidden">
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex-1 text-center bg-slate-800 border border-slate-700 text-white font-bold text-sm rounded-full px-5 py-2.5">
                My Profile
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="flex-1 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="col-span-2 mt-1 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold text-sm rounded-full px-5 py-2.5 sm:hidden text-center">
              Sign In
            </Link>
          )}
        </nav>
      )}

      <nav className="fixed bottom-3 left-1/2 z-[60] flex w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-xl xl:hidden">
        {[
          ["/", Home, "Home"], ["/venues", MapPin, "Explore"], ["/games", Gamepad2, "Play"], ["/community", Users, "Community"], [user ? "/profile" : "/login", UserRound, user ? "Profile" : "Sign In"],
        ].map(([path, Icon, label]) => {
          const active = pathname === path || (path !== "/" && pathname.startsWith(path));
          return <Link key={path} to={path} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-all ${active ? "bg-[#10B981]/15 text-[#6EE7B7]" : "text-slate-500 hover:text-white"}`}>
            <Icon size={17} />
            <span>{label}</span>
          </Link>;
        })}
      </nav>
    </header>
  );
}