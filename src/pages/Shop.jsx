import { useState, useEffect } from "react";
import { ShoppingCart, DollarSign, Key, Star, X, Check, Package, Award, Shield, Camera, Image as ImageIcon } from "lucide-react";
import { useCart } from "../store/CartContext";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const onImgError = (e) => { e.currentTarget.style.display = "none"; };

/* compress photo so it fits Firestore's 1MB limit */
const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 500 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

/* ─────────────────────────── BUY data (19 products) ───────────── */
const BUY_CATEGORIES = ["All", "Balls", "Rackets & Bats", "Protective Gear", "Accessories"];

const BUY_PRODUCTS = [
  { name: "Pro Match Soccer Ball", category: "Balls", price: "₹799", tag: "New", desc: "FIFA Quality Pro certified · 32-panel design · Hand-stitched PU leather · Size 5", img: IMG("photo-1519861531473-9200262188bf"), icon: Package },
  { name: "Indoor Basketball", category: "Balls", price: "1,150", desc: "Composite leather cover · Deep channel design · Official size 7", img: IMG("photo-1554068865-24cecd4e34b8"), icon: Package },
  { name: "Official Volleyball", category: "Balls", price: "₹650", desc: "Soft-touch synthetic leather · 18-panel construction · Official weight", img: IMG("photo-1593766827228-8737b1fcd8fa"), icon: Package },
  { name: "Tennis Balls (Pack of 3)", category: "Balls", price: "₹380", tag: "New", desc: "ITF approved · Premium felt cover · All-court performance", img: IMG("photo-1517836357463-d25dfeac3438"), icon: Package },
  { name: "Football Pro Strike", category: "Balls", price: "₹999", tag: "New", desc: "Thermally bonded panels · High-visibility print · All-weather grip", img: IMG("photo-1583454110551-21f2fa2afe61"), icon: Package },
  { name: "Outdoor Basketball Pro", category: "Balls", price: "₹1,250", desc: "Rubberized outdoor cover · Extra grip channels · Size 7", img: IMG("photo-1590736969955-71cc94901144"), icon: Package },
  { name: "Cricket Tennis Ball (Pack of 6)", category: "Balls", price: "₹300", desc: "Tape-ball grade · High bounce · Neon green for night matches", img: IMG("photo-1549719386-74dfcbf7dbed"), icon: Package },
  { name: "Cricket Bat — Kashmir Willow", category: "Rackets & Bats", price: "₹2,450", desc: "Grade A Kashmir willow · Short handle · 6 sweet spot grains", img: IMG("photo-1571019613454-1cb2f99b2d8b"), icon: Award },
  { name: "Carbon Badminton Racquet", category: "Rackets & Bats", price: "1,850", tag: "New", desc: "Full carbon fiber frame · Isometric head · 83g weight", img: IMG("photo-1622279457486-62dcc4a431d6"), icon: Award },
  { name: "Pro Lite Tennis Racquet", category: "Rackets & Bats", price: "₹3,499", desc: "Graphite composite · 100 sq in head · Pre-strung at 55 lbs", img: IMG("photo-1534438327276-14e5300c3a48"), icon: Award },
  { name: "Table Tennis Paddle Set", category: "Rackets & Bats", price: "₹750", desc: "2 pro paddles + 3 balls · ITTF approved rubber · Carry case", img: IMG("photo-1546483875-ad9014c88eba"), icon: Award },
  { name: "Hockey Stick Composite", category: "Rackets & Bats", price: "₹1,650", desc: "Carbon-fiber blend · Low kick point · Anti-slip grip", img: IMG("photo-1584464491033-06628f3a6b7b"), icon: Award },
  { name: "Boxing / Sports Gloves", category: "Protective Gear", price: "₹1,200", desc: "Genuine leather · Multi-layer foam padding · Velcro wrist strap", img: IMG("photo-1518611012118-696072aa579a"), icon: Shield },
  { name: "Football Shin Guards", category: "Protective Gear", price: "₹450", desc: "PP shell with EVA foam · Ankle protection · Adjustable straps", img: IMG("photo-1579758629938-03607ccdbaba"), icon: Shield },
  { name: "Cricket Helmet with Grill", category: "Protective Gear", price: "₹2,100", desc: "ABS shell · Titanium grill · Ventilated · ISI certified", img: IMG("photo-1538805060514-97d9cc17730c"), icon: Shield },
  { name: "Gym Knee Pads (Pair)", category: "Protective Gear", price: "₹350", desc: "Neoprene sleeve · Gel padding · Non-slip silicone grip", img: IMG("photo-1517963628607-235ccdd5476c"), icon: Shield },
  { name: "Swimming Goggles Pro", category: "Accessories", price: "₹599", tag: "New", desc: "Anti-fog coating · UV protection · Adjustable silicone strap", img: IMG("photo-1593113598332-cd288d649433"), icon: Star },
  { name: "Shuttlecock Tube (10 pcs)", category: "Accessories", price: "₹420", desc: "Grade-A feather · Consistent flight · BWF standard speed 77", img: IMG("photo-1535131749006-b7f58c99034b"), icon: Star },
  { name: "Sports Kit Bag 40L", category: "Accessories", price: "₹899", desc: "Waterproof base · Shoe compartment · Bottle pockets", img: IMG("photo-1485965120184-e220f721d03e"), icon: Star },
];

