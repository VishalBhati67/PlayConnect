import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, query } from "firebase/firestore";
import { db } from "../firebase";
import { MapPin, CalendarDays, Users, Loader2, DatabaseZap, Trophy } from "lucide-react";

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;

/* ✅ Guaranteed fallback if any image ever fails */
const FALLBACK_IMG = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80";
const SPORT_FALLBACKS = {
  Cricket: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80",
  Football: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
  Basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
  Badminton: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80",
  Tennis: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
  Volleyball: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80",
  Boxing: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=80",
  Swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80",
  Marathon: "https://images.unsplash.com/photo-1552674605-db764573271e?auto=format&fit=crop&w=900&q=80",
  Hockey: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80",
  "Table Tennis": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
  Baseball: "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=900&q=80",
};
const getEventImage = (event) => {
  if (event.img && !event.img.includes("image.qwenlm.ai")) return event.img;
  return SPORT_FALLBACKS[event.types?.[0]] || FALLBACK_IMG;
};
const onImgError = (e) => {
  if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
};

/* ── 25+ EVENTS · fresh Oct–Dec 2026 dates · stable working images ── */
const SEED_EVENTS = [
  { title: "Bandra Table Tennis Grand Prix", types: ["Table Tennis"], city: "Mumbai", district: "Bandra West", venue: "Spin City Arena", date: "2026-10-17", price: 350, capacity: 64, registered: 38, prizePool: 25000, description: "Singles & doubles brackets with skill-based draws. Tables and balls provided.", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80" },
  { title: "Mumbai Football 7s Night Cup", types: ["Football"], city: "Mumbai", district: "Andheri", venue: "Andheri Sports Turf", date: "2026-10-18", price: 800, capacity: 16, registered: 11, prizePool: 60000, description: "Floodlit 7-a-side knockout cup with referees, live scoring and medals.", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80" },
  { title: "MLBx Mumbai 3-on-3 Baseball Showcase", types: ["Baseball"], city: "Mumbai", district: "Andheri", venue: "Mumbai Football Arena", date: "2026-10-24", price: 500, capacity: 120, registered: 76, prizePool: 75000, description: "Fast-paced 3-on-3 baseball showcase with fan activities and live entertainment.", img: "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=900&q=80" },
  { title: "Powai 3x3 Basketball League", types: ["Basketball"], city: "Mumbai", district: "Powai", venue: "Hoop City Arena", date: "2026-10-31", price: 700, capacity: 12, registered: 7, prizePool: 50000, description: "3v3 street basketball league with round-robin games and knockout finals.", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80" },
  { title: "Navi Mumbai Badminton Open", types: ["Badminton"], city: "Mumbai", district: "Nerul", venue: "Nerul Sports Academy", date: "2026-11-08", price: 400, capacity: 64, registered: 45, prizePool: 30000, description: "Singles and doubles open with separate amateur and advanced brackets.", img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80" },
  { title: "Delhi Midnight 10K Run", types: ["Marathon", "Athletics"], city: "Delhi", district: "Central Delhi", venue: "India Gate", date: "2026-11-14", price: 500, capacity: 500, registered: 328, prizePool: 100000, description: "Night 10K through Delhi landmarks with chip timing, hydration and finisher medals.", img: "https://images.unsplash.com/photo-1552674605-db764573271e?auto=format&fit=crop&w=900&q=80" },
  { title: "Ahmedabad Volleyball Smash Cup", types: ["Volleyball"], city: "Ahmedabad", district: "Vastrapur", venue: "Smash Vault Arena", date: "2026-11-22", price: 800, capacity: 12, registered: 7, prizePool: 40000, description: "6-a-side knockout tournament with floodlit finals and team awards.", img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80" },
  { title: "Delhi Boxing Night Championship", types: ["Boxing"], city: "Delhi", district: "Karol Bagh", venue: "Capital Boxing Hub", date: "2026-11-28", price: 600, capacity: 32, registered: 21, prizePool: 55000, description: "Amateur bouts across multiple weight categories with certified officials.", img: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=80" },
  { title: "Powai Aquathon Swim Meet", types: ["Swimming"], city: "Mumbai", district: "Powai", venue: "Wave Riders Olympic Pool", date: "2026-12-05", price: 450, capacity: 80, registered: 52, prizePool: 35000, description: "50m and 100m freestyle, breaststroke and relay races in an Olympic-size pool.", img: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80" },
  { title: "Pune Tennis Masters", types: ["Tennis"], city: "Pune", district: "Boat Club Road", venue: "Rally Masters Club", date: "2026-12-13", price: 600, capacity: 32, registered: 18, prizePool: 45000, description: "Round-robin groups followed by a knockout draw for singles and doubles.", img: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80" },
  { title: "Jaipur Hockey League", types: ["Hockey"], city: "Jaipur", district: "Sanganer", venue: "Turfside Hockey Ground", date: "2026-12-20", price: 900, capacity: 8, registered: 5, prizePool: 48000, description: "11-a-side league on astroturf with team awards and match officials.", img: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80" },
  { title: "Mumbai Cricket T20 Challenge", types: ["Cricket"], city: "Mumbai", district: "BKC", venue: "Sharad Pawar Cricket Academy", date: "2026-12-27", price: 1200, capacity: 16, registered: 9, prizePool: 75000, description: "Competitive T20 weekend with team entries, live scoring and a grand final.", img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80" },
  { title: "Ahmedabad Football Cup", types: ["Football"], city: "Ahmedabad", district: "Vastrapur", venue: "Urban Turf Arena", date: "2026-08-30", price: 1000, capacity: 12, registered: 12, prizePool: 60000, description: "7-a-side knockout cup. Completed — results published.", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80" },
  { title: "Mumbai Corporate Cricket Bash", types: ["Cricket"], city: "Mumbai", district: "Thane", venue: "Corporate Cricket Arena", date: "2026-10-25", price: 900, capacity: 16, registered: 10, prizePool: 50000, description: "Weekend T20 tournament for corporate and amateur teams.", img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=900&q=80" },
  { title: "Delhi 5-a-Side Football Fest", types: ["Football"], city: "Delhi", district: "Dwarka", venue: "Delhi Football Hub", date: "2026-10-26", price: 650, capacity: 20, registered: 13, prizePool: 45000, description: "Fast 5-a-side football format with group stages and knockout finals.", img: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=900&q=80" },
  { title: "Pune Badminton Smash Series", types: ["Badminton"], city: "Pune", district: "Kothrud", venue: "SmashPoint Academy", date: "2026-11-01", price: 350, capacity: 48, registered: 29, prizePool: 25000, description: "Competitive singles and doubles tournament for amateur players.", img: "https://images.unsplash.com/photo-1613918431703-aa50889e3be5?auto=format&fit=crop&w=900&q=80" },
  { title: "Chennai Coastal Volleyball Open", types: ["Volleyball"], city: "Chennai", district: "Besant Nagar", venue: "Coastal Sports Arena", date: "2026-11-07", price: 700, capacity: 16, registered: 9, prizePool: 35000, description: "Beach-style volleyball tournament with team prizes and weekend finals.", img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80" },
  { title: "Mumbai City Tennis Cup", types: ["Tennis"], city: "Mumbai", district: "Worli", venue: "City Tennis Club", date: "2026-11-15", price: 550, capacity: 32, registered: 20, prizePool: 40000, description: "Open singles and doubles tournament with knockout rounds.", img: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80" },
  { title: "Jaipur Cricket Night League", types: ["Cricket"], city: "Jaipur", district: "Malviya Nagar", venue: "Pink City Cricket Ground", date: "2026-11-21", price: 1000, capacity: 12, registered: 8, prizePool: 60000, description: "Floodlit T20 cricket league with live score updates and finals.", img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80" },
  { title: "Ahmedabad 10K City Run", types: ["Marathon"], city: "Ahmedabad", district: "Sabarmati", venue: "Sabarmati Riverfront", date: "2026-11-29", price: 450, capacity: 750, registered: 482, prizePool: 90000, description: "Timed 10K city run with hydration points, medals and electronic timing.", img: "https://images.unsplash.com/photo-1552674605-db764573271e?auto=format&fit=crop&w=900&q=80" },
  { title: "Chennai Swimming Sprint Meet", types: ["Swimming"], city: "Chennai", district: "Velachery", venue: "Aqua Sports Complex", date: "2026-12-06", price: 400, capacity: 100, registered: 64, prizePool: 30000, description: "Sprint races across freestyle, backstroke and relay categories.", img: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80" },
  { title: "Delhi Basketball 3x3 Clash", types: ["Basketball"], city: "Delhi", district: "Saket", venue: "Hoop District Arena", date: "2026-12-12", price: 650, capacity: 16, registered: 10, prizePool: 45000, description: "High-energy 3x3 basketball tournament with DJ, lights and knockout rounds.", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80" },
  { title: "Pune Table Tennis Masters", types: ["Table Tennis"], city: "Pune", district: "Baner", venue: "Spin Masters Club", date: "2026-12-19", price: 300, capacity: 64, registered: 41, prizePool: 22000, description: "Open table tennis championship with singles and doubles categories.", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80" },
  { title: "Mumbai Boxing Fight Night", types: ["Boxing"], city: "Mumbai", district: "Lower Parel", venue: "Fight Arena Mumbai", date: "2026-12-26", price: 700, capacity: 36, registered: 22, prizePool: 65000, description: "Amateur boxing showcase featuring multiple weight categories and finals.", img: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=80" },
  { title: "Pune Hockey 7s Challenge", types: ["Hockey"], city: "Pune", district: "Hinjewadi", venue: "Hockey Champions Turf", date: "2026-12-27", price: 750, capacity: 12, registered: 6, prizePool: 42000, description: "7-a-side hockey challenge with short-format matches and a championship final.", img: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80" },
];

const CITY_FILTERS = ["All Cities", "Delhi", "Mumbai", "Jaipur", "Ahmedabad", "Ghaziabad", "Pune", "Chennai"];
const TYPE_FILTERS = ["All Types", "Marathon", "Cricket", "Football", "Badminton", "Tennis", "Basketball", "Boxing", "Swimming", "Volleyball", "Hockey", "Table Tennis", "Baseball"];

const statusOf = (e) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(e.date + "T00:00:00");
  if (d < today) return "Event Over";
  if (d.toDateString() === today.toDateString()) return "Live Today";
  return "Upcoming";
};

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [city, setCity] = useState("All Cities");
  const [type, setType] = useState("All Types");

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const seedDatabase = async () => {
    setSeeding(true);
    try { for (const e of SEED_EVENTS) await addDoc(collection(db, "events"), e); }
    catch (err) { console.error(err); }
    finally { setSeeding(false); }
  };

  const list = events.filter(
    (e) => (city === "All Cities" || e.city === city) && (type === "All Types" || e.types?.includes(type))
  );

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#10B981]" /></div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">🏟️ Events & <span className="text-[#FBBF24]">Tournaments</span></h1>
        <p className="text-slate-400 text-sm mt-1">Register for marathons, leagues and opens near you — Oct to Dec 2026 season.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CITY_FILTERS.map((c) => (
          <button key={c} onClick={() => setCity(c)} className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${city === c ? "bg-[#10B981] border-[#10B981] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>{c}</button>
        ))}
        <span className="w-px bg-slate-700 mx-2 hidden sm:block" />
        {TYPE_FILTERS.map((t) => (
          <button key={t} onClick={() => setType(t)} className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${type === t ? "bg-[#FBBF24] border-[#FBBF24] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>{t}</button>
        ))}
      </div>

      {events.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
          <DatabaseZap size={32} className="text-[#FBBF24]" />
          <p className="text-sm text-slate-300 font-semibold">No events in the database yet!</p>
          <button onClick={seedDatabase} disabled={seeding} className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 px-6 py-3 text-sm font-bold text-slate-950 transition-all active:scale-95">
            {seeding ? <><Loader2 size={16} className="animate-spin" /> Seeding...</> : <>🚀 Seed Demo Events</>}
          </button>
        </div>
      )}

      {events.length > 0 && list.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-16">No events match your filters.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((e) => {
          const status = statusOf(e);
          return (
            <article key={e.id} onClick={() => navigate(`/events/${e.id}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md shadow-xl hover:-translate-y-1 hover:border-slate-600 transition-all duration-300">
              <div className="relative h-44 bg-slate-100">
                <img src={getEventImage(e)} alt={e.title} loading="lazy" onError={onImgError} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${status === "Event Over" ? "bg-slate-700 text-slate-300" : status === "Live Today" ? "bg-red-500 text-white animate-pulse" : "bg-[#10B981] text-slate-950"}`}>{status}</span>
                {e.prizePool > 0 && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-[#FBBF24]"><Trophy size={11} /> ₹{e.prizePool.toLocaleString("en-IN")}</span>
                )}
              </div>
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {e.types?.map((t) => (
                    <span key={t} className="rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#FBBF24]">{t}</span>
                  ))}
                </div>
                <h3 className="font-bold text-white">{e.title}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5"><CalendarDays size={12} className="text-[#FBBF24]" /> {e.date}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin size={12} className="text-[#10B981]" /> {e.venue}, {e.city}</p>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1"><Users size={11} /> {e.registered}/{e.capacity}</span>
                    <span>{e.registered >= e.capacity ? "Sold Out" : `${e.capacity - e.registered} spots left`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#10B981] to-blue-500" style={{ width: `${Math.min(100, (e.registered / e.capacity) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <p className="text-[#10B981] font-bold">₹{e.price}<span className="text-xs text-slate-500 font-medium"> /entry</span></p>
                  <span className="rounded-full bg-[#F59E0B] hover:bg-[#D97706] px-5 py-2 text-xs font-bold text-slate-950">View & Register</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}