const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="h-px flex-1 bg-neutral-200" />
    {label && <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 shrink-0">{label}</span>}
    <span className="h-px flex-1 bg-neutral-200" />
  </div>
);

export default SectionDivider;