/* ─────────────────────────── RENT data (14 items) ─────────────── */
const RENT_CATEGORIES = ["All", "Golf & Country Club", "Cycling & Triathlon", "Home Gym & Fitness", "Water Sports", "Mountaineering", "Court Sports", "Combat Sports"];

const RENT_ITEMS = [
  { name: "Tour-Spec Golf Set", brands: "Titleist · Callaway · TaylorMade", category: "Golf & Country Club", price: "₹4,500", desc: "Complete 14-club set · Tour-grade shafts · Premium carry bag", img: IMG("photo-1544161515-4ab6ce6db874") },
  { name: "Golf Launch Monitor & Simulator", brands: "TrackMan · SkyTrak", category: "Golf & Country Club", price: "₹6,000", desc: "Doppler radar tracking · 20+ data points · Indoor/outdoor", img: IMG("photo-1505142468610-359e7d316be0") },
  { name: "Carbon Road Racing Bike", brands: "Specialized · Trek · Cannondale", category: "Cycling & Triathlon", price: "₹3,200", desc: "Full carbon frame · Shimano 105 · 22-speed · 7.8kg", img: IMG("photo-1544551763-46a013bb70d5") },
  { name: "Full-Suspension Mountain Bike", brands: "Santa Cruz · Scott", category: "Cycling & Triathlon", price: "₹3,800", desc: "150mm travel · RockShox suspension · Tubeless ready", img: IMG("photo-1464822759023-fed622ff2c3b") },
  { name: "Studio-Grade Pilates Reformer", brands: "Merrithew · Balanced Body", category: "Home Gym & Fitness", price: "₹2,500", desc: "Commercial-grade · 5 spring resistance · Adjustable footbar", img: IMG("photo-1580746738099-7b4a7f2e5f5f") },
  { name: "Connected AI Treadmill", brands: "Technogym", category: "Home Gym & Fitness", price: "₹3,000", desc: '22" HD touchscreen · Live classes · Auto-incline 0-15%', img: IMG("photo-1558618666-fcd25c85cd64") },
  { name: "4D AI Massage Chair", brands: "Luxury Wellness Brands", category: "Home Gym & Fitness", price: "₹1,800", desc: "Zero-gravity recline · Full-body air massage · Bluetooth", img: IMG("photo-1576678927484-cc907957088c") },
  { name: "Electric Hydrofoil Surfboard (eFoil)", brands: "Lift Foils · Fliteboard", category: "Water Sports", price: "₹7,500", desc: "Carbon board · 2-hour battery · 45km/h · Wireless remote", img: IMG("photo-1517838277536-fc1bf1c0b6b3") },
  { name: "Jet Ski / Personal Watercraft", brands: "Yamaha · Sea-Doo", category: "Water Sports", price: "₹5,500", desc: "150HP · 3-seater · Cruise control · Fuel included", img: IMG("photo-1526506118085-60ce8714f8c5") },
  { name: "Private Swim Lane (1 hr)", brands: "Olympic-size pool", category: "Water Sports", price: "800", desc: "Heated 50m pool · Lane rope reserved · Coach optional", img: IMG("photo-1599058917212-d750089bc07e") },
  { name: "Expedition Mountaineering Kit", brands: "Sub-zero tents · high-altitude gear", category: "Mountaineering", price: "₹4,200", desc: "4-season tent · -40°C bag · Crampons · Ice axe · GPS", img: IMG("photo-1521805103424-d8f8430e8931") },
  { name: "Pro Tennis Ball Machine", brands: "Lobster · Spinfire", category: "Court Sports", price: "₹2,000", desc: "Programmable drills · 150-ball hopper · Remote control", img: IMG("photo-1549476464-37392f717541") },
  { name: "Portable Badminton Court Kit", brands: "BWF-spec mats + net", category: "Court Sports", price: "₹1,500", desc: "Roll-out court mat · Pro net & posts · Setup in 20 min", img: IMG("photo-1534258936925-c58bed479fcb") },
  { name: "Boxing Training Camp Kit", brands: "Ringside gear · heavy bags", category: "Combat Sports", price: "₹3,500", desc: "Heavy bag + stand · Speed bag · Wraps & gloves included", img: IMG("photo-1593508512255-86ab42a8e620") },
];

