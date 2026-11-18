import { MapPin, Clock, Phone, Headphones } from "lucide-react";
import LoginBg      from "../../../../assets/login-bg.png";
import AnimatedReveal from '../../../../components/motion/AnimatedReveal';

const CARDS = [
  {
    icon: MapPin,
    color: "text-amber-300",
    title: "Office Location",
    lines: ["Municipal Agriculture Office", "Ground Floor, Sariaya Municipal Hall", "Sariaya, Quezon Province 4322"],
    bg: "bg-amber-400/15 border-amber-400/30",
  },
  {
    icon: Clock,
    color: "text-emerald-300",
    title: "Service Hours",
    lines: ["Monday to Friday", "8:00 AM – 5:00 PM", "Closed on weekends and public holidays"],
    bg: "bg-emerald-400/15 border-emerald-400/30",
  },
  {
    icon: Phone,
    color: "text-sky-300",
    title: "Direct Inquiries",
    lines: [
      { label: "Office: (042) 525-8200", href: "tel:0425258200" },
      { label: "Email: agri@sariaya.gov.ph", href: "mailto:agri@sariaya.gov.ph" },
      { label: "Official Portal: sariaya.gov.ph", href: "https://www.sariaya.gov.ph", external: true },
    ],
    bg: "bg-sky-400/15 border-sky-400/30",
  },
  {
    icon: Headphones,
    color: "text-teal-300",
    title: "Online Permitting",
    lines: ["Permit application: 24/7 online", "Staff review: Regular office hours", "Checkpoint QR scans: Active anytime"],
    bg: "bg-teal-400/15 border-teal-400/30",
  },
];

function ContactCard({ card }) {

  const Icon = card.icon;

  return (
    <AnimatedReveal
      className="landing-card landing-card-dark contact-card-inner bg-white/10 border border-white/20 p-5 rounded-lg box-border w-full">

      <div className="flex items-start gap-4">
        {/* Icon wrap */}
        <div className={`landing-card-icon w-11 h-11 shrink-0 ${card.bg} border rounded-md flex items-center justify-center mt-0.5`}>
          <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <h3 className="font-archivo text-[15px] text-white tracking-tight mb-1">
            {card.title}
          </h3>
          <div className="flex flex-col gap-0.5 text-xs text-white/70">
            {card.lines.map((line, i) => (
              typeof line === "string" ? (
                <p key={i} className="font-jakarta leading-[1.6] m-0">{line}</p>
              ) : (
                <a key={line.href} href={line.href}
                  target={line.external ? "_blank" : undefined}
                  rel={line.external ? "noopener noreferrer" : undefined}
                  className="landing-contact-link font-jakarta leading-[1.6] text-white/80 hover-only:hover:text-white break-words">
                  {line.label}
                </a>
              )
            ))}
          </div>
        </div>
      </div>
    </AnimatedReveal>
  );
}

export default function AboutContact() {

  return (
    <section id="contact-section" className="relative overflow-hidden py-20">

      {/* Background image */}
      <img src={LoginBg} alt="" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />

      {/* Dark solid overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[#0a2a1a]/90" />

      {/* Content */}
      <div className="relative z-[1] max-w-[1200px] mx-auto px-10 max-[640px]:px-5">
        <div className="max-w-[600px] mb-10">
          <h2 className="font-archivo text-[clamp(28px,3.5vw,40px)] text-white tracking-tight mb-3">
            Contact & Service Information
          </h2>
          <p className="font-jakarta text-[15px] text-white/70 leading-[1.7]">
            Reach out to the Sariaya Municipal Agriculture Office for technical assistance,
            document requirements, or account verification.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-[768px]:grid-cols-1">
          {CARDS.map((card, i) => <ContactCard key={i} card={card} />)}
        </div>
      </div>
    </section>
  );
}
