import useScrollReveal from '../../../../hooks/useScrollReveal';

const STATS = [
  { value: "43", label: "Barangays Covered" },
  { value: "3 in 1", label: "Unified Clearances" },
  { value: "24/7", label: "Application Submission" },
];

export default function Stats() {
  const ref = useScrollReveal();

  return (
    <section className="bg-[#0f3320] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(-60deg, transparent, transparent 30px, rgba(255,255,255,0.02) 30px, rgba(255,255,255,0.02) 31px)" }} />
      <div ref={ref} className="reveal-block relative z-[1] max-w-[1200px] mx-auto px-10 grid grid-cols-3 max-[768px]:grid-cols-2 max-[768px]:px-6 max-[480px]:grid-cols-2">
        {STATS.map(({ value, label }) => (
          <div key={label} className="landing-stat relative px-8 py-11 text-center
            after:content-[''] after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px
            after:[background:linear-gradient(to_bottom,transparent,rgba(255,255,255,0.1),transparent)] last:after:hidden">
            <div className="landing-stat-value font-archivo text-[clamp(32px,4vw,48px)] text-brand-amber leading-none mb-[10px] tracking-[-0.02em]">
              {value}
            </div>
            <div className="font-jakarta text-[13.5px] text-white/50 font-medium tracking-[0.03em] uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
