import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../store/AuthContext";
import {
  MapPin, BadgeCheck, Pencil, BarChart3, Users, History, CalendarDays, Wallet,
  Settings, LogOut, ChevronRight, Trophy, Flame, Award, Loader2, CheckCircle2,
} from "lucide-react";

const SKILLS = ["Beginner", "Intermediate", "Advanced", "Pro"];
const ROLES = ["All Rounder", "Batsman", "Bowler", "Striker", "Defender", "Goalkeeper"];
const TIMES = ["Anytime", "Morning", "Evening", "Weekends"];

function Row({ label, value, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-4 border-b border-slate-800 last:border-0 text-left hover:bg-slate-800/30 rounded-lg px-2 transition-colors">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-slate-400 mt-1">{value || "Not specified"}</p>
      </div>
      <ChevronRight size={16} className="text-slate-500" />
    </button>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(null);

  const displayName = user?.name || "Player";
  const initials = displayName.slice(0, 2).toUpperCase();

  const startEdit = () => {
    setForm({
      name: user?.name || "",
      city: user?.city || "",
      neighborhood: user?.neighborhood || "",
      age: user?.age || "",
      sex: user?.sex || "",
      height: user?.height || "",
      skill: user?.skill || "",
      role: user?.role2 || "",
      sports: user?.sports?.join(", ") || "",
      preferredTime: user?.preferredTime || "Anytime",
    });
    setEditing(true);
    setSaved(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name,
        city: form.city,
        neighborhood: form.neighborhood,
        age: form.age,
        sex: form.sex,
        height: form.height,
        skill: form.skill,
        role2: form.role,
        sports: form.sports.split(",").map((s) => s.trim()).filter(Boolean),
        preferredTime: form.preferredTime,
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-3 gap-8">
      {/* ═════════ LEFT COLUMN ═════════ */}
      <div className="space-y-6">
        {/* Profile card */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-8 text-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-[#10B981]/60 shadow-xl" />
          ) : (
            <span className="grid place-items-center w-32 h-32 mx-auto rounded-full bg-pink-600 text-5xl font-black text-white border-4 border-[#10B981]/60 shadow-xl">
              {initials}
            </span>
          )}
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 px-3 py-1 text-xs font-bold text-[#10B981]">
            <BadgeCheck size={13} /> Verified
          </span>
          <h1 className="mt-3 text-2xl font-black text-white">{displayName}</h1>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <MapPin size={13} /> {user?.city || "Unknown City"}
          </p>
          <button onClick={startEdit} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 py-3 text-sm font-bold text-white transition-colors">
            <Pencil size={14} /> Edit Profile
          </button>
        </div>

        {/* Menu */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-4">
          <p className="px-3 pb-2 text-[11px] font-black tracking-widest text-slate-500">MENU</p>
          {[
            { icon: BarChart3, label: "Overview", onClick: () => setEditing(false) },
            { icon: Users, label: "My Teams", onClick: () => navigate("/games") },
            { icon: History, label: "Game History", onClick: () => navigate("/dashboard") },
            { icon: CalendarDays, label: "My Bookings", onClick: () => navigate("/dashboard") },
            { icon: Wallet, label: "Orders & Wallet", onClick: () => navigate("/dashboard") },
            { icon: Settings, label: "Settings", onClick: startEdit },
          ].map((m, i) => (
            <button key={m.label} onClick={m.onClick}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${i === 0 && !editing ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
              <m.icon size={16} /> {m.label}
            </button>
          ))}
          <div className="my-2 h-px bg-slate-800" />
          <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* ═════════ RIGHT COLUMN ═════════ */}
      <div className="lg:col-span-2 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Trophy, color: "text-[#10B981] bg-[#10B981]/15", label: "Win Rate", value: `${user?.winRate ?? "0.0"}%` },
            { icon: Award, color: "text-blue-400 bg-blue-500/15", label: "Avg Rating", value: user?.avgRating ?? 4.7 },
            { icon: Flame, color: "text-orange-400 bg-orange-500/15", label: "Streak Days", value: user?.streak ?? 12 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-5 flex items-center gap-4">
              <span className={`grid place-items-center w-11 h-11 rounded-xl ${s.color}`}><s.icon size={20} /></span>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {saved && (
          <p className="flex items-center gap-2 text-sm font-bold text-[#10B981]"><CheckCircle2 size={16} /> Profile updated successfully!</p>
        )}

        {/* ── EDIT MODE ── */}
        {editing ? (
          <div className="rounded-2xl border border-[#10B981]/40 bg-slate-900/80 backdrop-blur-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#10B981]">✏️ Edit Profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="text-xs font-semibold text-slate-400">Full Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputCls} mt-1.5`} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">City</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Jaipur" className={`${inputCls} mt-1.5`} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Neighborhood</span><input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Mansarovar" className={`${inputCls} mt-1.5`} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Age</span><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={`${inputCls} mt-1.5`} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Sex</span>
                <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className={`${inputCls} mt-1.5 cursor-pointer`}>
                  <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Height (cm)</span><input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={`${inputCls} mt-1.5`} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Skill Level</span>
                <select value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} className={`${inputCls} mt-1.5 cursor-pointer`}>
                  <option value="">Select…</option>{SKILLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Playing Role</span>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${inputCls} mt-1.5 cursor-pointer`}>
                  <option value="">Select…</option>{ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-400">Sports Interested In (comma separated)</span><input value={form.sports} onChange={(e) => setForm({ ...form, sports: e.target.value })} placeholder="Cricket, Football" className={`${inputCls} mt-1.5`} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-400">Preferred Time</span>
                <select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className={`${inputCls} mt-1.5 cursor-pointer`}>
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveProfile} disabled={saving} className="flex-1 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 py-3 text-sm font-bold text-slate-950 transition-all">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "💾 Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-full border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {/* Basic info */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6">
              <p className="text-xs font-black tracking-widest text-slate-500 mb-2">BASIC INFORMATION</p>
              <Row label="Sports Interested In" value={user?.sports?.join(", ")} onClick={startEdit} />
              <Row label="Skill Level" value={user?.skill} onClick={startEdit} />
              <Row label="My Neighborhood" value={user?.neighborhood} onClick={startEdit} />
              <Row label="Age" value={user?.age} onClick={startEdit} />
              <Row label="Sex" value={user?.sex} onClick={startEdit} />
              <p className="text-xs font-black tracking-widest text-slate-500 mt-6 mb-2">PHYSICAL INFORMATION</p>
              <Row label="Height" value={user?.height ? `${user.height} cm` : ""} onClick={startEdit} />
              <Row label="Playing Role" value={user?.role2} onClick={startEdit} />
              <p className="text-xs font-black tracking-widest text-slate-500 mt-6 mb-2">PLAYER PREFERENCES</p>
              <Row label="Age Range" value="Open to all" onClick={startEdit} />
              <Row label="Maximum Distance" value="Open" onClick={startEdit} />
              <Row label="Preferred Time" value={user?.preferredTime || "Anytime"} onClick={startEdit} />
            </div>

            {/* Achievements */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md p-6">
              <h2 className="text-lg font-bold text-white mb-4">Achievements</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Award, color: "text-[#FBBF24]", title: "Century Club", sub: "100 games played" },
                  { icon: Flame, color: "text-orange-400", title: "Streak Master", sub: "7-day streak" },
                  { icon: Trophy, color: "text-blue-400", title: "Champion", sub: "Won a tournament" },
                ].map((a) => (
                  <div key={a.title} className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-5 text-center">
                    <a.icon size={22} className={`mx-auto ${a.color}`} />
                    <p className="mt-3 text-sm font-bold text-white">{a.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{a.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}