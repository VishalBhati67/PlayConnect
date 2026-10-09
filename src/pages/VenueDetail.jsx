import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { getVenueImage } from "../utils/venueImages";
import {
  MapPin, Star, ChevronLeft, ChevronRight, Image as ImageIcon, MessageSquare,
  Share2, Heart, Navigation, Loader2, CheckCircle2, Zap,
} from "lucide-react";

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;
const FALLBACK_IMG = IMG("photo-1575361204480-aadea25e6e68");

/* supports both new docs (full img url) and old docs (imgId) */
const imgUrl = (v) => v.img || IMG(v.imgId);
const onImgError = (e) => { if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG; };

/* 24 hourly slots */
const SLOTS = [...Array(24)].map((_, h) => {
  const s = h % 12 === 0 ? 12 : h % 12, sa = h < 12 ? "AM" : "PM";
  const eh = (h + 1) % 24, e = eh % 12 === 0 ? 12 : eh % 12, ea = eh < 12 ? "AM" : "PM";
  return { h, label: `${s}:00 ${sa} - ${e}:00 ${ea}` };
});

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [venue, setVenue] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [courtIdx, setCourtIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customIso, setCustomIso] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [placing, setPlacing] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "venues"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const param = decodeURIComponent(id);
      const found =
        all.find((v) => v.id === param) ||
        all.find((v) => v.name === param) ||
        all.find((v) => v.name?.toLowerCase() === param.toLowerCase());
      if (found) setVenue(found);
      else setNotFound(true);
    });
    return () => unsub();
  }, [id]);

  if (notFound) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-slate-400">Venue not found.</p>
        <Link to="/venues" className="mt-4 inline-block text-sm font-bold text-[#10B981]">← Back to Venues</Link>
      </main>
    );
  }
  if (!venue) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 size={40} className="animate-spin text-[#10B981]" /></div>;
  }

  /* ✅ UPDATED: supports both full img URLs and old imgId format */
  const curatedImage = getVenueImage(venue);
  const images = venue.images?.length ? venue.images : (curatedImage ? [curatedImage] : []);
  
  const courts = (venue.sports || ["General"]).map((s, i) => ({
    name: i === 0 ? venue.name : `${venue.name} — ${s}`,
    sport: s,
    price: venue.price,
  }));
  const court = courts[courtIdx];

  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });

  const isPassed = (h) => {
    const now = new Date();
    const sameDay = selectedDate.toDateString() === now.toDateString();
    if (!sameDay && selectedDate < now) return true;
    if (sameDay && h <= now.getHours()) return true;
    return false;
  };

  const toggleSlot = (label) => {
    setBooked(false);
    setSelectedSlots((prev) => (prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]));
  };

  const total = selectedSlots.length * court.price;

  const book = async () => {
    if (!user) { navigate("/login"); return; }
    setPlacing(true);
    try {
      await addDoc(collection(db, "bookings"), {
        uid: user.uid,
        venueId: venue.id,
        venue: venue.name,
        court: court.name,
        sport: court.sport,
        date: dateKey(selectedDate),
        slots: selectedSlots,
        total,
        status: "Confirmed",
        createdAt: serverTimestamp(),
      });
      setBooked(true);
      setSelectedSlots([]);
    } catch (err) {
      console.error(err);
    } finally {
      setPlacing(false);
    }
  };

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShareMsg("🔗 Copied!"); }
    catch { setShareMsg("Copy failed"); }
    setTimeout(() => setShareMsg(""), 2000);
  };

  return (
    <main className="pb-16">
      {/* ── HERO CAROUSEL ──────────────────────────── */}
      <div className="relative h-[420px] overflow-hidden">
        <img src={images[imgIdx]} alt={venue.name} onError={onImgError} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex gap-2">
          {images.map((im, i) => (
            <button key={i} onClick={() => setImgIdx(i)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? "border-[#FBBF24]" : "border-transparent opacity-70"}`}>
              <img src={im} alt="" onError={onImgError} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <span className="absolute right-4 top-4 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-bold text-white">{imgIdx + 1} / {images.length}</span>

        <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/90"><ChevronLeft size={18} /></button>
        <button onClick={() => setImgIdx((imgIdx + 1) % images.length)} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/90"><ChevronRight size={18} /></button>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-6 bg-[#FBBF24]" : "w-1.5 bg-slate-500"}`} />
          ))}
        </div>

        <div className="absolute left-6 right-6 bottom-6">
          <h1 className="text-4xl font-black text-white">{venue.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300 flex-wrap">
            <MapPin size={14} className="text-[#10B981]" /> {venue.address}
            <span className="flex items-center gap-1 ml-2">
              <Star size={13} className="text-[#FBBF24]" fill="currentColor" />
              {venue.rating ? `${venue.rating} (${venue.reviews} reviews)` : `New (${venue.reviews || 0} reviews)`}
            </span>
          </p>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid sm:grid-cols-2 gap-4">
        <button onClick={() => setImgIdx((imgIdx + 1) % images.length)} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
          <ImageIcon size={16} /> View Images ({images.length})
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
          <MessageSquare size={16} /> View Reviews ({venue.reviews || 0})
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">About Venue</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {venue.description || `${venue.name} is a premium sports facility in ${venue.address}. Well-maintained grounds, professional staff and a vibrant player community — book your slot in seconds.`}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {(venue.amenities || ["Lighting", "Drinking Water", "Parking", "Restrooms"]).map((a) => (
                <span key={a} className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">{a}</span>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 flex items-start gap-2 text-sm text-slate-300">
              <MapPin size={15} className="text-blue-400 shrink-0 mt-0.5" /> {venue.address}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Available Sports</h2>
            <div className="flex flex-wrap gap-2">
              {venue.sports?.map((s) => (
                <span key={s} className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200">{s}</span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Select Ground / Court</h2>
            <div className="flex flex-wrap gap-3">
              {courts.map((c, i) => (
                <button key={c.name} onClick={() => { setCourtIdx(i); setSelectedSlots([]); }}
                  className={`rounded-xl border px-5 py-3 text-center transition-all ${i === courtIdx ? "border-[#FBBF24] bg-[#FBBF24]/10" : "border-slate-700 bg-slate-900/80 hover:bg-slate-800"}`}>
                  <p className={`text-sm font-bold ${i === courtIdx ? "text-[#FBBF24]" : "text-white"}`}>{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.sport} · ₹{c.price}/slot</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Available Time Slots — {court.name}</h2>

            <div className="flex gap-2 overflow-x-auto pb-3">
              {days.map((d) => {
                const active = d.toDateString() === selectedDate.toDateString();
                return (
                  <button key={d.toISOString()} onClick={() => { setSelectedDate(d); setCustomIso(""); setSelectedSlots([]); }}
                    className={`shrink-0 w-16 rounded-xl border py-2.5 text-center transition-all ${active ? "bg-[#FBBF24] border-[#FBBF24] text-slate-950" : "border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800"}`}>
                    <p className="text-[10px] font-bold uppercase">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <p className="text-lg font-black">{pad(d.getDate())}</p>
                    <p className="text-[10px]">{d.toLocaleDateString("en-US", { month: "short" })}</p>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-400 mt-2">
              Or custom date:
              <input type="date" value={customIso}
                onChange={(e) => { setCustomIso(e.target.value); if (e.target.value) { setSelectedDate(new Date(e.target.value + "T00:00:00")); setSelectedSlots([]); } }}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FBBF24]" />
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
              {SLOTS.map((s) => {
                const passed = isPassed(s.h);
                const sel = selectedSlots.includes(s.label);
                return (
                  <button key={s.h} disabled={passed} onClick={() => toggleSlot(s.label)}
                    className={`rounded-xl border px-2 py-3 text-center transition-all ${
                      passed
                        ? "border-slate-800 bg-slate-900/40 opacity-40 cursor-not-allowed"
                        : sel
                        ? "border-[#FBBF24] bg-[#FBBF24]/15"
                        : "border-slate-700 bg-slate-900/80 hover:bg-slate-800"
                    }`}>
                    <p className={`text-xs font-bold ${sel ? "text-[#FBBF24]" : "text-white"}`}>{s.label}</p>
                    <p className="text-[11px] font-bold text-[#10B981] mt-1">₹{court.price}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{passed ? "Passed" : sel ? "Selected ✓" : "Available"}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-start justify-between">
              <p className="text-2xl font-black text-[#10B981]">
                ₹{court.price}
                <span className="text-xs text-slate-500 font-medium line-through ml-2">₹{Math.round(court.price * 1.33)}</span>
                <span className="text-xs text-slate-500 font-medium">/slot</span>
              </p>
              <span className="flex items-center gap-1 text-xs font-bold text-[#FBBF24]"><Star size={12} fill="currentColor" /> {venue.badge}</span>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B]"><Zap size={12} /> Peak hours: 6 PM – 11 PM</p>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm font-bold text-[#FBBF24]">
              🏟 {court.name} · {court.sport}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1.5">Date</p>
              <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white">{dateKey(selectedDate)}</div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1.5">Selected Slots</p>
              <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm min-h-[52px]">
                {selectedSlots.length === 0 ? (
                  <span className="text-slate-500">Click on time slots to select</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSlots.map((s) => (
                      <span key={s} className="rounded-full bg-[#FBBF24]/15 border border-[#FBBF24]/40 px-2.5 py-1 text-[10px] font-bold text-[#FBBF24]">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedSlots.length > 0 && (
              <div className="flex justify-between text-sm font-black text-white border-t border-slate-700/60 pt-3">
                <span>Total ({selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""})</span>
                <span className="text-[#FBBF24]">₹{total.toLocaleString("en-IN")}</span>
              </div>
            )}

            {booked && (
              <p className="flex items-center gap-2 text-xs font-bold text-[#10B981]">
                <CheckCircle2 size={14} /> Booking confirmed! See it in your Dashboard.
              </p>
            )}

            <button onClick={book} disabled={placing || selectedSlots.length === 0}
              className="w-full rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed py-3.5 text-sm font-black text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-[#F59E0B]/25">
              {placing ? <Loader2 size={16} className="animate-spin mx-auto" /> : selectedSlots.length === 0 ? "Select Time Slots" : `Book ${selectedSlots.length} Slot(s) · ₹${total.toLocaleString("en-IN")}`}
            </button>

            <div className="flex justify-center gap-2 pt-1">
              <a href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors">
                <Navigation size={12} /> Directions
              </a>
              <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors">
                <Share2 size={12} /> {shareMsg || "Share"}
              </button>
              <button onClick={() => setSaved((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${saved ? "border-red-500/50 text-red-400 bg-red-500/10" : "border-slate-700 text-white hover:bg-slate-800"}`}>
                <Heart size={12} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}