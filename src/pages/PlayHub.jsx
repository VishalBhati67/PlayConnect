import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Award, CalendarDays, Check, ChevronRight, Clock3, Crown, DollarSign,
  Gamepad2, Heart, MapPin, MessageCircle, Navigation, Plus, Search, ShieldCheck,
  Star, Target, Trophy, UserPlus, Users, X, Zap, BarChart3, Send, Sparkles,
  Swords, WalletCards, Medal, Flame, CalendarCheck, MapPinned
} from "lucide-react";
import { addDoc, collection, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { getLiveLocation, formatLocationLabel } from "../utils/location";

const SPORTS = ["Football", "Cricket", "Badminton", "Basketball", "Tennis", "Volleyball"];

const GAMES = [
  { id: "pc-1", title: "Mumbai Evening 5v5 Football", sport: "Football", venue: "Andheri Sports Turf", city: "Andheri, Mumbai", date: "Today", time: "7:30 PM", needed: 10, joined: 7, fee: 100, lat: 19.1197, lng: 72.8468 },
  { id: "pc-2", title: "Bandra Cricket Nets", sport: "Cricket", venue: "Bandra Cricket Ground", city: "Bandra, Mumbai", date: "Tomorrow", time: "6:30 AM", needed: 6, joined: 4, fee: 0, lat: 19.0607, lng: 72.8362 },
  { id: "pc-3", title: "Navi Mumbai Badminton Doubles", sport: "Badminton", venue: "Nerul Sports Academy", city: "Nerul, Navi Mumbai", date: "Tomorrow", time: "8:00 PM", needed: 4, joined: 2, fee: 150, lat: 19.033, lng: 73.0297 },
  { id: "pc-4", title: "Powai 3v3 Basketball Run", sport: "Basketball", venue: "Hoop City Arena", city: "Powai, Mumbai", date: "Sat", time: "5:00 PM", needed: 6, joined: 3, fee: 80, lat: 19.1176, lng: 72.906 },
  { id: "pc-5", title: "Worli Tennis Rally", sport: "Tennis", venue: "Worli Tennis Club", city: "Worli, Mumbai", date: "Sun", time: "7:00 AM", needed: 2, joined: 1, fee: 200, lat: 19.0178, lng: 72.8173 },
  { id: "pc-6", title: "Vashi Volleyball 6v6", sport: "Volleyball", venue: "Vashi Sports Complex", city: "Vashi, Navi Mumbai", date: "Mon", time: "7:00 PM", needed: 12, joined: 8, fee: 100, lat: 19.0771, lng: 72.9987 },
];

const PLAYERS = [
  { id: "p1", name: "Rohan Sharma", sport: "Football", role: "Striker", city: "Andheri, Mumbai", rating: 4.8, games: 48, level: 18, lat: 19.1197, lng: 72.8468, color: "bg-[#10B981]" },
  { id: "p2", name: "Priya Patel", sport: "Badminton", role: "Doubles Pro", city: "Ghaziabad", rating: 4.7, games: 61, level: 21, lat: 28.6692, lng: 77.4538, color: "bg-blue-500" },
  { id: "p3", name: "Arjun Mehta", sport: "Cricket", role: "All-rounder", city: "Jaipur", rating: 4.9, games: 73, level: 26, lat: 26.9124, lng: 75.7873, color: "bg-[#F59E0B]" },
  { id: "p4", name: "Sneha Iyer", sport: "Tennis", role: "Baseliner", city: "Pune", rating: 4.6, games: 35, level: 14, lat: 18.5204, lng: 73.8567, color: "bg-purple-500" },
  { id: "p5", name: "Vikram Singh", sport: "Basketball", role: "Point Guard", city: "Powai, Mumbai", rating: 4.5, games: 29, level: 12, lat: 19.1176, lng: 72.906, color: "bg-pink-500" },
];

const BADGES = [
  ["First Game", "Play your first game", "🎮"],
  ["Game Maker", "Host 5 games", "🧩"],
  ["Team Player", "Join 10 games", "🤝"],
  ["Local Legend", "Play 25 games", "🏆"],
  ["Five Star", "Maintain 4.8+ rating", "⭐"],
  ["Hot Streak", "Win 5 games", "🔥"],
];

const CITY_RANKS = [
  ["Mumbai", "Aarav", 2840, "🥇"],
  ["Mumbai", "Rohan", 2510, "🥈"],
  ["Mumbai", "Vishal", 2240, "🥉"],
  ["Pune", "Sneha", 1980, "4"],
  ["Navi Mumbai", "Kabir", 1870, "5"],
];

const distanceKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const initials = (name = "Player") => name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
const formatDistance = (d) => d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md ${className}`}>{children}</div>;
}

function SectionTitle({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#34D399]"><Icon size={18} /></span>
      <div><h2 className="text-xl font-black text-white">{title}</h2>{text && <p className="mt-1 text-xs text-slate-500">{text}</p>}</div>
    </div>
  );
}

export default function PlayHub() {
  const { user } = useAuth();
  const [tab, setTab] = useState("discover");
  const [sport, setSport] = useState("All");
  const [radius, setRadius] = useState(25);
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem("pc_favorites") || "[]"));
  const [joinedSquads, setJoinedSquads] = useState(() => JSON.parse(localStorage.getItem("pc_squads") || "[]"));
  const [ratingMap, setRatingMap] = useState(() => JSON.parse(localStorage.getItem("pc_ratings") || "{}"));
  const [splitPeople, setSplitPeople] = useState(4);
  const [splitTotal, setSplitTotal] = useState(800);
  const [result, setResult] = useState({ scoreA: 3, scoreB: 2, opponent: "Andheri United" });
  const [chat, setChat] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, author: "Rohan", text: "Anyone coming 15 mins early?", at: "7:02 PM" },
    { id: 2, author: "You", text: "Yes, I'll be there.", at: "7:04 PM" },
  ]);

  const [games, setGames] = useState(GAMES);
  const [liveMessages, setLiveMessages] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("pc_favorites");
    if (!stored) localStorage.setItem("pc_favorites", "[]");
  }, []);

  useEffect(() => {
    const q = query(collection(db, "gameChats"));
    const unsub = onSnapshot(q, (snap) => {
      setLiveMessages(snap.docs.slice(-12).map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "games"));
    const unsub = onSnapshot(q, (snap) => {
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => g.lat && g.lng);
      if (remote.length) setGames([...remote, ...GAMES.filter((g) => !remote.some((r) => r.title === g.title))]);
    }, () => {});
    return () => unsub();
  }, []);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("pc_favorites", JSON.stringify(next));
  };

  const toggleSquad = (name) => {
    const next = joinedSquads.includes(name) ? joinedSquads.filter((x) => x !== name) : [...joinedSquads, name];
    setJoinedSquads(next);
    localStorage.setItem("pc_squads", JSON.stringify(next));
  };

  const ratePlayer = async (id, value) => {
    const next = { ...ratingMap, [id]: value };
    setRatingMap(next);
    localStorage.setItem("pc_ratings", JSON.stringify(next));
    try {
      await addDoc(collection(db, "playerRatings"), {
        playerId: id,
        fromUid: user?.uid || "guest",
        rating: value,
        createdAt: serverTimestamp(),
      });
    } catch {}
  };

  const enableLocation = async () => {
    setLocStatus("loading");
    try {
      const location = await getLiveLocation();
      setUserLoc(location);
      setLocStatus("ready");
    } catch {
      setLocStatus("error");
    }
  };

  const nearbyGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games
      .map((g) => ({ ...g, distance: userLoc && g.lat ? distanceKm(userLoc, g) : undefined }))
      .filter((g) => (sport === "All" || g.sport === sport))
      .filter((g) => !q || `${g.title} ${g.venue} ${g.city} ${g.sport}`.toLowerCase().includes(q))
      .filter((g) => !userLoc || radius === "All" || g.distance <= radius)
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [games, sport, search, userLoc, radius]);

  const matchedPlayers = useMemo(() => {
    return PLAYERS.map((p) => ({
      ...p,
      distance: userLoc ? distanceKm(userLoc, p) : undefined,
      match: Math.min(99, Math.round(65 + p.rating * 6 + (p.sport === sport ? 16 : sport === "All" ? 0 : -8) + (userLoc ? Math.max(0, 12 - distanceKm(userLoc, p)) : 0))),
    }))
      .filter((p) => sport === "All" || p.sport === sport)
      .filter((p) => !userLoc || radius === "All" || p.distance <= radius)
      .sort((a, b) => b.match - a.match);
  }, [sport, userLoc, radius]);

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chat.trim()) return;
    const text = chat.trim();
    setMessages((m) => [...m, { id: Date.now(), author: user?.name || "You", text, at: "now" }]);
    setChat("");
    try {
      await addDoc(collection(db, "gameChats"), { author: user?.name || "Player", uid: user?.uid || "guest", text, createdAt: serverTimestamp() });
    } catch {}
  };

  const submitResult = (e) => {
    e.preventDefault();
    const points = Number(result.scoreA) > Number(result.scoreB) ? 50 : 20;
    setResult((r) => ({ ...r, saved: true, points }));
  };

  const favoriteGames = games.filter((g) => favorites.includes(g.id));
  const splitEach = splitPeople > 0 ? Math.ceil(Number(splitTotal) / Number(splitPeople)) : 0;
  const xp = user?.points ?? 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const xpProgress = xp % 100;
  const myName = user?.name || "Player";

  const mapPins = nearbyGames.slice(0, 8);
  const mapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=72.79%2C18.96%2C73.08%2C19.20&layer=mapnik";

  const tabs = [
    ["discover", "Discover", MapPinned],
    ["players", "Players", Users],
    ["social", "Social", MessageCircle],
    ["progress", "Progress", Trophy],
    ["compete", "Compete", Swords],
    ["tools", "Tools", WalletCards],
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#10251f] via-slate-900 to-[#101828] p-6 md:p-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#10B981]/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-[#6EE7B7]"><Sparkles size={12} /> PlayConnect Super Hub</span>
            <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white">Everything you need to <span className="text-[#10B981]">play better.</span></h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-slate-400">Find games, match with players, build squads, track XP, manage tournaments, split costs and keep your sports life in one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Level</p><p className="mt-1 text-2xl font-black text-white">{level}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">PC Points</p><p className="mt-1 text-2xl font-black text-[#FBBF24]">{xp.toLocaleString("en-IN")}</p></div>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all ${tab === id ? "border-[#10B981] bg-[#10B981] text-slate-950 shadow-lg shadow-[#10B981]/20" : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-white"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="space-y-8">
          <section>
            <SectionTitle icon={MapPinned} title="Interactive Sports Map" text="Live game pins, nearby venues and a quick route into the game you want." />
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-[1.7fr_1fr]">
                <div className="relative min-h-[430px] bg-slate-950">
                  <iframe title="PlayConnect sports map" src={mapUrl} className="absolute inset-0 h-full w-full border-0 opacity-80" loading="lazy" />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {["All", ...SPORTS].map((s) => <button key={s} onClick={() => setSport(s)} className={`pointer-events-auto rounded-full px-3 py-1.5 text-[10px] font-black shadow-lg ${sport === s ? "bg-[#10B981] text-slate-950" : "bg-slate-950/90 text-slate-300 border border-white/10"}`}>{s}</button>)}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 bg-slate-950/85 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-md">📍 {userLoc ? formatLocationLabel(userLoc) : "Mumbai sports zone"}</span>
                    <Link to="/venues" className="rounded-full bg-[#F59E0B] px-4 py-2 text-[10px] font-black text-slate-950">Explore Venues →</Link>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-4"><div><p className="text-sm font-bold text-white">Games on the map</p><p className="text-[11px] text-slate-500">{nearbyGames.length} matching games</p></div><button onClick={enableLocation} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white">{locStatus === "loading" ? "Locating…" : "Use location"}</button></div>
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {mapPins.map((g) => (
                      <Link key={g.id} to={`/games/${encodeURIComponent(g.title)}`} className="block rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-[#10B981]/40 transition-colors">
                        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#10B981]/10 text-sm">📍</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{g.title}</p><p className="mt-1 text-[10px] text-slate-500">{g.venue} · {g.time}</p></div><ChevronRight size={14} className="text-slate-600" /></div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle icon={Sparkles} title="AI-style Find My Game" text="A transparent recommendation score based on sport, distance, availability and price." />
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {nearbyGames.slice(0, 6).map((g) => {
                const score = Math.min(99, 72 + (g.joined < g.needed ? 9 : 0) + (g.fee <= 100 ? 8 : 0) + (g.distance !== undefined ? Math.max(0, 10 - Math.round(g.distance / 2)) : 0));
                return <Card key={g.id} className="p-5 hover:-translate-y-1 transition-transform"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-[#10B981]/10 px-2.5 py-1 text-[10px] font-black text-[#6EE7B7]">{score}% match</span><button onClick={() => toggleFavorite(g.id)} className={favorites.includes(g.id) ? "text-red-400" : "text-slate-600 hover:text-red-400"}><Heart size={17} fill={favorites.includes(g.id) ? "currentColor" : "none"} /></button></div><h3 className="mt-3 font-bold text-white">{g.title}</h3><p className="mt-1 text-xs text-slate-500">{g.venue} · {g.city}</p><div className="mt-4 flex items-center justify-between text-[11px]"><span className="text-slate-400">{g.joined}/{g.needed} joined</span><span className="font-bold text-[#FBBF24]">{g.fee ? `₹${g.fee}` : "Free"}</span></div><Link to={`/games/${encodeURIComponent(g.title)}`} className="mt-4 inline-flex text-xs font-bold text-[#10B981]">Join game <ChevronRight size={13} /></Link></Card>;
              })}
            </div>
          </section>

          <section>
            <SectionTitle icon={Heart} title="Favorites & Wishlist" text="Save games now and jump back in when you are ready." />
            <Card className="p-5">
              {favoriteGames.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{favoriteGames.map((g) => <div key={g.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><span className="text-lg">❤️</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{g.title}</p><p className="text-[10px] text-slate-500">{g.date} · {g.time}</p></div><button onClick={() => toggleFavorite(g.id)}><X size={14} className="text-slate-500 hover:text-white" /></button></div>)}</div> : <p className="py-5 text-center text-xs text-slate-500">Tap the heart on a game to build your wishlist.</p>}
            </Card>
          </section>
        </div>
      )}

      {tab === "players" && (
        <div className="space-y-8">
          <section>
            <SectionTitle icon={Users} title="Find Players" text="Match by sport, skill, rating and proximity." />
            <Card className="p-5">
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1"><Search size={15} className="absolute left-3 top-3 text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players, roles or city..." className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-9 pr-3 text-xs text-white outline-none" /></div>
                <select value={sport} onChange={(e) => setSport(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-xs text-white outline-none">{["All", ...SPORTS].map((s) => <option key={s}>{s}</option>)}</select>
                <button onClick={enableLocation} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">{locStatus === "loading" ? "Locating…" : "📍 Nearby"}</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {matchedPlayers.map((p) => <article key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-center gap-3"><span className={`grid h-12 w-12 place-items-center rounded-full ${p.color} text-xs font-black text-slate-950`}>{initials(p.name)}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-sm font-bold text-white truncate">{p.name}</h3><span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[9px] font-black text-[#6EE7B7]">{p.match}%</span></div><p className="text-[11px] text-slate-500">{p.role} · {p.sport} · Level {p.level}</p><p className="mt-1 text-[10px] text-slate-400 flex items-center gap-2"><Star size={10} className="text-[#FBBF24]" fill="currentColor" /> {p.rating} · {p.games} games {p.distance !== undefined && `· ${formatDistance(p.distance)}`}</p></div><button className="rounded-full bg-[#10B981] px-3 py-2 text-[10px] font-black text-slate-950"><UserPlus size={13} /></button></div><div className="mt-4 border-t border-slate-800 pt-3"><p className="text-[10px] font-bold text-slate-500 mb-2">Rate reputation</p><div className="flex gap-1">{[1,2,3,4,5].map((n) => <button key={n} onClick={() => ratePlayer(p.id, n)} className={`rounded-lg p-1.5 ${(ratingMap[p.id] || 0) >= n ? "text-[#FBBF24] bg-[#FBBF24]/10" : "text-slate-700 bg-slate-900"}`}><Star size={13} fill="currentColor" /></button>)}</div></div></article>)}
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle icon={Users} title="Squads & Teams" text="Build repeatable teams instead of starting from zero every match." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[["Mumbai Strikers","Football","8/10","⚽"],["Navi Smashers","Badminton","6/8","🏸"],["Powai Hoopers","Basketball","5/6","🏀"]].map(([name, s, count, emoji]) => {
                const joined = joinedSquads.includes(name);
                return <Card key={name} className="p-5"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-800 text-xl">{emoji}</span><span className="text-[10px] font-bold text-slate-500">{count}</span></div><h3 className="mt-4 font-bold text-white">{name}</h3><p className="mt-1 text-xs text-slate-500">{s} · weekly games · private chat</p><button onClick={() => toggleSquad(name)} className={`mt-4 w-full rounded-xl py-2.5 text-xs font-black ${joined ? "border border-[#10B981]/40 bg-[#10B981]/10 text-[#6EE7B7]" : "bg-slate-800 text-white hover:bg-slate-700"}`}>{joined ? "✓ Joined Squad" : "Join Squad"}</button></Card>;
              })}
            </div>
          </section>
        </div>
      )}

      {tab === "social" && (
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <section>
            <SectionTitle icon={MessageCircle} title="Game Chat" text="Keep match-day coordination in one place." />
            <Card className="overflow-hidden">
              <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between"><div><p className="text-sm font-bold text-white">Mumbai Evening 5v5 Football</p><p className="text-[10px] text-[#6EE7B7]">● 7 players joined</p></div><Link to={`/games/${encodeURIComponent("Mumbai Evening 5v5 Football")}`} className="text-[10px] font-bold text-[#10B981]">Open game →</Link></div>
              <div className="h-80 overflow-y-auto p-5 space-y-3">{[...messages, ...liveMessages].map((m) => <div key={m.id} className={`max-w-[82%] rounded-2xl p-3 ${m.author === (user?.name || "You") || m.author === "You" ? "ml-auto bg-[#10B981]/15 border border-[#10B981]/20" : "bg-slate-800/70"}`}><p className="text-[10px] font-bold text-slate-400">{m.author}</p><p className="mt-1 text-xs text-white">{m.text}</p><p className="mt-1 text-[9px] text-slate-600">{m.at || "live"}</p></div>)}</div>
              <form onSubmit={sendChat} className="border-t border-slate-800 p-4 flex gap-2"><input value={chat} onChange={(e) => setChat(e.target.value)} placeholder="Message your players..." className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-xs text-white outline-none" /><button className="rounded-xl bg-[#10B981] px-4 text-slate-950"><Send size={15} /></button></form>
            </Card>
          </section>
          <section>
            <SectionTitle icon={CalendarCheck} title="Sports Calendar" text="Your upcoming sports life, at a glance." />
            <Card className="p-5 space-y-3">{[
              ["Today","Football","7:30 PM","Andheri Sports Turf"],
              ["Tomorrow","Cricket","6:30 AM","Bandra Cricket Ground"],
              ["Sat","Basketball","5:00 PM","Hoop City Arena"],
              ["Sun","Tennis","7:00 AM","Worli Tennis Club"],
            ].map(([d,s,t,v]) => <div key={d+s} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><span className="w-12 text-center text-[10px] font-black text-[#FBBF24]">{d}</span><div className="h-8 w-px bg-slate-800" /><div className="flex-1"><p className="text-xs font-bold text-white">{s} · {t}</p><p className="text-[10px] text-slate-500">{v}</p></div><CalendarDays size={15} className="text-slate-600" /></div>)}</Card>
            <Card className="mt-4 p-5"><p className="text-xs font-bold text-white">Notifications Center</p><p className="mt-1 text-[11px] text-slate-500">Bookings, orders and live activity are already synced in the top-right bell.</p><Link to="/dashboard" className="mt-3 inline-flex text-xs font-bold text-[#10B981]">View all activity →</Link></Card>
          </section>
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-8">
          <section>
            <SectionTitle icon={Trophy} title="XP, Levels & Achievements" text="Every game contributes to your PlayConnect identity." />
            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-5">
              <Card className="p-6"><div className="flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-2xl">🏆</span><div><p className="text-xs text-slate-500">Current level</p><p className="text-3xl font-black text-white">{level}</p><p className="text-[11px] text-[#FBBF24]">{xpProgress}/100 XP to next level</p></div></div><div className="mt-6 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#10B981] to-[#FBBF24]" style={{width:`${xpProgress}%`}} /></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-[10px] text-slate-500">Games</p><p className="text-lg font-black text-white">24</p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-[10px] text-slate-500">Win rate</p><p className="text-lg font-black text-white">71%</p></div></div></Card>
              <div className="grid sm:grid-cols-2 gap-3">{BADGES.map(([name, desc, emoji], i) => <Card key={name} className={`p-4 ${i < 3 ? "border-[#10B981]/25" : ""}`}><div className="flex gap-3"><span className="text-2xl">{emoji}</span><div><p className="text-xs font-bold text-white">{name}</p><p className="mt-1 text-[10px] text-slate-500">{desc}</p><span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-black ${i < 3 ? "bg-[#10B981]/10 text-[#6EE7B7]" : "bg-slate-800 text-slate-600"}`}>{i < 3 ? "Unlocked" : "Locked"}</span></div></div></Card>)}</div>
            </div>
          </section>

          <section>
            <SectionTitle icon={Crown} title="City Leaderboards" text="Compete with the best players in your city." />
            <Card className="overflow-hidden"><div className="grid grid-cols-[48px_1fr_100px_80px] px-5 py-3 text-[10px] uppercase tracking-wider text-slate-600 border-b border-slate-800"><span>#</span><span>Player</span><span>City</span><span className="text-right">XP</span></div>{CITY_RANKS.map(([city,name,points,rank],i)=><div key={name} className="grid grid-cols-[48px_1fr_100px_80px] items-center px-5 py-3.5 border-b border-slate-800/70"><span className="text-sm font-black text-white">{rank}</span><span className="flex items-center gap-2 text-xs font-bold text-white"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-800 text-[9px]">{initials(name)}</span>{name}</span><span className="text-[10px] text-slate-500">{city}</span><span className="text-right text-xs font-black text-[#FBBF24]">{points.toLocaleString("en-IN")}</span></div>)}</Card>
          </section>

          <section>
            <SectionTitle icon={Award} title="Professional Sports Card" text="A shareable player identity with your stats, rating and achievements." />
            <Card className="relative overflow-hidden p-6 md:p-8"><div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#10B981]/10 blur-3xl" /><div className="relative flex flex-col sm:flex-row gap-6 items-start"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[#F59E0B] text-xl font-black text-slate-950">{initials(myName)}</span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl font-black text-white">{myName}</h3><span className="rounded-full bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 text-[10px] font-black text-[#6EE7B7]">Level {level}</span></div><p className="mt-1 text-xs text-slate-500">Football · Mumbai · {user?.tier || "Bronze"} tier</p><div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">{[["Rating","4.8 ⭐"],["Games","24"],["Wins","17"],["XP",xp.toLocaleString("en-IN")]].map(([a,b])=><div key={a} className="rounded-xl bg-slate-950/60 p-3"><p className="text-[9px] uppercase text-slate-600">{a}</p><p className="mt-1 text-sm font-black text-white">{b}</p></div>)}</div></div></div></Card>
          </section>
        </div>
      )}

      {tab === "compete" && (
        <div className="space-y-8">
          <section>
            <SectionTitle icon={Swords} title="Post-Game Results" text="Record a result, build your stats and earn XP." />
            <Card className="p-5"><form onSubmit={submitResult} className="grid md:grid-cols-[1fr_100px_30px_100px_1fr] items-end gap-3"><label className="text-xs text-slate-400">Opponent<input value={result.opponent} onChange={(e)=>setResult({...result,opponent:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none" /></label><label className="text-xs text-slate-400">You<input type="number" min="0" value={result.scoreA} onChange={(e)=>setResult({...result,scoreA:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none" /></label><span className="pb-3 text-center text-slate-600">—</span><label className="text-xs text-slate-400">Them<input type="number" min="0" value={result.scoreB} onChange={(e)=>setResult({...result,scoreB:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none" /></label><button className="rounded-xl bg-[#10B981] px-4 py-3 text-xs font-black text-slate-950">Save Result</button></form>{result.saved && <p className="mt-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 p-3 text-xs font-bold text-[#6EE7B7]">✓ Result saved locally · +{result.points} XP earned for this demo profile.</p>}</Card>
          </section>

          <section>
            <SectionTitle icon={Trophy} title="Tournament Manager" text="A ready-to-use bracket for your next event." />
            <Card className="p-5 overflow-x-auto"><div className="min-w-[720px] grid grid-cols-3 gap-6 items-center"><div className="space-y-4">{["Mumbai Strikers","Navi Smashers","Powai Hoopers","Bandra United"].map((x,i)=><div key={x} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-bold text-white">{x}<span className="float-right text-[9px] text-slate-600">QF {i+1}</span></div>)}</div><div className="space-y-16"><div className="rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-3 text-xs font-bold text-white">Mumbai Strikers <span className="float-right text-[#FBBF24]">SF</span></div><div className="rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-3 text-xs font-bold text-white">Powai Hoopers <span className="float-right text-[#FBBF24]">SF</span></div></div><div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-5 text-center"><Medal size={24} className="mx-auto text-[#FBBF24]" /><p className="mt-2 text-sm font-black text-white">Final</p><p className="mt-2 text-[11px] text-slate-500">Winner advances to the PlayConnect City Cup.</p></div></div></Card>
          </section>
        </div>
      )}

      {tab === "tools" && (
        <div className="space-y-8">
          <section>
            <SectionTitle icon={WalletCards} title="Split Payment" text="Make shared venue costs painless." />
            <Card className="p-5"><div className="grid md:grid-cols-3 gap-4"><label className="text-xs text-slate-400">Total amount<input type="number" value={splitTotal} onChange={(e)=>setSplitTotal(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none" /></label><label className="text-xs text-slate-400">Players<input type="number" min="1" value={splitPeople} onChange={(e)=>setSplitPeople(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none" /></label><div className="rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 p-3"><p className="text-[10px] text-slate-500">Each player pays</p><p className="mt-1 text-2xl font-black text-[#6EE7B7]">₹{splitEach.toLocaleString("en-IN")}</p></div></div><button className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white"><DollarSign size={14} /> Share split</button></Card>
          </section>

          <section>
            <SectionTitle icon={BarChart3} title="Venue Owner Analytics" text="A preview dashboard for venue partners and future owner accounts." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[["Bookings","184","↑ 18%"],["Utilization","82%","↑ 7%"],["Revenue","₹2.84L","↑ 21%"],["Repeat Players","64%","↑ 11%"]].map(([a,b,c])=><Card key={a} className="p-5"><p className="text-xs text-slate-500">{a}</p><p className="mt-2 text-2xl font-black text-white">{b}</p><p className="mt-1 text-[10px] font-bold text-[#6EE7B7]">{c} this month</p></Card>)}</div>
          </section>

          <section>
            <SectionTitle icon={ShieldCheck} title="Emergency & Safety" text="Quick-access tools for safer play." />
            <div className="grid md:grid-cols-3 gap-4"><Card className="p-5"><ShieldCheck className="text-[#10B981]" size={22}/><h3 className="mt-4 text-sm font-bold text-white">SOS contacts</h3><p className="mt-1 text-[11px] text-slate-500">Keep emergency contacts one tap away.</p><button onClick={()=>alert("Emergency mode: call your local emergency service and venue staff.")} className="mt-4 w-full rounded-xl bg-red-500/10 border border-red-500/30 py-2.5 text-xs font-black text-red-300">Emergency Help</button></Card><Card className="p-5"><MapPin className="text-[#FBBF24]" size={22}/><h3 className="mt-4 text-sm font-bold text-white">Share venue</h3><p className="mt-1 text-[11px] text-slate-500">Use the venue page to share location with teammates.</p><Link to="/venues" className="mt-4 inline-block text-xs font-bold text-[#10B981]">Find venue →</Link></Card><Card className="p-5"><Users className="text-cyan-300" size={22}/><h3 className="mt-4 text-sm font-bold text-white">Trusted squad</h3><p className="mt-1 text-[11px] text-slate-500">Play with known teammates and use group chat.</p><button onClick={()=>setTab("players")} className="mt-4 text-xs font-bold text-[#10B981]">Open squads →</button></Card></div>
          </section>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[["Book a venue","/venues",MapPin],["Find games","/games",Gamepad2],["Community","/community",Users],["My dashboard","/dashboard",Activity]].map(([label,to,Icon])=><Link key={label} to={to} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-[#10B981]/30 transition-colors"><Icon size={17} className="text-[#10B981]" /><p className="mt-3 text-xs font-bold text-white">{label}</p><p className="mt-1 text-[10px] text-slate-500">Continue your PlayConnect journey →</p></Link>)}
      </div>
    </main>
  );
}
