import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import { isUserAdmin } from "../adminConfig";
import {
  Shield, Users, MapPin, Package, ShoppingBag, CalendarDays, Trash2, Check, X,
  IndianRupee, TrendingUp, Lock, Loader2,
} from "lucide-react";

const ts = (t) => t?.toMillis?.() || new Date(t || 0).getTime();
const fmtDate = (t) => new Date(ts(t)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "users", label: "Users", icon: Users },
  { id: "venues", label: "Venues", icon: MapPin },
  { id: "listings", label: "Shop Listings", icon: ShoppingBag },
  { id: "orders", label: "Orders", icon: Package },
];

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    const subs = [
      onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "venues"), (s) => setVenues(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "listings"), (s) => setListings(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "orders"), (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "bookings"), (s) => setBookings(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ];
    return () => subs.forEach((u) => u());
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <Lock size={40} className="mx-auto text-red-400" />
        <h1 className="mt-4 text-2xl font-black text-white">403 — Admins Only</h1>
        <p className="mt-2 text-sm text-slate-400">Your account doesn't have admin access. Ask the platform owner to set <code className="text-[#FBBF24]">role: "admin"</code> on your user document in Firestore.</p>
      </main>
    );
  }

  const bookingRevenue = bookings.reduce((s, b) => s + (b.total || 0), 0);
  const orderRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingVenues = venues.filter((v) => v.status === "Pending");
  const sortedUsers = [...users].sort((a, b) => ts(b.createdAt) - ts(a.createdAt));

  const approveVenue = (id) => updateDoc(doc(db, "venues", id), { status: "Approved" });
  const rejectVenue = (id) => updateDoc(doc(db, "venues", id), { status: "Rejected" });
  const removeListing = (id) => deleteDoc(doc(db, "listings", id));
  const setOrderStatus = (id, status) => updateDoc(doc(db, "orders", id), { status });
  const makeAdmin = (id) => updateDoc(doc(db, "users", id), { role: "admin" });
  const deleteUser = (id) => deleteDoc(doc(db, "users", id));

  const STATS = [
    { icon: Users, label: "Total Users", value: users.length, color: "text-blue-400 bg-blue-500/15" },
    { icon: MapPin, label: "Live Venues", value: venues.filter((v) => v.status !== "Pending" && v.status !== "Rejected").length, color: "text-[#10B981] bg-[#10B981]/15" },
    { icon: MapPin, label: "Pending Venues", value: pendingVenues.length, color: "text-[#FBBF24] bg-[#FBBF24]/15" },
    { icon: ShoppingBag, label: "Shop Listings", value: listings.length, color: "text-orange-400 bg-orange-500/15" },
    { icon: CalendarDays, label: "Bookings", value: bookings.length, color: "text-[#10B981] bg-[#10B981]/15" },
    { icon: IndianRupee, label: "Booking Revenue", value: `₹${bookingRevenue.toLocaleString("en-IN")}`, color: "text-[#FBBF24] bg-[#FBBF24]/15" },
    { icon: Package, label: "Orders", value: orders.length, color: "text-blue-400 bg-blue-500/15" },
    { icon: IndianRupee, label: "Order Revenue", value: `₹${orderRevenue.toLocaleString("en-IN")}`, color: "text-[#10B981] bg-[#10B981]/15" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/40"><Shield size={22} className="text-red-400" /></span>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Admin Center</h1>
          <p className="text-sm text-slate-400">Manage users, venues, listings & orders — all live from Firestore.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold border transition-all ${tab === t.id ? "bg-red-500 border-red-500 text-white" : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80"}`}>
            <t.icon size={15} /> {t.label}
            {t.id === "venues" && pendingVenues.length > 0 && <span className="ml-1 rounded-full bg-[#FBBF24] px-2 py-0.5 text-[10px] font-black text-slate-950">{pendingVenues.length}</span>}
          </button>
        ))}
      </div>

      {/* ═══════ OVERVIEW ═══════ */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 flex items-center gap-4">
                <span className={`grid place-items-center w-11 h-11 rounded-xl ${s.color}`}><s.icon size={19} /></span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-xl font-black text-white truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
            <h2 className="font-bold text-white mb-4">🆕 Newest Users</h2>
            <div className="space-y-3">
              {sortedUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3">
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-[#F59E0B] text-xs font-black text-slate-950">{(u.name || "P").slice(0, 2).toUpperCase()}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.phone || u.email}</p>
                  </div>
                  <span className="text-xs text-slate-500">{fmtDate(u.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ USERS ═══════ */}
      {tab === "users" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-400 border-b border-slate-700/60">
              <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Tier</th><th className="px-5 py-3">Points</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Role</th><th className="px-5 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="px-5 py-3 font-bold text-white">{u.name}</td>
                  <td className="px-5 py-3 text-slate-400">{u.phone || u.email}</td>
                  <td className="px-5 py-3 text-[#FBBF24]">{u.tier || "Bronze"}</td>
                  <td className="px-5 py-3 text-slate-300">{(u.points ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-3">{u.role === "admin" ? <span className="rounded-full bg-red-500/15 border border-red-500/40 px-2.5 py-1 text-[10px] font-bold text-red-400">ADMIN</span> : <span className="text-slate-500">player</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {u.role !== "admin" && (
                        <button onClick={() => makeAdmin(u.id)} title="Make admin" className="p-2 rounded-full text-[#FBBF24] hover:bg-[#FBBF24]/10"><Shield size={14} /></button>
                      )}
                      <button onClick={() => deleteUser(u.id)} title="Delete user" className="p-2 rounded-full text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════ VENUES ═══════ */}
      {tab === "venues" && (
        <div className="space-y-4">
          {pendingVenues.length > 0 && (
            <h2 className="text-sm font-black tracking-widest text-[#FBBF24]">⏳ AWAITING APPROVAL</h2>
          )}
          {pendingVenues.map((v) => (
            <div key={v.id} className="rounded-2xl border border-[#FBBF24]/40 bg-[#FBBF24]/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-white">{v.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{v.address} · {v.sports?.join(", ")} · ₹{v.price}/hr</p>
                <p className="text-[11px] text-slate-500 mt-1">By {v.ownerName || "Unknown owner"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveVenue(v.id)} className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981] hover:bg-[#059669] px-4 py-2 text-xs font-bold text-slate-950"><Check size={13} /> Approve</button>
                <button onClick={() => rejectVenue(v.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"><X size={13} /> Reject</button>
              </div>
            </div>
          ))}

          <h2 className="text-sm font-black tracking-widest text-slate-500 pt-4">ALL VENUES</h2>
          {venues.filter((v) => v.status !== "Pending").map((v) => (
            <div key={v.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-white">{v.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{v.address} · ₹{v.price}/hr</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${v.status === "Rejected" ? "bg-red-500/15 text-red-400" : "bg-[#10B981]/15 text-[#10B981]"}`}>{v.status || "Approved"}</span>
              <button onClick={() => deleteDoc(doc(db, "venues", v.id))} className="p-2 rounded-full text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ LISTINGS ═══════ */}
      {tab === "listings" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.length === 0 && <p className="text-sm text-slate-400 col-span-3">No seller listings yet. When users list gear in Shop → Sell, it appears here.</p>}
          {listings.map((l) => (
            <article key={l.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 overflow-hidden">
              <div className="h-36 bg-slate-100">
                {l.img ? <img src={l.img} alt={l.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-400"><Package size={24} /></div>}
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-white">{l.name}</h3>
                <p className="text-xs text-slate-500">{l.category} · {l.condition} · by {l.sellerName}</p>
                <div className="flex items-center justify-between pt-2">
                  <p className="font-black text-[#FBBF24]">₹{Number(l.price).toLocaleString("en-IN")}</p>
                  <button onClick={() => removeListing(l.id)} className="p-2 rounded-full text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ═══════ ORDERS ═══════ */}
      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-sm text-slate-400">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-white">{o.items?.map((i) => `${i.name} ×${i.qty}`).join(", ")}</h3>
                <p className="text-xs text-slate-500 mt-1">#{o.id.slice(0, 6).toUpperCase()} · {o.address?.name} · {o.address?.city}</p>
              </div>
              <p className="font-black text-white">₹{o.total?.toLocaleString("en-IN")}</p>
              <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)}
                className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer">
                {["Processing", "Out for Delivery", "Delivered", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}