import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, setDoc, doc, updateDoc, arrayUnion, arrayRemove, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { Users, MapPin, CalendarDays, Clock, Plus, X, Check, Trophy, Loader2, LocateFixed, Navigation, DatabaseZap, Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { getLiveLocation, formatLocationLabel } from "../utils/location";

const SPORT_OPTIONS = [
  { name: "Football", emoji: "⚽" },
  { name: "Cricket", emoji: "🏏" },
  { name: "Badminton", emoji: "🏸" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Tennis", emoji: "🎾" },
  { name: "Volleyball", emoji: "🏐" },
  { name: "Table Tennis", emoji: "🏓" },
  { name: "Hockey", emoji: "🏑" },
];

/* ── City coordinates ─────────────────────────────────────────── */
const CITIES = [
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Ghaziabad", lat: 28.6692, lng: 77.4538 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
];

/* ── SEED DATA ────────────────────────────────────────────────── */
const SEED_GAMES = [
  { title: "Mumbai Evening 5v5 Football", sport: "Football", venue: "Andheri Sports Turf", city: "Andheri, Mumbai", date: "Today", time: "7:30 PM", joinedBy: [], needed: 10, fee: "₹100", createdBy: "system", lat: 19.1197, lng: 72.8468 },
  { title: "Bandra Cricket Nets", sport: "Cricket", venue: "Bandra Cricket Ground", city: "Bandra, Mumbai", date: "Tomorrow", time: "6:30 AM", joinedBy: [], needed: 6, fee: "Free", createdBy: "system", lat: 19.0607, lng: 72.8362 },
  { title: "Navi Mumbai Badminton Doubles", sport: "Badminton", venue: "Nerul Sports Academy", city: "Nerul, Navi Mumbai", date: "Tomorrow", time: "8:00 PM", joinedBy: [], needed: 4, fee: "₹150", createdBy: "system", lat: 19.033, lng: 73.0297 },
  { title: "Powai 3v3 Basketball Run", sport: "Basketball", venue: "Hoop City Arena", city: "Powai, Mumbai", date: "Sat, 10 Oct", time: "5:00 PM", joinedBy: [], needed: 6, fee: "₹80", createdBy: "system", lat: 19.1176, lng: 72.906 },
  { title: "Worli Tennis Rally", sport: "Tennis", venue: "Worli Tennis Club", city: "Worli, Mumbai", date: "Sun, 11 Oct", time: "7:00 AM", joinedBy: [], needed: 2, fee: "₹200", createdBy: "system", lat: 19.0178, lng: 72.8173 },
  { title: "Thane Weekend Football Friendly", sport: "Football", venue: "Thane Sports Arena", city: "Thane", date: "Sun, 11 Oct", time: "6:00 PM", joinedBy: [], needed: 14, fee: "₹120", createdBy: "system", lat: 19.2183, lng: 72.9781 },
  { title: "Vashi Volleyball 6v6", sport: "Volleyball", venue: "Vashi Sports Complex", city: "Vashi, Navi Mumbai", date: "Mon, 12 Oct", time: "7:00 PM", joinedBy: [], needed: 12, fee: "₹100", createdBy: "system", lat: 19.0771, lng: 72.9987 },
  { title: "Pune Table Tennis Meetup", sport: "Table Tennis", venue: "Spin Masters Club", city: "Baner, Pune", date: "Tue, 13 Oct", time: "8:00 PM", joinedBy: [], needed: 8, fee: "₹120", createdBy: "system", lat: 18.559, lng: 73.7868 },
  { title: "Delhi Cricket T20 Practice", sport: "Cricket", venue: "Dwarka Cricket Ground", city: "Dwarka, Delhi", date: "Wed, 14 Oct", time: "6:00 AM", joinedBy: [], needed: 16, fee: "₹200", createdBy: "system", lat: 28.5921, lng: 77.046, },
  { title: "Ahmedabad Basketball 3v3", sport: "Basketball", venue: "Hoop Ahmedabad", city: "Vastrapur, Ahmedabad", date: "Thu, 15 Oct", time: "6:30 PM", joinedBy: [], needed: 6, fee: "₹90", createdBy: "system", lat: 23.0365, lng: 72.5293 },
  { title: "Jaipur Hockey Evening Game", sport: "Hockey", venue: "Pink City Hockey Turf", city: "Sanganer, Jaipur", date: "Fri, 16 Oct", time: "7:00 PM", joinedBy: [], needed: 14, fee: "₹150", createdBy: "system", lat: 26.8206, lng: 75.7936 },
  { title: "Chennai Badminton Singles", sport: "Badminton", venue: "SmashPoint Arena", city: "Velachery, Chennai", date: "Sat, 17 Oct", time: "9:00 AM", joinedBy: [], needed: 2, fee: "₹180", createdBy: "system", lat: 12.9815, lng: 80.218 },
  { title: "Mumbai Sunday Cricket League", sport: "Cricket", venue: "BKC Cricket Ground", city: "BKC, Mumbai", date: "Sun, 18 Oct", time: "8:00 AM", joinedBy: [], needed: 22, fee: "₹250", createdBy: "system", lat: 19.066, lng: 72.8677 },
  { title: "Andheri Night Football 7s", sport: "Football", venue: "Metro Turf Arena", city: "Andheri, Mumbai", date: "Sun, 18 Oct", time: "8:30 PM", joinedBy: [], needed: 14, fee: "₹150", createdBy: "system", lat: 19.119, lng: 72.846 },
];

const RADII = [10, 25, 50, 100, "All"];
const emojiOf = (sport) => SPORT_OPTIONS.find((s) => s.name === sport)?.emoji || "🎮";

const statusOf = (g) => {
  const joinedCount = g.joinedBy?.length || 0;
  return joinedCount >= g.needed ? "Full" : g.date === "Today" ? "Starting Soon" : "Open";
};

const distanceKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const formatDist = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export default function Games() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [games, setGames] = useState(SEED_GAMES.map((g) => ({ ...g, id: `local-${g.title}` })));
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const syncStarted = useRef(false);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [showForm, setShowForm] = useState(false);

  /* ── Location state ─────────────────────────────── */
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [radius, setRadius] = useState(25);

  const [form, setForm] = useState({ title: "", sport: "Football", venue: "", city: "", date: "Today", time: "6:00 PM", needed: 10, fee: "" });

  /* ── 1. LIVE FIRESTORE LISTENER ─────────────────── */
  useEffect(() => {
    const q = query(collection(db, "games"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const existingTitles = new Set(data.map((g) => g.title));
      const localMissing = SEED_GAMES
        .filter((g) => !existingTitles.has(g.title))
        .map((g) => ({ ...g, id: `local-${g.title}` }));

      // Always show the fresh catalog even if Firestore write permissions
      // prevent automatic seeding.
      setGames([...data, ...localMissing]);
      setLoading(false);

      // Best-effort sync to Firebase, without making display depend on it.
      if (!syncStarted.current && localMissing.length) {
        syncStarted.current = true;
        try {
          await Promise.all(localMissing.map((game) => {
            const safeId = `seed-${game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
            return setDoc(doc(db, "games", safeId), game, { merge: true });
          }));
        } catch (err) {
          console.warn("Firebase game sync skipped/blocked; fresh games remain visible.", err);
        }
      }
    }, (err) => {
      console.error("Firestore error:", err);
      setGames(SEED_GAMES.map((g) => ({ ...g, id: `local-${g.title}` })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ── 2. SEED DATABASE ───────────────────────────── */
  const seedDatabase = async () => {
    setSeeding(true);
    try {
      for (const g of SEED_GAMES) await addDoc(collection(db, "games"), g);
    } catch (err) { console.error(err); }
    finally { setSeeding(false); }
  };

  /* ── Location Logic ─────────────────────────────── */
  const enableLocation = async () => {
    setLocStatus("loading");
    setLocationError("");
    try {
      const location = await getLiveLocation();
      setUserLoc(location);
      setLocStatus("ready");
    } catch (err) {
      console.error("Live location error:", err);
      setLocationError(err.message || "Unable to detect your location.");
      setLocStatus("error");
    }
  };
  const disableLocation = () => { setUserLoc(null); setLocStatus("idle"); setLocationError(""); };
  const pickCity = (cityName) => {
    const c = CITIES.find((x) => x.name === cityName);
    if (c) {
      setUserLoc({ lat: c.lat, lng: c.lng, city: c.name, locality: c.name, region: "", accuracy: 0 });
      setLocationError("");
      setLocStatus("ready");
    }
  };
  const locReady = locStatus === "ready" && userLoc;

  const coordsForCity = (cityName) => {
    const c = CITIES.find((x) => cityName.toLowerCase().includes(x.name.toLowerCase()));
    if (c) return { lat: c.lat, lng: c.lng };
    if (userLoc) return { ...userLoc };
    return { lat: CITIES[0].lat, lng: CITIES[0].lng };
  };

  /* ── 3. REAL-TIME JOIN / LEAVE ──────────────────── */
  const toggleJoin = async (game) => {
    if (!user) { navigate("/login"); return; }
    const gameRef = doc(db, "games", game.id);
    const isJoined = game.joinedBy?.includes(user.uid);

    try {
      if (isJoined) {
        await updateDoc(gameRef, { joinedBy: arrayRemove(user.uid) });
      } else {
        if ((game.joinedBy?.length || 0) >= game.needed) return;
        await updateDoc(gameRef, { joinedBy: arrayUnion(user.uid) });
      }
    } catch (err) { console.error(err); }
  };

  /* ── 4. CREATE GAME ─────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!form.title.trim() || !form.venue.trim() || form.needed < 2) return;

    try {
      await addDoc(collection(db, "games"), {
        title: form.title.trim(),
        sport: form.sport,
        venue: form.venue.trim(),
        city: form.city.trim() || "Your City",
        date: form.date, time: form.time,
        needed: Number(form.needed),
        fee: form.fee ? `₹${form.fee}` : "Free",
        createdBy: user.uid,
        joinedBy: [user.uid], // Creator auto-joins
        ...coordsForCity(form.city),
      });
      setForm({ title: "", sport: "Football", venue: "", city: "", date: "Today", time: "6:00 PM", needed: 10, fee: "" });
      setShowForm(false);
    } catch (err) { console.error(err); }
  };

  /* ── Filter + distance sort ─────────────────────── */
  let list = games.filter((g) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSport = filter === "All" || g.sport === filter;
    const matchesSearch = !q || [g.title, g.venue, g.city, g.sport].some((v) => String(v || "").toLowerCase().includes(q));
    const matchesOpen = !openOnly || statusOf(g) !== "Full";
    return matchesSport && matchesSearch && matchesOpen;
  });
  if (locReady) {
    list = list.map((g) => ({ ...g, distance: distanceKm(userLoc, g) }));
    if (radius !== "All") list = list.filter((g) => g.distance <= radius);
    list = [...list].sort((a, b) => a.distance - b.distance);
  }
  if (sortBy === "soonest") list = [...list].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time).localeCompare(String(b.time)));
  if (sortBy === "spots") list = [...list].sort((a, b) => (b.needed - (b.joinedBy?.length || 0)) - (a.needed - (a.joinedBy?.length || 0)));

  const openCount = games.filter((g) => statusOf(g) !== "Full").length;
  const inputCls = "mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]";

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#10B981]" /></div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Header ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">🎮 Join a Game <span className="text-[#10B981]">Nearby</span></h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">{openCount} open games right now — grab a slot or create your own match.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all active:scale-95 shadow-lg ${showForm ? "bg-slate-800 border border-slate-700 text-white shadow-none" : "bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 shadow-[#F59E0B]/20"}`}>
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Create Game</>}
        </button>
      </div>

      {/* ── LOCATION BAR ───────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
        {locStatus === "idle" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Navigation size={15} className="text-[#10B981]" /> Find games near you</h2>
              <p className="text-xs text-slate-400 mt-1">Use your device GPS to find the nearest games. Your location is only used in your browser for distance sorting.</p>
            </div>
            <button onClick={enableLocation} className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20"><LocateFixed size={16} /> Use My Location</button>
          </div>
        )}
        {locStatus === "loading" && <div className="flex items-center gap-3 text-sm text-slate-300"><Loader2 size={18} className="animate-spin text-[#10B981]" /> Getting your live GPS location…</div>}
        {locStatus === "error" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-[#FBBF24]">⚠️ {locationError || "Couldn't access your location."}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={enableLocation} className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] px-5 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95"><RefreshCw size={15} /> Try Again</button>
                <select onChange={(e) => pickCity(e.target.value)} defaultValue="" className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981] cursor-pointer">
                  <option value="" disabled>Choose city…</option>
                  {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
        {locReady && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div><p className="text-sm font-semibold text-[#10B981] flex items-center gap-2"><MapPin size={15} /> Live location active</p><p className="mt-1 text-[11px] text-slate-400">{formatLocationLabel(userLoc)}{userLoc.accuracy ? ` · ±${userLoc.accuracy} m` : ""}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-1">Radius:</span>
              {RADII.map((r) => (
                <button key={r} onClick={() => setRadius(r)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${radius === r ? "bg-[#10B981] border-[#10B981] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>{r === "All" ? "All" : `${r} km`}</button>
              ))}
              <button onClick={enableLocation} className="inline-flex items-center gap-1 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-1.5 text-xs font-semibold text-[#6EE7B7] hover:bg-[#10B981]/20 transition-colors"><RefreshCw size={12} /> Refresh</button>
              <button onClick={disableLocation} className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"><X size={12} /> Off</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Game Form ───────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-10 rounded-2xl border border-[#10B981]/40 bg-slate-900/80 backdrop-blur-md p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="sm:col-span-2"><span className="text-xs font-semibold text-slate-400">Match Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Friday Night 5v5 Football" className={inputCls} /></label>
          <label><span className="text-xs font-semibold text-slate-400">Sport</span><select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className={`${inputCls} cursor-pointer`}>{SPORT_OPTIONS.map((s) => <option key={s.name}>{s.name}</option>)}</select></label>
          <label><span className="text-xs font-semibold text-slate-400">Players Needed</span><input type="number" min="2" max="30" value={form.needed} onChange={(e) => setForm({ ...form, needed: e.target.value })} className={inputCls} /></label>
          <label className="sm:col-span-2"><span className="text-xs font-semibold text-slate-400">Venue</span><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g., Urban Turf Arena" className={inputCls} /></label>
          <label><span className="text-xs font-semibold text-slate-400">City</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g., Ahmedabad" className={inputCls} /></label>
          <label><span className="text-xs font-semibold text-slate-400">Date</span><input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Today" className={inputCls} /></label>
          <label><span className="text-xs font-semibold text-slate-400">Time</span><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="7:00 PM" className={inputCls} /></label>
          <label><span className="text-xs font-semibold text-slate-400">Fee (₹)</span><input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="Free" className={inputCls} /></label>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end"><button type="submit" disabled={!form.title.trim() || !form.venue.trim()} className="rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 px-8 py-3 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20">🚀 Publish Game</button></div>
        </form>
      )}

      {/* ── Smart discovery toolbar ─────────────────── */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-[#10B981]/60">
            <Search size={16} className="text-slate-500" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by game, venue, city or sport..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white"><X size={15} /></button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setOpenOnly((v) => !v)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${openOnly ? "border-[#10B981] bg-[#10B981]/15 text-[#6EE7B7]" : "border-slate-700 bg-slate-950/60 text-slate-400 hover:text-white"}`}><SlidersHorizontal size={14} /> Open slots only</button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-xs font-bold text-slate-300 outline-none focus:border-[#10B981]">
              <option value="recommended">Recommended</option><option value="soonest">Soonest</option><option value="spots">Most slots</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> {list.length} games match your filters</div>
      </div>

      {/* ── Sport filter pills ─────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["All", ...SPORT_OPTIONS.map((s) => s.name)].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${filter === s ? "bg-[#10B981] border-[#10B981] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>
            {s === "All" ? "All Sports" : `${emojiOf(s)} ${s}`}
          </button>
        ))}
      </div>

      {/* ── EMPTY STATE + SEED ─────────────────────── */}
      {games.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
          <DatabaseZap size={32} className="text-[#FBBF24]" />
          <p className="text-sm text-slate-300 font-semibold">No games in the database!</p>
          <button onClick={seedDatabase} disabled={seeding} className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 px-6 py-3 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20">
            {seeding ? <><Loader2 size={16} className="animate-spin" /> Seeding...</> : <>🚀 Seed Demo Games</>}
          </button>
        </div>
      )}

      {/* ── Games grid ─────────────────────────────── */}
      {list.length === 0 && games.length > 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
          <Trophy size={24} className="text-[#10B981]" />
          <p className="text-sm text-slate-400">No games match your filters or radius.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((g) => {
          const status = statusOf(g);
          const joinedCount = g.joinedBy?.length || 0;
          const joined = user ? g.joinedBy?.includes(user.uid) : false;
          const full = status === "Full" && !joined;
          const pct = Math.min(100, Math.round((joinedCount / g.needed) * 100));
          
          return (
            <article key={g.id} className="group rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => navigate(`/games/${encodeURIComponent(g.id)}`)} className="flex items-center gap-3 text-left group/title">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 text-xl group-hover/title:border-[#10B981]/40 transition-colors">{emojiOf(g.sport)}</span>
                  <div>
                    <h3 className="font-bold text-white leading-tight group-hover/title:text-[#6EE7B7] transition-colors">{g.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{g.sport}</p>
                  </div>
                </button>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status === "Open" ? "bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]" : status === "Starting Soon" ? "bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24]" : "bg-slate-800 border border-slate-600 text-slate-400"}`}>
                  {status}
                </span>
              </div>

              {g.createdBy === user?.uid && (
                <span className="inline-flex rounded-full bg-[#FBBF24] px-2.5 py-1 text-[10px] font-black text-slate-950">🎯 Your Game</span>
              )}

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="flex items-center gap-1.5 flex-wrap">
                  <MapPin size={12} className="text-[#10B981]" /> {g.venue} · {g.city}
                  {locReady && g.distance !== undefined && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                      <Navigation size={10} /> {formatDist(g.distance)}
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-1.5"><CalendarDays size={12} className="text-[#FBBF24]" /> {g.date} <Clock size={12} className="text-[#FBBF24] ml-2" /> {g.time}</p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400"><Users size={12} /> {joinedCount}/{g.needed} players</span>
                  <span className={`font-semibold ${g.needed - joinedCount > 0 ? "text-[#10B981]" : "text-slate-500"}`}>
                    {g.needed - joinedCount > 0 ? `${g.needed - joinedCount} slots left` : "Team full"}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                  <div className={`h-full rounded-full ${status === "Full" ? "bg-slate-500" : "bg-[#10B981]"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                <p className="text-sm font-bold text-[#FBBF24]">{g.fee}{g.fee !== "Free" && <span className="text-[10px] text-slate-500 font-medium"> /player</span>}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/games/${encodeURIComponent(g.id)}`)} className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-[#10B981]/40">View Game</button>
                  <button onClick={() => toggleJoin(g)} disabled={full} className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95 ${joined ? "bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981]" : full ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-lg shadow-[#10B981]/20"}`}>
                  {joined ? (<><Check size={13} /> Joined — Leave</>) : status === "Full" ? "Full" : "Join Game"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}