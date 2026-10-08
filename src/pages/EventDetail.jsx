import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import {
  MapPin, CalendarDays, Users, Trophy, IndianRupee, Loader2, CheckCircle2,
  Ticket, Minus, Plus, Wallet, AlertCircle,
} from "lucide-react";

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;

/* ✅ Guaranteed fallback if any image ever fails */
const FALLBACK_IMG = "https://image.qwenlm.ai/public_source/7ba46c23-1a46-405f-9758-03c7b91340ca/06d3930e4-f1fd-4535-ae9d-3790a53d96e75167.png";
const onImgError = (e) => {
  if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
};

const statusOf = (e) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(e.date + "T00:00:00");
  if (d < today) return "Event Over";
  if (d.toDateString() === today.toDateString()) return "Live Today";
  return "Upcoming";
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [regType, setRegType] = useState("Individual Player");
  const [ticketIdx, setTicketIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const param = decodeURIComponent(id);
      const found = all.find((v) => v.id === param) || all.find((v) => v.title === param);
      if (found) setEvent(found);
      else setNotFound(true);
    }, (err) => {
      console.error("Firestore error:", err);
      setNotFound(true);
    });
    return () => unsub();
  }, [id]);

  if (notFound) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-slate-400">Event not found.</p>
        <Link to="/events" className="mt-4 inline-block text-sm font-bold text-[#10B981]">← Back to Events</Link>
      </main>
    );
  }
  if (!event) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 size={40} className="animate-spin text-[#10B981]" /></div>;
  }

  /* ✅ NEW: supports full img URLs (new events) AND old imgId format */
  const heroImg = event.img || IMG(event.imgId);

  const status = statusOf(event);
  const ended = status === "Event Over";
  const soldOut = (event.registered || 0) >= event.capacity;

  const tickets = [
    { name: "Player Entry", desc: "Standard participant entry", price: event.price },
    { name: "Pro Entry", desc: "Kit bag + priority check-in", price: event.price + 300 },
  ];
  const ticket = tickets[ticketIdx];
  const subtotal = ticket.price * qty;
  const platformFee = Math.round(subtotal * 0.05);
  const availablePoints = user?.points ?? 0;
  const pointsMax = Math.min(availablePoints, subtotal + platformFee);
  const safePoints = Math.min(pointsUsed, pointsMax);
  const total = Math.max(0, subtotal + platformFee - safePoints);

  const register = async () => {
    if (!user) { navigate("/login"); return; }
    setPlacing(true);
    try {
      await addDoc(collection(db, "registrations"), {
        uid: user.uid,
        eventId: event.id,
        event: event.title,
        regType,
        ticket: ticket.name,
        qty,
        total,
        pointsUsed: safePoints,
        status: "Confirmed",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "events", event.id), { registered: increment(qty) });
      if (safePoints > 0) await updateDoc(doc(db, "users", user.uid), { points: increment(-safePoints) });
      setDone(true);
    } catch (err) { console.error(err); }
    finally { setPlacing(false); }
  };

  return (
    <main className="pb-16">
      {/* ── HERO ───────────────────────────────────── */}
      <div className="relative h-[440px] overflow-hidden bg-slate-900">
        <img src={heroImg} alt={event.title} onError={onImgError} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-transparent" />
        <div className="absolute left-6 right-6 bottom-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {event.types?.map((t) => (
              <span key={t} className="rounded-full border border-[#F59E0B]/50 bg-[#F59E0B]/10 px-3 py-1 text-xs font-bold text-[#FBBF24]">{t}</span>
            ))}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${ended ? "bg-slate-700 text-slate-300" : status === "Live Today" ? "bg-red-500 text-white" : "bg-[#10B981] text-slate-950"}`}>
              {ended && <AlertCircle size={12} />} {status}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">{event.title}</h1>
          <p className="mt-3 flex items-center gap-4 text-sm text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {event.date}</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {event.venue}, {event.city}</span>
          </p>
        </div>
      </div>

      {/* ── STATS CARDS ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: "Prize Pool", value: `₹${(event.prizePool || 0).toLocaleString("en-IN")}`, color: "text-[#FBBF24]" },
          { icon: IndianRupee, label: "Entry From", value: `₹${event.price}`, color: "text-[#10B981]" },
          { icon: Users, label: "Participants", value: `${event.registered || 0}/${event.capacity}`, color: "text-blue-400" },
          { icon: MapPin, label: "Location", value: event.venue, color: "text-[#F59E0B]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5">
            <s.icon size={18} className={s.color} />
            <p className="mt-3 text-lg font-black text-white truncate">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid lg:grid-cols-3 gap-8">
        {/* ── LEFT: About ──────────────────────────── */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-3">About This Event</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{event.description}</p>
        </div>

        {/* ── RIGHT: Registration card ─────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 space-y-5 lg:sticky lg:top-24">
            <div>
              <h2 className="text-lg font-black text-white">{ended ? "Registration Closed" : "Register Now"}</h2>
              <div className="flex justify-between text-xs text-slate-400 mt-3">
                <span>Registrations</span><span>{event.registered || 0}/{event.capacity}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden mt-1.5">
                <div className="h-full bg-gradient-to-r from-[#10B981] to-blue-500" style={{ width: `${Math.min(100, ((event.registered || 0) / event.capacity) * 100)}%` }} />
              </div>
            </div>

            {ended && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-xs text-slate-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> This event has ended. Registration is closed.
              </div>
            )}

            {!ended && (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1.5">Registration Type</p>
                  <select value={regType} onChange={(e) => setRegType(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FBBF24] cursor-pointer">
                    <option>Individual Player</option>
                    <option>Team (2-4 players)</option>
                  </select>
                </div>

                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2"><Ticket size={13} className="text-[#FBBF24]" /> Select Ticket Type</p>
                  <div className="space-y-2">
                    {tickets.map((t, i) => (
                      <button key={t.name} onClick={() => setTicketIdx(i)}
                        className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${i === ticketIdx ? "border-[#FBBF24] bg-[#FBBF24]/10" : "border-slate-700 bg-slate-950/60 hover:bg-slate-800"}`}>
                        <span className="text-left">
                          <p className={`text-sm font-bold ${i === ticketIdx ? "text-[#FBBF24]" : "text-white"}`}>{t.name}</p>
                          <p className="text-[11px] text-slate-500">{t.desc}</p>
                        </span>
                        <span className="text-sm font-black text-white">₹{t.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Quantity</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid place-items-center w-9 h-9 rounded-full border border-slate-700 text-white hover:bg-slate-800"><Minus size={14} /></button>
                    <span className="text-lg font-black text-white w-6 text-center">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(5, q + 1))} className="grid place-items-center w-9 h-9 rounded-full border border-slate-700 text-white hover:bg-slate-800"><Plus size={14} /></button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300"><span>{ticket.name}</span><span className="font-bold text-white">₹{subtotal.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Platform fee</span><span className="font-bold text-white">₹{platformFee.toLocaleString("en-IN")}</span></div>
                  {safePoints > 0 && <div className="flex justify-between text-[#10B981]"><span>PC Points</span><span className="font-bold">-₹{safePoints.toLocaleString("en-IN")}</span></div>}

                  <div className="rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-3 mt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#FBBF24] flex items-center gap-1.5"><Wallet size={12} /> Use PC Points ({availablePoints} available)</span>
                      <span className="text-white">-₹{safePoints.toLocaleString("en-IN")}</span>
                    </div>
                    <input type="range" min="0" max={pointsMax} value={safePoints} onChange={(e) => setPointsUsed(Number(e.target.value))}
                      disabled={pointsMax === 0} className="w-full mt-2 accent-[#FBBF24] disabled:opacity-40" />
                    <div className="flex justify-between text-[10px] text-slate-500"><span>0 pts</span><span>{safePoints} pts used</span></div>
                  </div>

                  <div className="flex justify-between text-base font-black text-white border-t border-slate-700/60 pt-2">
                    <span>Total</span><span className="text-[#FBBF24]">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {done && <p className="flex items-center gap-2 text-xs font-bold text-[#10B981]"><CheckCircle2 size={14} /> Registration confirmed! See you there 🎉</p>}

                <button onClick={register} disabled={placing || soldOut}
                  className="w-full rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed py-3.5 text-sm font-black text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-[#F59E0B]/25">
                  {placing ? <Loader2 size={16} className="animate-spin mx-auto" /> : soldOut ? "Sold Out" : `Register & Pay ₹${total.toLocaleString("en-IN")}`}
                </button>
              </>
            )}

            {ended && (
              <button disabled className="w-full rounded-full bg-slate-800 py-3.5 text-sm font-black text-slate-500 cursor-not-allowed flex items-center justify-center gap-2">
                <AlertCircle size={15} /> Event Has Ended
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}