import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText, Lock, Users, CreditCard, UserCheck, AlertTriangle } from "lucide-react";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "YOUR DATA. YOUR CONTROL.",
    icon: ShieldCheck,
    intro: "This page explains how PlayConnect may collect, use, and protect information when you use the platform.",
    sections: [
      ["Information We Collect", "We may collect information you provide when creating an account or using features such as games, venue bookings, events, purchases, and community tools. This can include your name, contact details, profile information, and activity needed to provide the service."],
      ["How We Use Information", "We use information to operate PlayConnect, authenticate users, process bookings or registrations, personalize the experience, communicate important updates, improve features, prevent misuse, and maintain platform security."],
      ["Account & Authentication", "PlayConnect may use third-party authentication services such as Google or Firebase phone authentication. Authentication information is handled through the applicable provider and used to securely sign you in."],
      ["Payments & Transactions", "Where transactions are supported, payment-related information may be processed by the payment provider used for that transaction. PlayConnect should not require you to share payment credentials directly through ordinary profile or community forms."],
      ["Sharing of Information", "We do not intend to sell your personal information. Information may be shared with service providers or other users when necessary to provide a feature, complete a transaction, operate the platform, or comply with applicable law."],
      ["Data Security", "We use reasonable technical and organizational measures designed to protect information. No internet service can guarantee absolute security, so please use a strong password and avoid sharing account credentials."],
      ["Your Choices", "You may review or update available profile information through your account features. If you want to request deletion or have a privacy question, contact the PlayConnect team through the contact method provided by the platform."],
      ["Children", "PlayConnect is intended for users who can legally use the services in their jurisdiction. If you believe a minor has provided personal information improperly, contact the platform so the situation can be reviewed."],
      ["Changes", "This policy may be updated as PlayConnect evolves. Material changes should be reflected on this page with an updated date."],
    ],
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "PLAY FAIR. PLAY RESPONSIBLY.",
    icon: FileText,
    intro: "These terms describe the basic rules for using PlayConnect and its sports, venue, event, commerce, and community features.",
    sections: [
      ["Using PlayConnect", "You agree to use PlayConnect lawfully and responsibly. You must not misuse the platform, interfere with its operation, impersonate another person, or use the service for fraudulent or harmful activity."],
      ["Accounts", "You are responsible for maintaining access to your account and for activity performed through it. Provide accurate information where required and notify the platform if you believe your account has been compromised."],
      ["Games & Community", "When joining or creating games, treat other players respectfully and follow the rules of the relevant venue or organizer. PlayConnect may remove content, games, or accounts that violate platform rules or create safety concerns."],
      ["Venues & Bookings", "Venue availability, pricing, operating hours, facilities, and cancellation rules may vary by venue. Users should review the details shown before confirming a booking. Venue-specific rules remain applicable."],
      ["Events & Registrations", "Event organizers may set their own eligibility, schedules, capacity, ticketing, cancellation, and participation rules. PlayConnect may display event information but is not automatically the organizer of every listed event."],
      ["Shop & Orders", "Product availability, pricing, delivery, returns, and order fulfillment may depend on the applicable seller or service provider. Do not treat a product listing as a guarantee that inventory or delivery will remain available."],
      ["Payments & Refunds", "Any payment, refund, cancellation, or fee terms shown at checkout or supplied by the relevant provider apply to that transaction. Do not attempt to bypass payment controls or manipulate transaction records."],
      ["User Content", "You are responsible for content you submit, including profiles, comments, listings, and community posts. Do not submit unlawful, abusive, deceptive, hateful, infringing, or malicious content."],
      ["Safety", "Sports activities involve physical risk. Use appropriate equipment, follow venue instructions, and participate within your abilities. PlayConnect does not replace professional medical, coaching, or safety advice."],
      ["Availability & Changes", "Features may change, be temporarily unavailable, or be discontinued as the platform develops. We may update these terms when necessary."],
    ],
  },
};

export default function Legal() {
  const { type } = useParams();
  const data = CONTENT[type] || CONTENT.privacy;
  const Icon = data.icon;

  return (
    <main className="relative overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,.16),transparent_58%)]" />
      <div className="pointer-events-none absolute -right-32 top-24 h-80 w-80 rounded-full bg-[#F59E0B]/5 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8">
        <Link to="/" className="hero-enter inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back to PlayConnect
        </Link>

        <section className="hero-enter-delay mt-8 overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-900/75 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] shadow-lg shadow-[#10B981]/10">
              <Icon size={30} />
            </div>
            <div>
              <p className="text-xs font-black tracking-[.22em] text-[#10B981]">{data.eyebrow}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">{data.title}</h1>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{data.intro}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [Lock, "Secure by design"],
            [Users, "Community first"],
            [UserCheck, "Responsible use"],
          ].map(([I, label], i) => (
            <div key={label} className="hero-enter-delay-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <I size={18} className="text-[#10B981]" />
              <p className="mt-2 text-sm font-bold text-white">{label}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 space-y-4">
          {data.sections.map(([heading, body], i) => (
            <article key={heading} className="route-stage rounded-2xl border border-slate-800/80 bg-[#0B1120]/80 p-6 transition-all hover:-translate-y-0.5 hover:border-slate-700 md:p-7">
              <div className="flex gap-4">
                <span className="mt-0.5 text-xs font-black text-[#10B981]">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="text-lg font-black text-white">{heading}</h2>
                  <p className="mt-2 leading-7 text-slate-400">{body}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm leading-6 text-slate-400">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <p>This is general platform information, not legal advice. Before launching PlayConnect commercially, have the final privacy policy and terms reviewed for the laws and jurisdictions in which you operate.</p>
        </div>
      </div>
    </main>
  );
}
