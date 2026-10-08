import { useState } from "react";
import { getLiveLocation } from "../utils/location";
import {
  Users, Heart, MessageCircle, MapPin, Star, Send, UserPlus, Check, Trophy,
  Loader2, LocateFixed, Navigation, X, RefreshCw,
} from "lucide-react";

const SPORT_TAGS = ["Football", "Cricket", "Badminton", "Tennis", "Basketball"];

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

const INITIAL_POSTS = [
  { id: 1, author: "Rohan Sharma", color: "bg-[#10B981]", sport: "Football", city: "Ahmedabad", time: "2h ago", text: "Just won our 5v5 final at Urban Turf Arena 5-3! What a match 🔥 Looking for a new keeper for next week.", likes: 24, comments: 6 },
  { id: 2, author: "Priya Patel", color: "bg-blue-500", sport: "Badminton", city: "Ghaziabad", time: "5h ago", text: "Morning doubles session done ✅ Anyone up for a mixed doubles tournament this weekend?", likes: 18, comments: 4 },
  { id: 3, author: "Arjun Mehta", color: "bg-[#F59E0B]", sport: "Cricket", city: "Jaipur", time: "1d ago", text: "New SG bat from the PlayConnect Shop — clean sweet spot! Full review coming soon 🏏", likes: 42, comments: 11 },
  { id: 4, author: "Sneha Iyer", color: "bg-purple-500", sport: "Tennis", city: "Pune", time: "2d ago", text: "Sunrise rally at Rally Masters Club. The tennis family is growing 💪", likes: 31, comments: 3 },
];

const PLAYERS = [
  { name: "Rohan Sharma", sport: "Football", city: "Ahmedabad", rating: 4.8, role: "Striker", color: "bg-[#10B981]", lat: 23.0225, lng: 72.5714 },
  { name: "Priya Patel", sport: "Badminton", city: "Ghaziabad", rating: 4.7, role: "Doubles Pro", color: "bg-blue-500", lat: 28.6692, lng: 77.4538 },
  { name: "Arjun Mehta", sport: "Cricket", city: "Jaipur", rating: 4.9, role: "All-rounder", color: "bg-[#F59E0B]", lat: 26.9124, lng: 75.7873 },
  { name: "Sneha Iyer", sport: "Tennis", city: "Pune", rating: 4.6, role: "Baseliner", color: "bg-purple-500", lat: 18.5204, lng: 73.8567 },
  { name: "Vikram Singh", sport: "Basketball", city: "Delhi", rating: 4.5, role: "Point Guard", color: "bg-pink-500", lat: 28.6139, lng: 77.209 },
];

