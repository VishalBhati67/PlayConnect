import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
import {
  ShoppingCart, Receipt, MapPin, Tag, Wallet, CreditCard, Lock,
  Trash2, CheckCircle2, Loader2, PartyPopper,
} from "lucide-react";

const priceNum = (p) => Number(String(p.price).replace(/[^\d]/g, "")) || 0;

const COUPONS = {
  PLAY10: { label: "10% off (max ₹300)", calc: (sub) => Math.min(300, Math.round(sub * 0.1)) },
  PC50: { label: "Flat ₹50 off", calc: () => 50 },
};

export default function Cart() {
  const { items, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(null); // holds order id on success

  /* ── Delivery address ───────────────────────────── */
  const [addr, setAddr] = useState({
    name: user?.name || "",
    full: "",
    city: "",
    pin: "",
    phone: (user?.phone || "").replace("+91", ""),
  });

  /* ── Coupon + points ────────────────────────────── */
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [pointsUsed, setPointsUsed] = useState(0);

  const grouped = items.reduce((acc, p) => {
    const f = acc.find((x) => x.name === p.name);
    if (f) f.qty += 1; else acc.push({ ...p, qty: 1 });
    return acc;
  }, []);

  const subtotal = grouped.reduce((s, p) => s + priceNum(p) * p.qty, 0);
  const gst = Math.round((subtotal * 18) / 118);
  const platformFee = Math.round(subtotal * 0.05);
  const couponDiscount = coupon ? COUPONS[coupon].calc(subtotal) : 0;
  const availablePoints = user?.points ?? 0;
  const pointsMax = Math.min(availablePoints, Math.max(0, subtotal + platformFee - couponDiscount));
  const safePointsUsed = Math.min(pointsUsed, pointsMax);
  const total = Math.max(0, subtotal + platformFee - couponDiscount - safePointsUsed);

  const applyCoupon = () => {
    const code = codeInput.trim().toUpperCase();
    if (COUPONS[code]) {
      setCoupon(code);
      setCouponMsg(`✅ ${code} applied — ${COUPONS[code].label}`);
    } else {
      setCoupon(null);
      setCouponMsg("❌ Invalid code. Try PLAY10 or PC50.");
    }
  };

  const addressValid = addr.name.trim() && addr.full.trim() && addr.city.trim() && addr.pin.trim().length >= 6 && addr.phone.trim().length === 10;

  /* ── PLACE ORDER ────────────────────────────────── */
  const placeOrder = async () => {
    if (!user) { navigate("/login"); return; }
    setPlacing(true);
    try {
      const ref = await addDoc(collection(db, "orders"), {
        uid: user.uid,
        items: grouped.map(({ name, qty, price }) => ({ name, qty, price })),
        subtotal, platformFee, coupon, couponDiscount,
        pointsUsed: safePointsUsed,
        total,
        address: { ...addr },
        status: "Processing",
        createdAt: serverTimestamp(),
      });
      if (safePointsUsed > 0) {
        await updateDoc(doc(db, "users", user.uid), { points: increment(-safePointsUsed) });
      }
      clear();
      setDone(ref.id);
    } catch (err) {
      console.error(err);
    } finally {
      setPlacing(false);
    }
  };

  /* ── SUCCESS SCREEN ─────────────────────────────── */
  if (done) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <PartyPopper size={56} className="mx-auto text-[#FBBF24]" />
        <h1 className="mt-6 text-3xl font-black text-white">Payment Successful! 🎉</h1>
        <p className="mt-3 text-sm text-slate-400">
          Order <span className="font-mono text-[#10B981]">#{done.slice(0, 6).toUpperCase()}</span> is confirmed and Processing.
          {safePointsUsed > 0 && <> {safePointsUsed} PC Points redeemed.</>}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/dashboard" className="rounded-full bg-[#10B981] hover:bg-[#059669] px-6 py-3 text-sm font-bold text-slate-950 transition-all">Track Order</Link>
          <Link to="/shop" className="rounded-full border border-slate-700 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800/80 transition-all">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  /* ── EMPTY CART ─────────────────────────────────── */
  if (items.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShoppingCart size={48} className="mx-auto text-slate-600" />
        <h1 className="mt-6 text-2xl font-black text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-400">Add gear from the Shop to checkout.</p>
        <Link to="/shop" className="mt-8 inline-block rounded-full bg-[#10B981] hover:bg-[#059669] px-7 py-3 text-sm font-bold text-slate-950 transition-all">Browse Shop</Link>
      </main>
    );
  }

  /* ── CHECKOUT ───────────────────────────────────── */
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Checkout</h1>
        <p className="text-sm text-slate-400 mt-1">{items.length} item{items.length > 1 ? "s" : ""} in your cart</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ═════════ LEFT COLUMN ═════════ */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order Items */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6">
            <h2 className="flex items-center gap-2 font-bold text-white mb-5">
              <ShoppingCart size={17} /> Order Items
            </h2>
            <div className="space-y-5">
              {grouped.map((p) => (
                <div key={p.name} className="flex items-center gap-4">
                  <img src={p.img} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{p.category?.toLowerCase()} · equipment · by PlayConnect</p>
                    <p className="text-sm font-bold text-[#FBBF24] mt-1">
                      ₹{priceNum(p).toLocaleString("en-IN")} <span className="text-xs text-slate-500 font-medium">× {p.qty}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-white">₹{(priceNum(p) * p.qty).toLocaleString("en-IN")}</p>
                    <button onClick={() => remove(p.name)} aria-label={`Remove ${p.name}`} className="mt-2 p-1.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Address */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="flex items-center gap-2 font-bold text-white"><MapPin size={17} /> Delivery Address</h2>
              <span className="text-[11px] font-bold text-red-400">* Required</span>
            </div>
            <div className="space-y-4">
              <input value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} placeholder="Full Name"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]" />
              <input value={addr.full} onChange={(e) => setAddr({ ...addr, full: e.target.value })} placeholder="Full Address (House No, Street, Area) *"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]" />
              <div className="grid grid-cols-2 gap-4">
                <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City *"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]" />
                <input value={addr.pin} onChange={(e) => setAddr({ ...addr, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="PIN Code *"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]" />
              </div>
              <input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Phone Number *"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]" />
            </div>
          </section>
        </div>

        {/* ═════════ RIGHT COLUMN — ORDER SUMMARY ═════════ */}
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6 space-y-4 lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 font-bold text-white"><Receipt size={17} /> Order Summary</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-bold text-white">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-slate-500 -mt-1">Includes GST ₹{gst.toLocaleString("en-IN")}</p>
              <div className="flex justify-between text-slate-300">
                <span>Platform Fee (5%)</span>
                <span className="font-bold text-white">₹{platformFee.toLocaleString("en-IN")}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#10B981]">
                  <span>Coupon ({coupon})</span>
                  <span className="font-bold">-₹{couponDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {safePointsUsed > 0 && (
                <div className="flex justify-between text-[#10B981]">
                  <span>PC Points</span>
                  <span className="font-bold">-₹{safePointsUsed.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><Lock size={12} /> Delivery</span>
                <span className="font-bold text-[#10B981]">FREE</span>
              </div>
            </div>

            {/* Offers & Coupons */}
            <div className="border-t border-slate-700/60 pt-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Tag size={14} className="text-[#FBBF24]" /> Offers & Coupons</p>
              <div className="flex gap-2">
                <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Enter code"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]" />
                <button onClick={applyCoupon} className="rounded-full border border-[#10B981] px-5 py-2.5 text-sm font-bold text-[#10B981] hover:bg-[#10B981]/10 transition-colors">
                  Apply
                </button>
              </div>
              {couponMsg && <p className="text-xs mt-2 text-slate-400">{couponMsg}</p>}
            </div>

            {/* PC Points slider */}
            <div className="rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#FBBF24]">Use PC Points ({availablePoints} available)</span>
                <span className="text-white">-₹{safePointsUsed.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range" min="0" max={pointsMax} value={safePointsUsed}
                onChange={(e) => setPointsUsed(Number(e.target.value))}
                disabled={pointsMax === 0}
                className="w-full mt-3 accent-[#FBBF24] disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0 pts</span><span>{safePointsUsed} pts used</span>
              </div>
              {!user && <p className="text-[10px] text-slate-500 mt-2">Sign in to use PC Points.</p>}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center border-t border-slate-700/60 pt-4">
              <span className="text-lg font-black text-white">Total</span>
              <span className="text-2xl font-black text-[#FBBF24]">₹{total.toLocaleString("en-IN")}</span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold"><CreditCard size={13} /> Pay Online</p>

            <button
              onClick={placeOrder}
              disabled={placing || !addressValid}
              className="w-full rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed py-4 text-base font-black text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-[#F59E0B]/25"
            >
              {placing ? <span className="inline-flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Processing…</span> : `Pay ₹${total.toLocaleString("en-IN")}`}
            </button>
            {!addressValid && <p className="text-[11px] text-slate-500 text-center">Fill all * address fields to enable payment.</p>}

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Lock size={11} /> Secured by Razorpay · PCI-DSS Compliant
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}