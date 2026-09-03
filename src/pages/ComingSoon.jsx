export default function ComingSoon({ title }) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-24 text-center">
      <span className="inline-flex rounded-full border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-1.5 text-xs font-medium text-[#10B981]">
        ⚡ Coming Soon
      </span>
      <h1 className="mt-5 text-3xl font-black text-white">{title}</h1>
      <p className="mt-3 text-sm text-slate-400">
        This section is under construction. Check back soon!
      </p>
    </main>
  );
}