import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../store/CartContext";
import {
  Search, MapPin, CalendarDays, Trophy, Users, ArrowRight, Star, Activity, Check,
} from "lucide-react";

/* ── Unique real image per sport ─────────────────────────────── */
const SPORTS = [
  { name: "Football", emoji: "⚽", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e75167.png" },
  { name: "Cricket", emoji: "🏏", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e76385.png" },
  { name: "Badminton", emoji: "🏸", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e71720.png" },
  { name: "Tennis", emoji: "🎾", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e74882.png" },
  { name: "Basketball", emoji: "🏀", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/76d3930e4-f1fd-4535-ae9d-3790a53d96e75581.png" },
  { name: "Volleyball", emoji: "🏐", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e76807.png" },
  { name: "Table Tennis", emoji: "🏓", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e74645.png" },
  { name: "Swimming", emoji: "🏊", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e73739.png" },
  { name: "Boxing", emoji: "🥊", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/16d3930e4-f1fd-4535-ae9d-3790a53d96e73156.png" },
  { name: "Hockey", emoji: "🏑", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e75241.png" },
];

const EVENTS = [
  { title: "Ahmedabad Football Cup", location: "Ahmedabad, Gujarat", date: "Sat, 12 Sep 2026", status: "Live", filled: 64, capacity: 80, fee: "₹1,800", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e75167.png" },
  { title: "MMA Fight Night Jaipur", location: "Jaipur, Rajasthan", date: "Sun, 09 Aug 2026", status: "Event Over", filled: 96, capacity: 96, fee: "₹1,500", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/16d3930e4-f1fd-4535-ae9d-3790a53d96e73156.png" },
  { title: "Chennai Basketball League", location: "Chennai, Tamil Nadu", date: "Sat, 26 Sep 2026", status: "Live", filled: 45, capacity: 60, fee: "₹1,200", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/76d3930e4-f1fd-4535-ae9d-3790a53d96e75581.png" },
  { title: "Mumbai Cricket Championship", location: "Mumbai, Maharashtra", date: "Sun, 20 Sep 2026", status: "Live", filled: 120, capacity: 150, fee: "₹2,500", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e76385.png" },
  { title: "Delhi Badminton Open", location: "New Delhi", date: "Sat, 03 Oct 2026", status: "Live", filled: 28, capacity: 32, fee: "₹1,000", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/36d3930e4-f1fd-4535-ae9d-3790a53d96e77968.png" },
  { title: "Bangalore Tennis Masters", location: "Bangalore, Karnataka", date: "Sun, 11 Oct 2026", status: "Live", filled: 15, capacity: 24, fee: "₹1,800", img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e74882.png" },
];

const PRODUCTS = [
  { title: "SG Cricket Rubber Stud Shoes", category: "cricket • footwear", price: "₹1,450", isNew: true, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80" },
  { title: "White Cricket Ball", category: "cricket • equipment", price: "₹249", isNew: false, img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e79596.png" },
  { title: "Pro Turf Football Boots", category: "football • footwear", price: "₹2,199", isNew: true, img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=80" },
  { title: "Tournament Tennis Racket", category: "tennis • equipment", price: "₹3,499", isNew: false, img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e77519.png" },
  { title: "Basketball Pro Grip", category: "basketball • equipment", price: "₹899", isNew: true, img: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=900&q=80" },
  { title: "Badminton Racket Set", category: "badminton • equipment", price: "₹1,299", isNew: false, img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/26d3930e4-f1fd-4535-ae9d-3790a53d96e71720.png" },
  { title: "Swimming Goggles Pro", category: "swimming • accessories", price: "₹599", isNew: true, img: "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e73739.png" },
  { title: "Boxing Gloves Premium", category: "boxing • equipment", price: "₹2,499", isNew: false, img: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=900&q=80" },
];

/* ── Small pieces ─────────────────────────────────────────────── */
function SectionHeader({ title, to, linkText, green = false }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className={`text-xl md:text-2xl font-bold ${green ? "text-[#10B981]" : "text-white"}`}>{title}</h2>
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-[#10B981] hover:text-[#34D399] transition-colors">
        {linkText} <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function FloatingCard({ className, iconWrap, icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} className={`absolute hidden lg:flex items-center gap-3 p-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-xl hover:border-slate-500 transition-all active:scale-95 cursor-pointer ${className}`}>
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${iconWrap}`}>{icon}</span>
      <div className="text-left">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </button>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { add } = useCart();
  const [added, setAdded] = useState("");
  const [query, setQuery] = useState("");

  const addToCart = (p) => {
    add({ name: p.title, price: p.price, category: p.category });
    setAdded(p.title);
    setTimeout(() => setAdded(""), 1200);
  };

  const doSearch = (e) => {
    e.preventDefault();
    navigate("/venues");
  };

  return (
    <main className="relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[820px] h-[480px] rounded-full bg-[#10B981]/10 blur-[130px]" />
        <div className="absolute top-64 -left-40 w-96 h-96 rounded-full bg-[#F59E0B]/5 blur-[110px]" />
      </div>

      {/* ══════════ HERO ══════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <FloatingCard className="left-2 top-16 xl:left-8" iconWrap="bg-[#10B981]/15 text-[#10B981]" icon={<Activity size={20} />} title="Join Game" sub="Open now" onClick={() => navigate("/games")} />
        <FloatingCard className="left-8 bottom-10 xl:left-24" iconWrap="bg-blue-500/15 text-blue-400" icon={<MapPin size={20} />} title="Nearby Venues" sub="Discover & book" onClick={() => navigate("/venues")} />
        <FloatingCard className="right-2 top-1/3 xl:right-8" iconWrap="bg-[#FBBF24]/15 text-[#FBBF24]" icon={<Trophy size={20} />} title="Tournaments" sub="Live events" onClick={() => navigate("/events")} />

        <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-[#10B981]">
          ⚡ The Operating System for Sports
        </span>

        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
          Play More. Connect Better. <span className="text-[#10B981]">Win Together.</span>
        </h1>

        <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
          Discover venues, book games, join tournaments, shop gear, and connect with players — all on one platform built for the sports community.
        </p>

        <form onSubmit={doSearch} className="mt-8 mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 backdrop-blur-md py-2 pl-5 pr-2 shadow-xl focus-within:border-[#10B981]/60 transition-colors">
          <Search size={18} className="shrink-0 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venues, events, gear, games..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button type="submit" className="rounded-full bg-[#10B981] hover:bg-[#059669] px-6 py-2.5 text-sm font-bold text-slate-950 transition-colors">
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => navigate("/venues")} className="rounded-full bg-[#10B981] hover:bg-[#059669] px-7 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[#10B981]/20 transition-all active:scale-95">
            Explore Venues
          </button>
          <button onClick={() => navigate("/events")} className="rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 px-7 py-3 text-sm font-bold text-white transition-all active:scale-95">
            Find Tournaments
          </button>
        </div>
      </section>

      {/* ══════════ BROWSE BY SPORT ══════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <SectionHeader title="Browse by Sport" to="/venues" linkText="See all" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {SPORTS.map((sport) => (
            <button
              key={sport.name}
              onClick={() => navigate(`/venues?sport=${encodeURIComponent(sport.name)}`)}
              className="group relative h-44 overflow-hidden rounded-2xl border border-slate-700/60 text-left"
            >
              <img
                src={sport.img}
                alt={sport.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/1e293b/10B981?text=${encodeURIComponent(sport.name)}`; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 backdrop-blur px-3 py-1.5 text-sm font-semibold text-white">
                <span>{sport.emoji}</span> {sport.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════ JOIN A GAME NEARBY ══════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <SectionHeader title="▶ Join a Game Nearby" to="/games" linkText="See all" />
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
          <span className="grid place-items-center w-14 h-14 rounded-2xl border border-slate-700 bg-slate-800/80 text-[#10B981]">
            <Users size={24} />
          </span>
          <p className="text-sm sm:text-base text-slate-400">No open games right now. Be the first to create one!</p>
          <button onClick={() => navigate("/games")} className="rounded-full bg-[#10B981] hover:bg-[#059669] px-7 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[#10B981]/20 transition-all active:scale-95">
            Browse Games
          </button>
        </div>
      </section>

      {/* ══════════ EVENTS & TOURNAMENTS ══════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <SectionHeader green title="🏆 Upcoming Events & Tournaments" to="/events" linkText="View all" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EVENTS.map((event) => {
            const pct = Math.round((event.filled / event.capacity) * 100);
            const live = event.status === "Live";
            return (
              <article key={event.title} className="group overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-600">
                <div className="relative h-44 cursor-pointer" onClick={() => navigate("/events")}>
                  <img
                    src={event.img}
                    alt={event.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/1e293b/FBBF24?text=${encodeURIComponent(event.title)}`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${live ? "bg-red-500 text-white" : "border border-slate-600 bg-slate-950/80 text-slate-300"}`}>
                    {live && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                    )}
                    {event.status}
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                      <MapPin size={12} className="text-[#10B981]" /> {event.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                      <CalendarDays size={12} className="text-[#FBBF24]" /> {event.date}
                    </span>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{event.filled}/{event.capacity} spots</span>
                      <span className={`font-semibold ${live ? "text-[#10B981]" : "text-slate-500"}`}>{live ? `${event.capacity - event.filled} left` : "Full"}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                      <div className={`h-full rounded-full ${live ? "bg-[#10B981]" : "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs text-slate-500">Entry Fee</p>
                      <p className="text-lg font-bold text-[#FBBF24]">{event.fee}</p>
                    </div>
                    <button
                      disabled={!live}
                      onClick={() => navigate("/events")}
                      className="rounded-full bg-[#10B981] hover:bg-[#059669] px-5 py-2 text-xs font-bold text-slate-950 transition-colors disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {live ? "Register" : "Closed"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ══════════ SPORTS GEAR DEALS ══════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <SectionHeader title="🛒 Sports Gear Deals" to="/shop" linkText="Shop all" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRODUCTS.map((product) => (
            <article key={product.title} className="group overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-40 bg-slate-100">
                <img
                  src={product.img}
                  alt={product.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/f1f5f9/10B981?text=${encodeURIComponent(product.title)}`; }}
                />
                {product.isNew && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FBBF24] px-2.5 py-1 text-[10px] font-black text-slate-950 shadow">
                    <Star size={10} fill="currentColor" /> New
                  </span>
                )}
              </div>
              <div className="space-y-1 p-4">
                <h3 className="text-sm font-bold text-slate-900">{product.title}</h3>
                <p className="text-xs lowercase text-slate-500">{product.category}</p>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-base font-black text-slate-900">{product.price}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${added === product.title ? "bg-[#059669] text-white" : "bg-[#10B981] hover:bg-[#059669] text-slate-950"}`}
                  >
                    {added === product.title ? (<><Check size={12} /> Added</>) : "Add"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══════════ AFFILIATE BANNER ══════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-950 to-[#070C18] p-8 md:p-12 text-center shadow-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F59E0B]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#10B981]/10 blur-3xl" />

          <span className="relative inline-flex items-center gap-2 rounded-full border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-1.5 text-[11px] sm:text-xs font-black tracking-[0.14em] text-[#FBBF24]">
            🤝 PLAYCONNECT AFFILIATE PROGRAM
          </span>

          <h2 className="relative mt-5 text-2xl sm:text-3xl md:text-4xl font-black text-white">
            Own a sports business or know one? <span className="text-[#FBBF24]">Partner & Earn!</span>
          </h2>

          <p className="relative mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
            Refer sports shops, turfs, gyms, or coaches to PlayConnect. You'll receive a lifetime share of every booking, entry, and order they generate — paid out monthly, forever.
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => navigate("/affiliate")} className="rounded-full bg-[#F59E0B] hover:bg-[#D97706] px-7 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[#F59E0B]/20 transition-all active:scale-95">
              Open Affiliate Hub
            </button>
            <button onClick={() => navigate("/sponsors")} className="rounded-full border border-[#10B981] px-7 py-3 text-sm font-bold text-[#10B981] hover:bg-[#10B981]/10 transition-all active:scale-95">
              Partner Directory
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}