const SELL_CATEGORIES = ["Balls", "Rackets & Bats", "Protective Gear", "Accessories"];
const CONDITIONS = ["New", "Like New", "Good", "Used"];

/* ─────────────────────────── Page ─────────────────────────── */
export default function Shop() {
  const { add } = useCart();
  const { user } = useAuth();
  const [tab, setTab] = useState("buy");
  const [buyCat, setBuyCat] = useState("All");
  const [rentCat, setRentCat] = useState("All");
  const [requested, setRequested] = useState([]);

  const [form, setForm] = useState({ name: "", category: "Balls", condition: "Good", price: "", img: "" });
  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "listings"), where("sellerUid", "==", user.uid));
    return onSnapshot(q, (s) => setListings(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const buyFiltered = BUY_PRODUCTS.filter((p) => buyCat === "All" || p.category === buyCat);
  const rentFiltered = RENT_ITEMS.filter((r) => rentCat === "All" || r.category === rentCat);

  /* ✅ IMAGE UPLOAD → compressed base64 */
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setForm((f) => ({ ...f, img: compressed }));
  };

  const handleList = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    try {
      await addDoc(collection(db, "listings"), {
        ...form,
        price: Number(form.price),
        sellerUid: user?.uid || "guest",
        sellerName: user?.name || "Guest Seller",
        status: "Active",
        createdAt: serverTimestamp(),
      });
      setForm({ name: "", category: "Balls", condition: "Good", price: "", img: "" });
    } catch (err) { console.error(err); }
  };

  const TABS = [
    { id: "buy", label: "Buy", icon: ShoppingCart, active: "bg-[#10B981] text-slate-950" },
    { id: "sell", label: "Sell", icon: DollarSign, active: "bg-[#F59E0B] text-slate-950" },
    { id: "rent", label: "Rent", icon: Key, active: "bg-blue-500 text-white" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white">🛒 Sports Gear <span className="text-[#10B981]">Marketplace</span></h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">Buy new gear, sell your used equipment, or rent premium gear for a day.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold border transition-all active:scale-95 ${
              tab === t.id ? `${t.active} border-transparent shadow-lg` : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"
            }`}>
            <t.icon size={17} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ BUY ═══════════════ */}
      {tab === "buy" && (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {BUY_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setBuyCat(c)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                  buyCat === c ? "bg-[#10B981] border-[#10B981] text-slate-950" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"
                }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {buyFiltered.map((p) => {
              const Icon = p.icon || Package;
              return (
                <article key={p.name} className="group overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                    <img src={p.img} alt={p.name} loading="lazy" onError={onImgError} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {p.tag && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FBBF24] px-2.5 py-1 text-[10px] font-black text-slate-950 shadow-lg">
                        <Star size={10} fill="currentColor" /> {p.tag}
                      </span>
                    )}
                    <span className="absolute left-3 top-3 grid place-items-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow">
                      <Icon size={14} className="text-slate-700" />
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">{p.desc}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <p className="text-lg font-black text-slate-900">{p.price}</p>
                      <button onClick={() => add(p)} className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981] hover:bg-[#059669] px-4 py-2 text-xs font-bold text-slate-950 transition-all active:scale-95 shadow-lg shadow-[#10B981]/25">
                        <ShoppingCart size={12} /> Add
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════ SELL (with image upload → Firestore) ═══════════════ */}
      {tab === "sell" && (
        <div className="grid lg:grid-cols-3 gap-8">
          <form onSubmit={handleList} className="lg:col-span-1 h-fit rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#F59E0B]">💰 List Your Gear</h2>

            {/* ✅ IMAGE UPLOAD */}
            <div>
              <span className="text-xs font-semibold text-slate-400">Photo</span>
              {form.img ? (
                <div className="relative mt-1.5 rounded-xl overflow-hidden border border-slate-700">
                  <img src={form.img} alt="preview" className="h-36 w-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, img: "" })}
                    className="absolute right-2 top-2 grid place-items-center w-7 h-7 rounded-full bg-slate-950/80 text-white hover:bg-red-500 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="mt-1.5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950/60 px-4 py-6 cursor-pointer hover:border-[#F59E0B] transition-colors">
                  <Camera size={22} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">Upload a photo</span>
                  <span className="text-[10px] text-slate-500">JPG / PNG · auto-compressed for Firestore</span>
                  <input type="file" accept="image/*" onChange={onFile} className="hidden" />
                </label>
              )}
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Item Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., SG Cricket Bat"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F59E0B] cursor-pointer">
                  {SELL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Condition</span>
                <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F59E0B] cursor-pointer">
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Your Price (₹)</span>
              <input type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g., 999"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]" />
            </label>

            <button type="submit" disabled={!form.name.trim() || !form.price}
              className="w-full rounded-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-bold text-slate-950 transition-all active:scale-[0.98]">
              📸 List Item for Sale
            </button>
          </form>

          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-4">Your Listings ({listings.length})</h2>
            {!user ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
                <DollarSign size={28} className="text-slate-600" />
                <p className="text-sm text-slate-400">Please sign in to view and manage your listings.</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
                <DollarSign size={28} className="text-slate-600" />
                <p className="text-sm text-slate-400">No listings yet. Use the form to sell your first item!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {listings.map((l) => (
                  <article key={l.id} className="rounded-2xl bg-white shadow-xl overflow-hidden relative">
                    <div className="relative h-36 bg-slate-100">
                      {l.img ? (
                        <img src={l.img} alt={l.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-slate-400"><ImageIcon size={28} /></div>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-[#F59E0B] px-2.5 py-1 text-[10px] font-black text-slate-950">💰 Your Listing</span>
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="text-sm font-bold text-slate-900">{l.name}</h3>
                      <p className="text-xs text-slate-500">{l.category} · Condition: {l.condition}</p>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-lg font-black text-slate-900">₹{Number(l.price).toLocaleString("en-IN")}</p>
                        <button onClick={() => deleteDoc(doc(db, "listings", l.id))}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">
                          <X size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ RENT ═══════════════ */}
      {tab === "rent" && (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {RENT_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setRentCat(c)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                  rentCat === c ? "bg-blue-500 border-blue-500 text-white" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"
                }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentFiltered.map((r) => {
              const done = requested.includes(r.name);
              return (
                <article key={r.name} className="group overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50">
                  <div className="relative h-48 overflow-hidden">
                    <img src={r.img} alt={r.name} loading="lazy" onError={onImgError} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-lg">{r.category}</span>
                  </div>
                  <div className="space-y-3 p-5">
                    <h3 className="font-bold text-white text-base">{r.name}</h3>
                    <p className="text-xs text-[#FBBF24] font-semibold">{r.brands}</p>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{r.desc}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                      <p className="text-xl font-bold text-blue-400">{r.price}<span className="text-xs text-slate-500 font-medium">/day</span></p>
                      <button onClick={() => setRequested((prev) => (done ? prev.filter((n) => n !== r.name) : [...prev, r.name]))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                          done ? "bg-blue-500/20 border border-blue-500/50 text-blue-400" : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        }`}>
                        {done ? (<><Check size={13} /> Requested</>) : "Book Rental"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}