import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion, arrayRemove, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { Users, MapPin, CalendarDays, Clock, Plus, X, Check, Trophy, Loader2, LocateFixed, Navigation, DatabaseZap } from "lucide-react";

const SPORT_OPTIONS = [
  { name: "Football", emoji: "⚽" },
  { name: "Cricket", emoji: "🏏" },
  { name: "Badminton", emoji: "🏸" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Tennis", emoji: "🎾" },
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
  { title: "5v5 Football Match", sport: "Football", venue: "Urban Turf Arena", city: "Vastrapur, Ahmedabad", date: "Today", time: "7:00 PM", joinedBy: [], needed: 10, fee: "₹100", createdBy: "system", lat: 23.0225, lng: 72.5714 },
  { title: "Cricket Nets Practice", sport: "Cricket", venue: "TURBO TURF", city: "Pink Square, Jaipur", date: "Tomorrow", time: "6:30 AM", joinedBy: [], needed: 6, fee: "Free", createdBy: "system", lat: 26.9124, lng: 75.7873 },
  { title: "Badminton Doubles Night", sport: "Badminton", venue: "VT Badminton Academy", city: "Ghaziabad", date: "Today", time: "8:00 PM", joinedBy: [], needed: 4, fee: "₹150", createdBy: "system", lat: 28.6692, lng: 77.4538 },
  { title: "Basketball 3v3 Street Cup", sport: "Basketball", venue: "Hoop City", city: "Chennai", date: "Sat, 05 Sep", time: "5:00 PM", joinedBy: [], needed: 6, fee: "₹80", createdBy: "system", lat: 13.0827, lng: 80.2707 },
  { title: "Tennis Singles Rally", sport: "Tennis", venue: "Rally Masters Club", city: "Boat Club Road, Pune", date: "Sun, 06 Sep", time: "7:00 AM", joinedBy: [], needed: 2, fee: "₹200", createdBy: "system", lat: 18.5204, lng: 73.8567 },
  { title: "Weekend Football Friendly", sport: "Football", venue: "The South PickleBall Arena", city: "Sitapura, Jaipur", date: "Sun, 06 Sep", time: "6:00 PM", joinedBy: [], needed: 14, fee: "₹120", createdBy: "system", lat: 26.852, lng: 75.803 },
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

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  /* ── Location state ─────────────────────────────── */
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [radius, setRadius] = useState(25);

  const [form, setForm] = useState({ title: "", sport: "Football", venue: "", city: "", date: "Today", time: "6:00 PM", needed: 10, fee: "" });

  /* ── 1. LIVE FIRESTORE LISTENER ─────────────────── */
  useEffect(() => {
    const q = query(collection(db, "games"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGames(data);
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
  const enableLocation = () => {
    if (!navigator.geolocation) { setLocStatus("error"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus("ready"); },
      () => setLocStatus("error"), { timeout: 8000 }
    );
  };
  const disableLocation = () => { setUserLoc(null); setLocStatus("idle"); };
  const pickCity = (cityName) => {
    const c = CITIES.find((x) => x.name === cityName);
    if (c) { setUserLoc({ lat: c.lat, lng: c.lng }); setLocStatus("ready"); }
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
  let list = games.filter((g) => filter === "All" || g.sport === filter);
  if (locReady) {
    list = list.map((g) => ({ ...g, distance: distanceKm(userLoc, g) }));
    if (radius !== "All") list = list.filter((g) => g.distance <= radius);
    list = [...list].sort((a, b) => a.distance - b.distance);
  }
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
              <p className="text-xs text-slate-400 mt-1">Enable location to see distances & sort by nearest.</p>
            </div>
            <button onClick={enableLocation} className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20"><LocateFixed size={16} /> Use My Location</button>
          </div>
        )}
        {locStatus === "loading" && <div className="flex items-center gap-3 text-sm text-slate-300"><Loader2 size={18} className="animate-spin text-[#10B981]" /> Detecting your location…</div>}
        {locStatus === "error" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-[#FBBF24]">⚠️ Couldn't access your location. Pick your city instead:</p>
            <select onChange={(e) => pickCity(e.target.value)} defaultValue="" className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981] cursor-pointer">
              <option value="" disabled>Choose city…</option>
              {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        {locReady && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#10B981] flex items-center gap-2"><MapPin size={15} /> Nearby ON — games sorted by distance</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-1">Radius:</span>
              {RADII.map((r) => (
                <button key={r} onClick={() => setRadius(r)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${radius === r ? "bg-[#10B981] border-[#10B981] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>{r === "All" ? "All" : `${r} km`}</button>
              ))}
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
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 text-xl">{emojiOf(g.sport)}</span>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{g.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{g.sport}</p>
                  </div>
                </div>
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
                <button onClick={() => toggleJoin(g)} disabled={full} className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95 ${joined ? "bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981]" : full ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-lg shadow-[#10B981]/20"}`}>
                  {joined ? (<><Check size={13} /> Joined — Leave</>) : status === "Full" ? "Full" : "Join Game"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}