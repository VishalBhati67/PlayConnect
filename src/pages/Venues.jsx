import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, onSnapshot, addDoc, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { MapPin, Star, Search, Loader2, LocateFixed, Navigation, X, DatabaseZap } from "lucide-react";

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;
const FALLBACK_IMG = IMG("photo-1575361204480-aadea25e6e68");
const onImgError = (e) => { if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG; };
/* supports old docs (imgId) and new docs (full img url) */
const imgUrl = (v) => v.img || IMG(v.imgId);

const CITIES = [
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Ghaziabad", lat: 28.6692, lng: 77.4538 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
];

/* ── 18 VENUES · 11 SPORTS · unique image each ───────────────── */
const SEED_VENUES = [
  { name: "The South PickleBall Arena", address: "Sitapura, Jaipur", sports: ["Pickleball"], price: 550, rating: 4.9, reviews: 28, badge: "Featured", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e71720.png", lat: 26.852, lng: 75.803 },
  { name: "PaddleX | The Pickleball Club", address: "Mansarovar, Jaipur", sports: ["Pickleball"], price: 800, rating: 4.3, reviews: 26, badge: "Featured", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e77519.png", lat: 26.8656, lng: 75.8064 },
  { name: "VT Badminton Academy", address: "Ghaziabad, UP", sports: ["Badminton"], price: 300, rating: 4.7, reviews: 16, badge: "Featured", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e77968.png", lat: 28.6692, lng: 77.4538 },
  { name: "TURBO TURF", address: "Pink Square Mall, Jaipur", sports: ["Cricket", "Football"], price: 1100, rating: 4.2, reviews: 41, badge: "New", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e76385.png", lat: 26.9124, lng: 75.7873 },
  { name: "Rally Masters Tennis Club", address: "Boat Club Road, Pune", sports: ["Tennis"], price: 1100, rating: 4.8, reviews: 176, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e74882.png", lat: 18.5308, lng: 73.8475 },
  { name: "Urban Turf Arena", address: "Vastrapur, Ahmedabad", sports: ["Football", "Cricket"], price: 900, rating: 4.4, reviews: 334, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e75167.png", lat: 23.0225, lng: 72.5714 },
  { name: "Marine Drive Basketball Court", address: "Marine Drive, Mumbai", sports: ["Basketball"], price: 700, rating: 4.6, reviews: 98, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/76d3930e4-f1fd-4535-ae9d-3790a53d96e75581.png", lat: 18.9426, lng: 72.8235 },
  { name: "Andheri Sports Turf", address: "Andheri East, Mumbai", sports: ["Football", "Cricket"], price: 1200, rating: 4.5, reviews: 210, badge: "Featured", img: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=900&q=60", lat: 19.1197, lng: 72.8464 },
  { name: "Powai Pickleball Hub", address: "Powai, Mumbai", sports: ["Pickleball"], price: 650, rating: 4.7, reviews: 64, badge: "New", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=60", lat: 19.1176, lng: 72.906 },
  /*  BOXING */
  { name: "Knockout Boxing Academy", address: "Andheri West, Mumbai", sports: ["Boxing"], price: 900, rating: 4.8, reviews: 122, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/16d3930e4-f1fd-4535-ae9d-3790a53d96e73156.png", lat: 19.1358, lng: 72.8265 },
  { name: "Capital Boxing Hub", address: "Karol Bagh, Delhi", sports: ["Boxing"], price: 750, rating: 4.5, reviews: 87, badge: "Featured", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e771766.png", lat: 28.652, lng: 77.19 },
  { name: "Champion Boxing & Fitness", address: "Indirapuram, Ghaziabad", sports: ["Boxing"], price: 600, rating: 4.3, reviews: 54, badge: "New", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=60", lat: 28.644, lng: 77.371 },
  /* 🏊 SWIMMING */
  { name: "AquaFit Swimming Complex", address: "Shivaji Nagar, Pune", sports: ["Swimming"], price: 400, rating: 4.6, reviews: 143, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e73739.png", lat: 18.5362, lng: 73.8478 },
  { name: "Wave Riders Olympic Pool", address: "Bandra West, Mumbai", sports: ["Swimming"], price: 500, rating: 4.7, reviews: 96, badge: "Featured", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e77334.png", lat: 19.0596, lng: 72.8295 },
  /* 🏐 VOLLEYBALL */
  { name: "Smash Vault Volleyball Arena", address: "Saket, New Delhi", sports: ["Volleyball"], price: 600, rating: 4.4, reviews: 71, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e76807.png", lat: 28.5245, lng: 77.2135 },
  /*  TABLE TENNIS */
  { name: "Spin City Table Tennis Club", address: "Vastrapur, Ahmedabad", sports: ["Table Tennis"], price: 350, rating: 4.6, reviews: 88, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e74645.png", lat: 23.0265, lng: 72.5265 },
  /* 🏑 HOCKEY */
  { name: "Turfside Hockey Ground", address: "Sanganer, Jaipur", sports: ["Hockey"], price: 800, rating: 4.5, reviews: 39, badge: "New", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e75241.png", lat: 26.815, lng: 75.79 },
  /* 🏏 CRICKET NETS */
  { name: "GreenPark Cricket Nets", address: "Hauz Khas, New Delhi", sports: ["Cricket"], price: 500, rating: 4.4, reviews: 167, badge: "Verified", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e79596.png", lat: 28.5494, lng: 77.2001 },
];

const FILTERS = ["All", "Football", "Cricket", "Badminton", "Tennis", "Pickleball", "Basketball", "Boxing", "Swimming", "Volleyball", "Table Tennis", "Hockey"];
const RADII = [10, 25, 50, 100, "All"];

const BADGE_STYLES = {
  Featured: "bg-[#FBBF24] text-slate-950",
  Verified: "bg-[#10B981] text-slate-950",
  New: "bg-blue-500 text-white",
};

const distanceKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const formatDist = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export default function Venues() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [vform, setVform] = useState({ name: "", address: "", city: "Jaipur", sports: "", price: "" });

  const initialSport = params.get("sport");
  const [filter, setFilter] = useState(initialSport && FILTERS.includes(initialSport) ? initialSport : "All");
  const [searchQuery, setSearchQuery] = useState("");

  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [radius, setRadius] = useState(25);

  useEffect(() => {
    const q = query(collection(db, "venues"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVenues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error("Firestore error:", err); setLoading(false); });
    return () => unsub();
  }, []);

  const seedDatabase = async () => {
    setSeeding(true);
    try { for (const v of SEED_VENUES) await addDoc(collection(db, "venues"), v); }
    catch (err) { console.error("Seed failed:", err); }
    finally { setSeeding(false); }
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    const c = CITIES.find((x) => x.name === vform.city) || CITIES[1];
    try {
      await addDoc(collection(db, "venues"), {
        name: vform.name,
        address: vform.address,
        city: vform.city,
        sports: vform.sports.split(",").map((s) => s.trim()).filter(Boolean),
        price: Number(vform.price),
        rating: null,
        reviews: 0,
        badge: "New",
        img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/7ba46c23-1a46-405f-9758-03c7b91340ca",
        lat: c.lat,
        lng: c.lng,
        status: "Pending",
        ownerId: user?.uid || "",
        ownerName: user?.name || "Venue Owner",
        createdAt: serverTimestamp(),
      });
      setVform({ name: "", address: "", city: "Jaipur", sports: "", price: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Venue submit error:", err);
    }
  };

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

  let list = venues.filter(
    (v) => v.status !== "Pending" && v.status !== "Rejected" &&
    (filter === "All" || v.sports?.includes(filter)) &&
    v.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (locReady) {
    list = list.map((v) => ({ ...v, distance: distanceKm(userLoc, v) }));
    if (radius !== "All") list = list.filter((v) => v.distance <= radius);
    list = [...list].sort((a, b) => a.distance - b.distance);
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#10B981]" /></div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">📍 Trending Venues {locReady && <span className="text-[#10B981] text-xl font-bold">· Near You</span>}</h1>
          <p className="text-slate-400 text-sm mt-1">{locReady ? "Sorted by distance from your location." : "Discover & book turfs, courts, pools and arenas near you."}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2.5 w-full md:w-72 focus-within:border-[#10B981]/60">
            <Search size={16} className="text-slate-500 shrink-0" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search venues..." className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none" />
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full border border-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 px-4 py-2.5 text-sm font-bold text-[#10B981] transition-all active:scale-95 whitespace-nowrap">
            📍 List Your Venue
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleVenueSubmit} className="mb-8 rounded-2xl border border-[#FBBF24]/40 bg-slate-900/80 p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input required value={vform.name} onChange={(e) => setVform({ ...vform, name: e.target.value })} placeholder="Venue Name" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FBBF24]" />
          <input required value={vform.address} onChange={(e) => setVform({ ...vform, address: e.target.value })} placeholder="Address" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FBBF24]" />
          <select value={vform.city} onChange={(e) => setVform({ ...vform, city: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FBBF24] cursor-pointer">
            {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
          <input required value={vform.sports} onChange={(e) => setVform({ ...vform, sports: e.target.value })} placeholder="Sports (comma separated)" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FBBF24]" />
          <input required type="number" value={vform.price} onChange={(e) => setVform({ ...vform, price: e.target.value })} placeholder="Price per hour" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FBBF24]" />
          <button type="submit" className="sm:col-span-2 lg:col-span-5 rounded-full bg-[#FBBF24] hover:bg-[#F59E0B] px-6 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95">
            📝 Submit for Approval
          </button>
        </form>
      )}

      {/* LOCATION BAR */}
      <div className="mb-8 rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
        {locStatus === "idle" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Navigation size={15} className="text-[#10B981]" /> Find venues near you</h2>
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
            <p className="text-sm font-semibold text-[#10B981] flex items-center gap-2"><MapPin size={15} /> Nearby ON — venues sorted by distance</p>
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

      {/* FILTER PILLS */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${filter === f ? "bg-[#10B981] border-[#10B981] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>
            {f === "All" ? "All Sports" : f}
          </button>
        ))}
      </div>

      {/* EMPTY + SEED */}
      {venues.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
          <DatabaseZap size={32} className="text-[#FBBF24]" />
          <p className="text-sm text-slate-300 font-semibold">Your Firestore database is empty!</p>
          <p className="text-xs text-slate-400 max-w-sm">Click below to load 18 venues across 11 sports — boxing, swimming, hockey & more.</p>
          <button onClick={seedDatabase} disabled={seeding} className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 px-6 py-3 text-sm font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20">
            {seeding ? <><Loader2 size={16} className="animate-spin" /> Seeding...</> : <>🚀 Seed Demo Venues</>}
          </button>
        </div>
      )}

      {/* NO RESULTS */}
      {venues.length > 0 && list.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
          <MapPin size={28} className="text-slate-600" />
          <p className="text-sm text-slate-400">{locReady ? `No ${filter !== "All" ? filter : ""} venues within ${radius === "All" ? "any distance" : `${radius} km`}.` : "No venues match your search."}</p>
        </div>
      )}

      {/* GRID */}
      {list.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((v) => (
            <article key={v.id} onClick={() => navigate(`/venues/${v.id}`)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md shadow-xl hover:-translate-y-1 hover:border-slate-600 transition-all duration-300">
              <div className="relative h-44 bg-slate-100">
                <img src={imgUrl(v)} alt={v.name} loading="lazy" onError={onImgError} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${BADGE_STYLES[v.badge]}`}>{v.badge}</span>
                {v.rating && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white">
                    <Star size={11} className="text-[#FBBF24]" fill="currentColor" /> {v.rating} ({v.reviews})
                  </span>
                )}
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-white">{v.name}</h3>
                <p className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                  <MapPin size={12} className="text-[#10B981] shrink-0" /> {v.address}
                  {locReady && v.distance !== undefined && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 text-[10px] font-bold text-[#10B981]"><Navigation size={10} /> {formatDist(v.distance)}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {v.sports?.map((s) => (
                    <span key={s} className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-[#10B981] font-bold">₹{v.price}<span className="text-xs text-slate-500 font-medium">/hr</span></p>
                  <button className="rounded-full bg-[#10B981] hover:bg-[#059669] px-5 py-2 text-xs font-bold text-slate-950 transition-colors active:scale-95">Book Now</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}