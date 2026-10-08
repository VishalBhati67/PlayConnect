import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDocs, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { MapPin, CalendarDays, Clock, Users, CheckCircle2, CreditCard, Smartphone, WalletCards, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

const SEED_GAMES = [
{ title:"Mumbai Evening 5v5 Football",sport:"Football",venue:"Andheri Sports Turf",city:"Andheri, Mumbai",date:"Today",time:"7:30 PM",needed:10,joinedBy:[],fee:"₹100" },
{ title:"Bandra Cricket Nets",sport:"Cricket",venue:"Bandra Cricket Ground",city:"Bandra, Mumbai",date:"Tomorrow",time:"6:30 AM",needed:6,joinedBy:[],fee:"Free" },
{ title:"Navi Mumbai Badminton Doubles",sport:"Badminton",venue:"Nerul Sports Academy",city:"Nerul, Navi Mumbai",date:"Tomorrow",time:"8:00 PM",needed:4,joinedBy:[],fee:"₹150" },
{ title:"Powai 3v3 Basketball Run",sport:"Basketball",venue:"Hoop City Arena",city:"Powai, Mumbai",date:"Sat, 10 Oct",time:"5:00 PM",needed:6,joinedBy:[],fee:"₹80" },
{ title:"Worli Tennis Rally",sport:"Tennis",venue:"Worli Tennis Club",city:"Worli, Mumbai",date:"Sun, 11 Oct",time:"7:00 AM",needed:2,joinedBy:[],fee:"₹200" },
{ title:"Vashi Volleyball 6v6",sport:"Volleyball",venue:"Vashi Sports Complex",city:"Vashi, Navi Mumbai",date:"Mon, 12 Oct",time:"7:00 PM",needed:12,joinedBy:[],fee:"₹100" },
];
const money = (value) => Number(String(value || "").replace(/[^0-9]/g, "")) || 0;

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game,setGame] = useState(null); const [loading,setLoading] = useState(true);
  const [payment,setPayment] = useState("upi"); const [booking,setBooking] = useState(false); const [done,setDone] = useState(false); const [error,setError] = useState("");
  useEffect(() => {
    const unsub = onSnapshot(collection(db,"games"), (snap) => {
      const remote = snap.docs.map((d) => ({id:d.id,...d.data()})); const decoded = decodeURIComponent(id || "");
      const found = remote.find((g) => g.id === decoded) || remote.find((g) => g.title === decoded);
      const fallback = SEED_GAMES.map((g) => ({...g,id:"local-"+g.title})).find((g) => g.id === decoded || g.title === decoded);
      setGame(found || fallback || null); setLoading(false);
    }, () => { const decoded=decodeURIComponent(id || ""); setGame(SEED_GAMES.map((g)=>({...g,id:"local-"+g.title})).find((g)=>g.id===decoded || g.title===decoded) || null); setLoading(false); });
    return () => unsub();
  }, [id]);
  const price = useMemo(() => money(game?.fee), [game]); const platformFee = price ? Math.round(price*0.05) : 0; const total = price+platformFee;
  const joined = !!user && game?.joinedBy?.includes(user.uid); const slotsLeft = Math.max(0,(game?.needed||0)-(game?.joinedBy?.length||0));
  const payAndJoin = async () => {
    if (!user) { navigate("/login"); return; } if (!game || joined || slotsLeft<=0) return;
    setBooking(true); setError("");
    try {
      let gameRef = game.id && !game.id.startsWith("local-") ? doc(db,"games",game.id) : null;
      if (!gameRef) { const snap=await getDocs(collection(db,"games")); const remote=snap.docs.find((d)=>d.data().title===game.title); if(remote) gameRef=remote.ref; }
      await addDoc(collection(db,"gameBookings"), { uid:user.uid,gameId:gameRef?.id || game.id,game:game.title,sport:game.sport,venue:game.venue,date:game.date,time:game.time,amount:total,gameFee:price,platformFee,paymentMethod:payment,paymentStatus:payment==="cash" ? "Pay at venue" : "Pending gateway payment",bookingStatus:payment==="cash" ? "Confirmed" : "Awaiting payment",createdAt:serverTimestamp() });
      if (gameRef) await updateDoc(gameRef,{joinedBy:arrayUnion(user.uid)});
      setDone(true);
    } catch(err) { console.error(err); setError("Booking could not be saved. Check your Firebase permissions and try again."); } finally { setBooking(false); }
  };
  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="animate-spin text-[#10B981]" size={38}/></div>;
  if (!game) return <main className="max-w-xl mx-auto px-4 py-24 text-center"><h1 className="text-2xl font-black text-white">Game not found</h1><Link to="/games" className="mt-4 inline-flex text-sm font-bold text-[#10B981]">← Back to Games</Link></main>;
  if (done) return <main className="max-w-2xl mx-auto px-4 py-20 text-center"><CheckCircle2 size={64} className="mx-auto text-[#10B981]"/><h1 className="mt-6 text-3xl font-black text-white">Game booking created 🎉</h1><p className="mt-3 text-sm text-slate-400">{payment==="cash" ? "Your slot is confirmed. Pay the venue when you arrive." : "Your booking is saved. Online collection requires a payment gateway connection."}</p><div className="mt-7 flex justify-center gap-3"><Link to="/dashboard" className="rounded-full bg-[#10B981] px-6 py-3 text-sm font-bold text-slate-950">Go to Dashboard</Link><Link to="/games" className="rounded-full border border-slate-700 px-6 py-3 text-sm font-bold text-white">Find More Games</Link></div></main>;
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
    <button onClick={()=>navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><ArrowLeft size={15}/> Back</button>
    <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-7">
      <section className="space-y-5"><div className="rounded-3xl border border-[#10B981]/20 bg-gradient-to-br from-[#10251f] via-slate-900 to-slate-950 p-7 md:p-9"><span className="rounded-full bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 text-[10px] font-black uppercase text-[#6EE7B7]">{game.sport}</span><h1 className="mt-5 text-3xl md:text-5xl font-black text-white">{game.title}</h1><div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm text-slate-300"><p className="flex gap-2 items-center"><MapPin className="text-[#10B981]" size={17}/>{game.venue}, {game.city}</p><p className="flex gap-2 items-center"><CalendarDays className="text-[#FBBF24]" size={17}/>{game.date}</p><p className="flex gap-2 items-center"><Clock className="text-[#FBBF24]" size={17}/>{game.time}</p><p className="flex gap-2 items-center"><Users className="text-blue-400" size={17}/>{game.joinedBy?.length||0}/{game.needed} players joined</p></div></div><div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6"><h2 className="font-black text-white">What you get</h2><div className="mt-4 grid sm:grid-cols-2 gap-3">{["Reserved player slot","Venue & game details","Match-day coordination","Player community access"].map(x=><div key={x} className="rounded-xl bg-slate-950/60 p-4 text-xs font-bold text-slate-300">✓ {x}</div>)}</div></div></section>
      <aside className="lg:sticky lg:top-24 h-fit rounded-3xl border border-slate-700/60 bg-slate-900/90 p-6 shadow-2xl"><h2 className="text-xl font-black text-white">Join this game</h2><div className="mt-4 flex justify-between text-sm text-slate-400"><span>Game fee</span><b className="text-white">{price ? "₹"+price : "Free"}</b></div>{price>0 && <div className="mt-2 flex justify-between text-sm text-slate-400"><span>Platform fee</span><b className="text-white">₹{platformFee}</b></div>}<div className="my-4 border-t border-slate-800 pt-4 flex justify-between"><span className="font-bold text-white">Total</span><b className="text-xl text-[#FBBF24]">{total ? "₹"+total : "Free"}</b></div>
      <p className="text-xs font-bold text-slate-400 mb-2">Choose payment method</p><div className="space-y-2">{[["upi","UPI / QR","Pay with any UPI app",Smartphone],["card","Debit / Credit Card","Secure online payment",CreditCard],["cash","Pay at Venue","Pay the venue on arrival",WalletCards]].map(([value,label,desc,Icon])=><button key={value} onClick={()=>setPayment(value)} className={"w-full flex items-center gap-3 rounded-xl border p-3 text-left "+(payment===value?"border-[#10B981] bg-[#10B981]/10":"border-slate-700 bg-slate-950/50")}><Icon size={18} className={payment===value?"text-[#10B981]":"text-slate-500"}/><span className="flex-1"><b className="block text-xs text-white">{label}</b><small className="text-[10px] text-slate-500">{desc}</small></span>{payment===value && <CheckCircle2 size={15} className="text-[#10B981]"/>}</button>)}</div>
      {payment!=="cash" && <div className="mt-3 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-3 text-[10px] text-[#FBBF24]"><ShieldCheck size={13} className="inline mr-1"/> Online payment gateway must be connected before money is actually collected.</div>}{error && <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">{error}</p>}
      <button onClick={payAndJoin} disabled={booking||joined||slotsLeft<=0} className="mt-5 w-full rounded-xl bg-[#10B981] px-5 py-3.5 text-sm font-black text-slate-950 disabled:opacity-50">{booking?"Processing…":joined?"Already Joined":slotsLeft<=0?"Game Full":payment==="cash"?"Confirm & Join":"Continue to "+(payment==="upi"?"UPI":"Card")+" Payment"}</button><p className="mt-3 text-[10px] text-slate-600 text-center">By joining, you agree to the game rules and PlayConnect terms.</p></aside>
    </div></main>;
}