const CLUBS = [
  { name: "Ahmedabad Football League", sport: "Football", emoji: "⚽", members: 320, lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur Cricket Academy", sport: "Cricket", emoji: "🏏", members: 210, lat: 26.9124, lng: 75.7873 },
  { name: "Delhi Hoopers", sport: "Basketball", emoji: "🏀", members: 180, lat: 28.6139, lng: 77.209 },
  { name: "Pune Tennis Circle", sport: "Tennis", emoji: "🎾", members: 145, lat: 18.5204, lng: 73.8567 },
];

const RADII = [50, 100, 250, 500, "All"];

/* ── Haversine distance in km ─────────────────────────────────── */
const distanceKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const formatDist = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function Community() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [likedIds, setLikedIds] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [draft, setDraft] = useState("");
  const [draftSport, setDraftSport] = useState("Football");

  /* ── Location state ─────────────────────────────── */
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [radius, setRadius] = useState(250);

  const [locationError, setLocationError] = useState("");
  const enableLocation = async () => {
    setLocStatus("loading");
    setLocationError("");
    try {
      const location = await getLiveLocation();
      setUserLoc(location);
      setLocStatus("ready");
    } catch (err) {
      setLocationError(err.message || "Couldn't access your location.");
      setLocStatus("error");
    }
  };

  const disableLocation = () => { setUserLoc(null); setLocStatus("idle"); setLocationError(""); };

  const pickCity = (cityName) => {
    const c = CITIES.find((x) => x.name === cityName);
    if (c) { setUserLoc({ lat: c.lat, lng: c.lng }); setLocStatus("ready"); }
  };

  const locReady = locStatus === "ready" && userLoc;

  /* ── Distance-aware lists ───────────────────────── */
  const withDistance = (list) =>
    list.map((item) => ({ ...item, distance: distanceKm(userLoc, item) }));

  let playerList = PLAYERS;
  let clubList = CLUBS;
  if (locReady) {
    playerList = withDistance(PLAYERS)
      .filter((p) => radius === "All" || p.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    clubList = withDistance(CLUBS)
      .filter((c) => radius === "All" || c.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /* ── Interactions ───────────────────────────────── */
  const handlePost = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosts((prev) => [
      { id: Date.now(), author: "You", color: "bg-[#10B981]", sport: draftSport, city: "Your City", time: "Just now", text: draft.trim(), likes: 0, comments: 0 },
      ...prev,
    ]);
    setDraft("");
  };

  const toggleLike = (id) => {
    const liked = likedIds.includes(id);
    setLikedIds((prev) => (liked ? prev.filter((x) => x !== id) : [...prev, id]));
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: liked ? p.likes - 1 : p.likes + 1 } : p)));
  };

  const toggleFollow = (name) =>
    setFollowed((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));

  const toggleClub = (name) =>
    setJoinedClubs((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));

  const DistChip = ({ km }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
      <Navigation size={10} /> {formatDist(km)}
    </span>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* ── Header ─────────────────────────────────── */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          🤝 Community <span className="text-[#10B981]">Feed</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          {locReady
            ? "Showing players & clubs near you, sorted by distance."
            : "Connect with players, join clubs, and share your game moments."}
        </p>
      </div>

      {/* ── Stats strip ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Players", value: "2,400+", icon: Users, color: "text-[#10B981]" },
          { label: "Clubs", value: "85", icon: Trophy, color: "text-[#FBBF24]" },
          { label: "Posts This Week", value: "312", icon: MessageCircle, color: "text-blue-400" },
          { label: "Cities", value: "14", icon: MapPin, color: "text-pink-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <s.icon size={14} className={s.color} /> {s.label}
            </p>
            <p className="mt-2 text-2xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── LOCATION BAR ───────────────────────────── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
        {locStatus === "idle" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Navigation size={15} className="text-[#10B981]" /> Find players & clubs near you
              </h2>
              <p className="text-xs text-slate-400 mt-1">Enable location to see distances & sort by nearest.</p>
            </div>
            <button
              onClick={enableLocation}
              className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20"
            >
              <LocateFixed size={16} /> Use My Location
            </button>
          </div>
        )}

        {locStatus === "loading" && (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Loader2 size={18} className="animate-spin text-[#10B981]" /> Detecting your location…
          </div>
        )}

        {locStatus === "error" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><p className="text-sm text-[#FBBF24]">⚠️ {locationError || "Couldn't access your location. Pick your city instead:"}</p><p className="mt-1 text-[10px] text-slate-500">After changing Chrome permission, press Try Again.</p></div><div className="flex flex-wrap gap-2"><button onClick={enableLocation} className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-2.5 text-xs font-bold text-[#6EE7B7]"><RefreshCw size={13} /> Try Again</button>
            <select
              onChange={(e) => pickCity(e.target.value)}
              defaultValue=""
              className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981] cursor-pointer"
            >
              <option value="" disabled>Choose city…</option>
              {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {locReady && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#10B981] flex items-center gap-2">
              <MapPin size={15} /> Nearby ON — players & clubs sorted by distance
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-1">Radius:</span>
              {RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                    radius === r
                      ? "bg-[#10B981] border-[#10B981] text-slate-950"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"
                  }`}
                >
                  {r === "All" ? "All" : `${r} km`}
                </button>
              ))}
              <button
                onClick={disableLocation}
                className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
              >
                <X size={12} /> Off
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ═══════════ FEED (left 2/3) ═══════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Composer */}
          <form onSubmit={handlePost} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 space-y-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Share a game moment, find teammates, or announce a match…"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981] resize-none"
            />
            <div className="flex items-center justify-between gap-4">
              <select
                value={draftSport}
                onChange={(e) => setDraftSport(e.target.value)}
                className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#10B981] cursor-pointer"
              >
                {SPORT_TAGS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95"
              >
                <Send size={15} /> Post
              </button>
            </div>
          </form>

          {/* Posts */}
          {posts.map((p) => {
            const liked = likedIds.includes(p.id);
            return (
              <article key={p.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`grid place-items-center w-11 h-11 rounded-full ${p.color} text-sm font-black text-slate-950`}>
                    {initials(p.author)}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm">{p.author}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <MapPin size={11} /> {p.city} · {p.time}
                      <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                        {p.sport}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">{p.text}</p>

                <div className="flex items-center gap-5 border-t border-slate-700/50 pt-3">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      liked ? "text-red-400" : "text-slate-400 hover:text-red-400"
                    }`}
                  >
                    <Heart size={15} fill={liked ? "currentColor" : "none"} /> {p.likes}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <MessageCircle size={15} /> {p.comments}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* ═══════════ PLAYERS (right 1/3) ═══════════ */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            ⭐ Players to Follow {locReady && <span className="text-xs text-[#10B981] font-semibold">· nearest first</span>}
          </h2>
          {playerList.length === 0 ? (
            <p className="text-sm text-slate-400 rounded-2xl border border-dashed border-slate-700 p-6 text-center">
              No players within {radius} km. Increase the radius.
            </p>
          ) : (
            <div className="space-y-4">
              {playerList.map((pl) => {
                const following = followed.includes(pl.name);
                return (
                  <article key={pl.name} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-4 flex items-center gap-3">
                    <span className={`grid place-items-center w-11 h-11 rounded-full ${pl.color} text-sm font-black text-slate-950 shrink-0`}>
                      {initials(pl.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{pl.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{pl.role} · {pl.sport}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 flex-wrap">
                        <Star size={10} className="text-[#FBBF24]" fill="currentColor" /> {pl.rating} · {pl.city}
                        {locReady && pl.distance !== undefined && <DistChip km={pl.distance} />}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFollow(pl.name)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold transition-all active:scale-95 shrink-0 ${
                        following
                          ? "bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981]"
                          : "bg-[#10B981] hover:bg-[#059669] text-slate-950"
                      }`}
                    >
                      {following ? (<><Check size={12} /> Following</>) : (<><UserPlus size={12} /> Follow</>)}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ CLUBS ═══════════ */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
          🏆 Popular Clubs {locReady && <span className="text-sm text-[#10B981] font-semibold">· near you</span>}
        </h2>
        {clubList.length === 0 ? (
          <p className="text-sm text-slate-400 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
            No clubs within {radius === "All" ? "any distance" : `${radius} km`}. Increase the radius or start your own club!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {clubList.map((c) => {
              const joined = joinedClubs.includes(c.name);
              return (
                <article key={c.name} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 space-y-3 hover:-translate-y-1 hover:border-slate-600 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <span className="grid place-items-center w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 text-2xl">
                      {c.emoji}
                    </span>
                    {locReady && c.distance !== undefined && <DistChip km={c.distance} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Users size={11} /> {c.members + (joined ? 1 : 0)} members
                    </p>
                  </div>
                  <button
                    onClick={() => toggleClub(c.name)}
                    className={`w-full rounded-full py-2 text-xs font-bold transition-all active:scale-95 ${
                      joined
                        ? "bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981]"
                        : "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white"
                    }`}
                  >
                    {joined ? "✓ Joined" : "Join Club"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}