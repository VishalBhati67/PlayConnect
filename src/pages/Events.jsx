import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, query } from "firebase/firestore";
import { db } from "../firebase";
import { MapPin, CalendarDays, Users, Loader2, DatabaseZap, Trophy } from "lucide-react";

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;

/* ✅ Guaranteed fallback if any image ever fails */
const FALLBACK_IMG = "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e75167.png";
const onImgError = (e) => { if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG; };

/* ── 12 EVENTS · fresh Oct–Dec 2026 dates · unique working images ── */
const SEED_EVENTS = [
  { title: "Bandra Table Tennis Grand Prix", types: ["Table Tennis"], city: "Mumbai", district: "Bandra West", venue: "Spin City Arena", date: "2026-10-17", price: 350, capacity: 64, registered: 38, prizePool: 25000, description: "Singles & doubles brackets by UTR rating. Balls and tables provided.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e74645.png" },
  { title: "Jaipur Football Knockout Cup", types: ["Football"], city: "Jaipur", district: "Pink Square", venue: "TURBO TURF", date: "2026-10-18", price: 1000, capacity: 16, registered: 11, prizePool: 60000, description: "7-a-side knockout cup — professional referees, live scoring, medals.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e75167.png" },
  { title: "Mumbai Cricket Premier League T20", types: ["Cricket"], city: "Mumbai", district: "Andheri East", venue: "Andheri Sports Turf", date: "2026-10-24", price: 1500, capacity: 16, registered: 14, prizePool: 75000, description: "Team T20 league — 16 squads, professional umpires, live streaming.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e76385.png" },
  { title: "Chennai Basketball League", types: ["Basketball"], city: "Chennai", district: "Anna Nagar", venue: "Hoop City Arena", date: "2026-10-31", price: 1200, capacity: 12, registered: 7, prizePool: 50000, description: "3v3 street league — round robin into knockout finals.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/76d3930e4-f1fd-4535-ae9d-3790a53d96e75581.png" },
  { title: "Ghaziabad Badminton Open", types: ["Badminton"], city: "Ghaziabad", district: "Indirapuram", venue: "VT Badminton Academy", date: "2026-11-08", price: 400, capacity: 64, registered: 45, prizePool: 30000, description: "Singles & doubles brackets by skill rating. Shuttlecocks provided.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e77968.png" },
  { title: "Delhi Midnight Marathon 2026", types: ["Marathon", "Athletics"], city: "Delhi", district: "Central Delhi", venue: "India Gate", date: "2026-11-14", price: 500, capacity: 500, registered: 328, prizePool: 100000, description: "10K night run through Delhi landmarks. Chip timing, finisher medals, hydration stations.", img: "https://images.unsplash.com/photo-1552674645-db764573271e?auto=format&fit=crop&w=900&q=60" },
  { title: "Ahmedabad Volleyball Smash Cup", types: ["Volleyball"], city: "Ahmedabad", district: "Vastrapur", venue: "Smash Vault Arena", date: "2026-11-22", price: 800, capacity: 12, registered: 7, prizePool: 40000, description: "6-a-side volleyball knockout — floodlit finals on Sunday night.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e76807.png" },
  { title: "Delhi Boxing Night Championship", types: ["Boxing"], city: "Delhi", district: "Karol Bagh", venue: "Capital Boxing Hub", date: "2026-11-28", price: 600, capacity: 32, registered: 21, prizePool: 55000, description: "Amateur boxing bouts across 6 weight categories. Gloves provided.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/16d3930e4-f1fd-4535-ae9d-3790a53d96e73156.png" },
  { title: "Powai Aquathon Swim Meet", types: ["Swimming"], city: "Mumbai", district: "Powai", venue: "Wave Riders Olympic Pool", date: "2026-12-05", price: 450, capacity: 80, registered: 52, prizePool: 35000, description: "50m & 100m freestyle, breaststroke and relay races — Olympic pool.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e77334.png" },
  { title: "Pune Tennis Masters", types: ["Tennis"], city: "Pune", district: "Boat Club Road", venue: "Rally Masters Club", date: "2026-12-13", price: 600, capacity: 32, registered: 18, prizePool: 45000, description: "Round-robin groups into knockout draw. UTR-sanctioned event.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e74882.png" },
  { title: "Jaipur Hockey League", types: ["Hockey"], city: "Jaipur", district: "Sanganer", venue: "Turfside Hockey Ground", date: "2026-12-20", price: 900, capacity: 8, registered: 5, prizePool: 48000, description: "11-a-side hockey league on brand-new astroturf. Sticks available on rent.", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e75241.png" },
  /* past event for the "Event Over" demo */
  { title: "Ahmedabad Football Cup", types: ["Football"], city: "Ahmedabad", district: "Vastrapur", venue: "Urban Turf Arena", date: "2026-08-30", price: 1000, capacity: 12, registered: 12, prizePool: 60000, description: "7-a-side knockout cup. Completed — results published.", img: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=900&q=60" },
];

const CITY_FILTERS = ["All Cities", "Delhi", "Mumbai", "Jaipur", "Ahmedabad", "Ghaziabad", "Pune", "Chennai"];
const TYPE_FILTERS = ["All Types", "Marathon", "Cricket", "Football", "Badminton", "Tennis", "Basketball", "Boxing", "Swimming"];

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
                <img src={e.img || IMG(e.imgId)} alt={e.title} loading="lazy" onError={onImgError} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
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