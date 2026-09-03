import { Link } from "react-router-dom";

/* Inline brand icons (newer lucide-react versions removed brand icons) */
const InstagramIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const XIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 8-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const COLUMNS = [
  {
    title: "Platform",
    links: [["Venues", "/venues"], ["Events", "/events"], ["Games", "/games"], ["Shop", "/shop"]],
  },
  {
    title: "Company",
    links: [["Sponsors", "/sponsors"], ["Community", "/community"], ["Affiliate Program", "/sponsors"], ["Dashboard", "/dashboard"]],
  },
  {
    title: "Legal",
    links: [["Privacy Policy", "#"], ["Terms of Service", "#"]],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#070C18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="col-span-2 space-y-4">
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="public/assets/playconnect-logo.png"
              alt="PlayConnect"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            The operating system for sports — discover venues, book games, join tournaments and connect with players near you.
          </p>
          <div className="flex gap-2.5">
            {[InstagramIcon, FacebookIcon, XIcon].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold text-white mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-[#10B981] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© 2026 PlayConnect. All rights reserved.</p>
          <p>Built for the sports community ⚡</p>
        </div>
      </div>
    </footer>
  );
}