import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../store/CartContext";
import {
  Search, MapPin, CalendarDays, Trophy, Users, ArrowRight, Star, Activity, Check,
  Zap, Play, ChevronDown, Radio, Sparkles, ShieldCheck, Clock3,
} from "lucide-react";

const HERO_VIDEO = "/assets/playconnect-hero.mp4";

const HERO_QUOTES = [
  "Don't wait for motivation. Create it.",
  "Train your body. Challenge your limits.",
  "Every session makes you stronger.",
  "The next level starts with one more rep.",
  "Play hard. Stay hungry. Keep moving.",
];

const SPORTS = [
  { name: "Football", emoji: "⚽", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&q=80" },
  { name: "Cricket", emoji: "🏏", img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&q=80" },
  { name: "Badminton", emoji: "🏸", img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&q=80" },
  { name: "Tennis", emoji: "🎾", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=80" },
  { name: "Basketball", emoji: "🏀", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80" },
  { name: "Volleyball", emoji: "🏐", img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=900&q=80" },
  { name: "Table Tennis", emoji: "🏓", img: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=900&q=80" },
  { name: "Swimming", emoji: "🏊", img: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&q=80" },
  { name: "Boxing", emoji: "🥊", img: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=900&q=80" },
  { name: "Hockey", emoji: "🏑", img: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=900&q=80" },
];

const EVENTS = [
  { title: "Mumbai Cricket Championship", location: "Mumbai, Maharashtra", date: "20 Oct 2026", status: "Live", filled: 120, capacity: 150, fee: "₹2,500", img: SPORTS[1].img },
  { title: "Bangalore Tennis Masters", location: "Bangalore, Karnataka", date: "25 Oct 2026", status: "Live", filled: 15, capacity: 24, fee: "₹1,800", img: SPORTS[3].img },
  { title: "Delhi Badminton Open", location: "New Delhi", date: "03 Nov 2026", status: "Live", filled: 28, capacity: 32, fee: "₹1,000", img: SPORTS[2].img },
  { title: "Pune Basketball 3x3", location: "Pune, Maharashtra", date: "15 Nov 2026", status: "Open", filled: 18, capacity: 30, fee: "₹900", img: SPORTS[4].img },
  { title: "Navi Mumbai Volleyball Cup", location: "Navi Mumbai", date: "28 Nov 2026", status: "Open", filled: 42, capacity: 60, fee: "₹1,200", img: SPORTS[5].img },
  { title: "Mumbai Football Night Cup", location: "Mumbai, Maharashtra", date: "12 Dec 2026", status: "Open", filled: 56, capacity: 80, fee: "₹1,500", img: SPORTS[0].img },
];

const PRODUCTS = [
  { title: "SG Cricket Rubber Stud Shoes", category: "cricket • footwear", price: "₹1,450", isNew: true, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80" },
  { title: "Pro Turf Football Boots", category: "football • footwear", price: "₹2,199", isNew: true, img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=80" },
  { title: "Basketball Pro Grip", category: "basketball • equipment", price: "₹899", isNew: true, img: SPORTS[4].img },
  { title: "Boxing Gloves Premium", category: "boxing • equipment", price: "₹2,499", isNew: false, img: SPORTS[8].img },
];

function SectionHeader({ title, to, linkText, green = false }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className={`text-xl font-bold md:text-2xl ${green ? "text-[#10B981]" : "text-white"}`}>{title}</h2>
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-[#10B981] transition-colors hover:text-[#34D399]">
        {linkText} <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function FloatingCard({ className, iconWrap, icon, title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`absolute z-20 hidden items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-3.5 text-left shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#10B981]/40 hover:bg-slate-950/75 lg:flex ${className}`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconWrap}`}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-[11px] text-slate-400">{sub}</span>
      </span>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { add } = useCart();
  const [added, setAdded] = useState("");
  const [query, setQuery] = useState("");
  const [heroQuote, setHeroQuote] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const quoteTimer = setInterval(() => setHeroQuote((q) => (q + 1) % HERO_QUOTES.length), 3300);
    return () => clearInterval(quoteTimer);
  }, []);

  const addToCart = (p) => {
    add({ name: p.title, price: p.price, category: p.category });
    setAdded(p.title);
    setTimeout(() => setAdded(""), 1200);
  };

  const doSearch = (e) => {
    e.preventDefault();
    navigate(`/venues${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <main className="relative overflow-hidden bg-[#050A14]">
      {/* ═════════════════ CINEMATIC HERO ═════════════════ */}
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 -z-30 bg-[#050A14]" />

        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={SPORTS[0].img}
            onError={() => setVideoFailed(true)}
            className="hero-video h-full w-full object-cover opacity-60 saturate-[0.94] contrast-[1.08] brightness-[0.68] transition-opacity duration-1000"
            aria-hidden="true"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          {videoFailed && (
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1800&q=85')] bg-cover bg-center" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.88)_0%,rgba(3,7,18,0.48)_42%,rgba(3,7,18,0.28)_72%,rgba(3,7,18,0.62)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(16,185,129,0.20),transparent_36%),linear-gradient(180deg,rgba(3,7,18,0.15)_0%,rgba(3,7,18,0.28)_55%,#050A14_100%)]" />
        </div>

        {/* animated depth grid + light trails */}
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-35" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-[22%] -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-[#10B981]/10 shadow-[0_0_100px_rgba(16,185,129,0.12)] animate-[pulseGlow_5s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute left-[8%] top-[30%] -z-10 h-24 w-24 rounded-full bg-[#10B981]/20 blur-3xl animate-[float_7s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute right-[10%] top-[24%] -z-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl animate-[float_9s_ease-in-out_infinite_reverse]" />

        <FloatingCard className="left-[3%] top-[25%] animate-[float_6s_ease-in-out_infinite]" iconWrap="bg-[#10B981]/15 text-[#10B981]" icon={<Activity size={19} />} title="Join a Game" sub="Players nearby" onClick={() => navigate("/games")} />
        <FloatingCard className="left-[8%] bottom-[23%] animate-[float_8s_ease-in-out_1s_infinite]" iconWrap="bg-blue-500/15 text-blue-300" icon={<MapPin size={19} />} title="Nearby Venues" sub="Book in seconds" onClick={() => navigate("/venues")} />
        <FloatingCard className="right-[3%] top-[31%] animate-[float_7s_ease-in-out_.4s_infinite]" iconWrap="bg-[#FBBF24]/15 text-[#FBBF24]" icon={<Trophy size={19} />} title="Live Tournaments" sub="Compete & win" onClick={() => navigate("/events")} />
        <FloatingCard className="right-[8%] bottom-[20%] animate-[float_9s_ease-in-out_1.2s_infinite]" iconWrap="bg-cyan-400/15 text-cyan-300" icon={<Radio size={19} />} title="Sports Community" sub="Connect with players" onClick={() => navigate("/community")} />

        <div className="mx-auto flex min-h-[calc(100svh-72px)] max-w-6xl flex-col items-center justify-center px-5 pb-14 pt-12 text-center sm:px-8">
          <div className="hero-enter flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/35 bg-[#071C18]/70 px-4 py-2 text-xs font-semibold text-[#6EE7B7] shadow-[0_0_30px_rgba(16,185,129,0.08)] backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
              </span>
              LIVE SPORTS NETWORK
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-xl">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-[#FBBF24]" />
              Built for every player
            </span>
          </div>

          <h1 className="hero-enter-delay mt-7 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl lg:text-[6.4rem]">
            Your Game.
            <br />
            <span className="bg-gradient-to-r from-white via-[#6EE7B7] to-[#10B981] bg-clip-text text-transparent">Your People.</span>
          </h1>

          <p className="hero-enter-delay-2 mt-7 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base md:text-lg">
            Find a court, join a game, enter a tournament, or meet your next teammate.
            <span className="text-white"> PlayConnect brings the whole sports community together.</span>
          </p>

          <form onSubmit={doSearch} className="hero-enter-delay-3 mt-8 flex w-full max-w-2xl items-center gap-2 rounded-[22px] border border-white/10 bg-slate-950/65 p-2 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all focus-within:border-[#10B981]/50 focus-within:shadow-[0_0_45px_rgba(16,185,129,0.12)]">
            <Search size={19} className="ml-3 shrink-0 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find venues, games, tournaments..."
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button type="submit" className="group rounded-2xl bg-[#10B981] px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#34D399]">
              Search <ArrowRight size={15} className="ml-1 inline transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="hero-enter-delay-3 mt-5 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate("/games")} className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-[#D1FAE5]">
              <Play size={15} fill="currentColor" /> Find a Game
            </button>
            <button onClick={() => navigate("/events")} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[#10B981]/50 hover:bg-[#10B981]/10">
              Explore Tournaments <ArrowRight size={15} />
            </button>
          </div>

          <div className="hero-enter-delay-3 mt-10 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 backdrop-blur-xl">
            {[
              ["120+", "Venues"],
              ["2.5K+", "Players"],
              ["80+", "Live Games"],
            ].map(([value, label]) => (
              <div key={label} className="min-w-[88px] border-r border-white/10 px-5 py-3 last:border-0 sm:px-8">
                <p className="text-lg font-black text-white sm:text-xl">{value}</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <button onClick={() => document.getElementById("sports")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-4 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 transition-colors hover:text-white md:flex">
            Scroll to explore <ChevronDown size={14} className="animate-bounce" />
          </button>
        </div>
      </section>

      {/* ═════════════════ SPORT MARQUEE ═════════════════ */}
      <section id="sports" className="relative border-b border-white/5 py-5">
        <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/5 via-transparent to-cyan-400/5" />
        <div className="relative overflow-hidden">
          <div className="sport-marquee flex w-max gap-3 px-4">
            {[...SPORTS, ...SPORTS].map((sport, i) => (
              <button
                key={`${sport.name}-${i}`}
                onClick={() => navigate(`/venues?sport=${encodeURIComponent(sport.name)}`)}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition-all hover:border-[#10B981]/40 hover:bg-[#10B981]/10 hover:text-white"
              >
                <span className="text-base transition-transform group-hover:scale-125">{sport.emoji}</span>{sport.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ WHY PLAYCONNECT ═════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#10B981]">One platform. Every play.</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Everything you need to stay in the game.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Find the right venue", text: "Discover courts, turfs and sports spaces around you.", tone: "text-[#10B981] bg-[#10B981]/10" },
            { icon: Users, title: "Meet your players", text: "Join open games and build your local sports circle.", tone: "text-cyan-300 bg-cyan-400/10" },
            { icon: Trophy, title: "Compete & win", text: "Track tournaments, registrations and your next challenge.", tone: "text-[#FBBF24] bg-[#FBBF24]/10" },
          ].map(({ icon: Icon, title, text, tone }) => (
            <article key={title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
              <div className={`mb-6 grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              <ArrowRight className="absolute bottom-6 right-6 text-slate-700 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#10B981]" size={18} />
            </article>
          ))}
        </div>
      </section>

      {/* ═════════════════ BROWSE BY SPORT ═════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader title="Browse by Sport" to="/venues" linkText="See all sports" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SPORTS.map((sport, index) => (
            <button
              key={sport.name}
              onClick={() => navigate(`/venues?sport=${encodeURIComponent(sport.name)}`)}
              className={`group relative h-44 overflow-hidden rounded-3xl border border-white/10 text-left shadow-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#10B981]/35 ${index % 3 === 0 ? "animate-[float_7s_ease-in-out_infinite]" : ""}`}
            >
              <img src={sport.img} alt={sport.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md">
                  <span>{sport.emoji}</span>{sport.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═════════════════ JOIN GAME ═════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader title="Join a Game Nearby" to="/games" linkText="See all games" />
        <div className="relative overflow-hidden rounded-3xl border border-[#10B981]/20 bg-gradient-to-br from-[#071C18] via-slate-950 to-[#07111F] p-8 md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#10B981]/15 blur-3xl animate-pulse" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1 text-xs font-bold text-[#6EE7B7]">
                <Radio size={13} /> LIVE MATCHMAKING
              </div>
              <h3 className="text-2xl font-black text-white md:text-3xl">Don't wait for the perfect team.</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Find players who match your sport, level and location — or create a game and let the community join.</p>
            </div>
            <button onClick={() => navigate("/games")} className="rounded-full bg-[#10B981] px-7 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#34D399]">Browse Games <ArrowRight className="ml-1 inline" size={16} /></button>
          </div>
        </div>
      </section>

      {/* ═════════════════ EVENTS ═════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader green title="Upcoming Events & Tournaments" to="/events" linkText="View all" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((event) => {
            const pct = Math.round((event.filled / event.capacity) * 100);
            const live = event.status === "Live";
            return (
              <article key={event.title} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#10B981]/25">
                <div className="relative h-48 cursor-pointer overflow-hidden" onClick={() => navigate("/events")}>
                  <img src={event.img} alt={event.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${live ? "bg-red-500 text-white" : "border border-white/10 bg-slate-950/75 text-slate-300"}`}>
                    {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}{event.status}
                  </span>
                </div>
                <div className="space-y-4 p-5">
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"><MapPin size={12} className="text-[#10B981]" />{event.location}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"><CalendarDays size={12} className="text-[#FBBF24]" />{event.date}</span>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-slate-500">{event.filled}/{event.capacity} spots</span><span className="font-semibold text-[#10B981]">{event.capacity - event.filled} left</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-cyan-300 transition-all" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Entry Fee</p><p className="font-black text-[#FBBF24]">{event.fee}</p></div>
                    <button onClick={() => navigate("/events")} className="rounded-full bg-[#10B981] px-5 py-2 text-xs font-black text-slate-950 transition hover:bg-[#34D399]">Register</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ═════════════════ SHOP ═════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader title="Sports Gear Deals" to="/shop" linkText="Shop all" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <article key={product.title} className="group overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img src={product.img} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                {product.isNew && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FBBF24] px-2.5 py-1 text-[10px] font-black text-slate-950"><Star size={10} fill="currentColor" /> New</span>}
              </div>
              <div className="space-y-1 p-4">
                <h3 className="text-sm font-bold text-slate-900">{product.title}</h3>
                <p className="text-xs lowercase text-slate-500">{product.category}</p>
                <div className="flex items-center justify-between pt-2">
                  <p className="font-black text-slate-900">{product.price}</p>
                  <button onClick={() => addToCart(product)} className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition ${added === product.title ? "bg-[#059669] text-white" : "bg-[#10B981] text-slate-950 hover:bg-[#34D399]"}`}>
                    {added === product.title ? <><Check size={12} /> Added</> : "Add"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═════════════════ TRUST / CTA ═════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-[#071C18] to-slate-950 p-8 text-center shadow-2xl md:p-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#10B981]/10 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300"><ShieldCheck size={14} className="text-[#10B981]" /> BUILT FOR THE SPORTS COMMUNITY</span>
            <h2 className="mt-5 text-3xl font-black text-white md:text-5xl">Ready to make your next game happen?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">Book the venue. Find the players. Enter the tournament. PlayConnect handles the rest.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate("/venues")} className="rounded-full bg-[#10B981] px-7 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#34D399]">Explore Venues</button>
              <button onClick={() => navigate("/community")} className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-[#10B981]/40 hover:bg-[#10B981]/10">Join Community</button>
            </div>
            <div className="mt-7 flex items-center justify-center gap-5 text-xs text-slate-500"><span><Clock3 className="mr-1 inline h-3.5 w-3.5" />Quick booking</span><span><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Secure platform</span><span><Zap className="mr-1 inline h-3.5 w-3.5" />Built to play</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
