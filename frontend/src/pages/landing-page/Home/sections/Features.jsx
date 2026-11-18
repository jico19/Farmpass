import { ScanLine, QrCode, MessageSquare, MapPin } from "lucide-react";
import FeaturesBg from '../../../../assets/home-icons/feature-bg.jpg';
import AnimatedReveal from '../../../../components/motion/AnimatedReveal';

const FEATURES = [
  {
    icon: ScanLine,
    iconColor: "text-emerald-700",
    title: "OCR Document Validation",
    desc: "Extracts and cross-checks data from handler and transport licenses automatically to speed up compliance review.",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    icon: QrCode,
    iconColor: "text-blue-700",
    title: "QR Checkpoint Verification",
    desc: "Every issued permit contains an official municipal QR signature for rapid roadside clearance by field inspectors.",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: MessageSquare,
    iconColor: "text-amber-700",
    title: "Direct SMS Alerts",
    desc: "Farmers receive real-time text updates upon permit endorsement, approval, or required document revisions.",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    icon: MapPin,
    iconColor: "text-teal-700",
    title: "Geospatial Route Tracking",
    desc: "Monitors livestock shipping origins and transit destinations across Sariaya's 43 barangays for ASF biosecurity.",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
];

export default function Features() {

  return (
    <section className="bg-brand-bg py-20 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-10 max-[560px]:px-5">

        {/* Top Header & Visual */}
        <div className="flex items-center gap-12 mb-14 max-[900px]:flex-col max-[900px]:gap-8 max-[560px]:mb-10">

          {/* Left Description */}
          <AnimatedReveal className="flex-1 min-w-0 max-[900px]:text-center">
            <h2 className="font-archivo text-[clamp(28px,3.5vw,40px)] text-brand-primary leading-[1.12] mb-4 tracking-[-0.02em]">
              Regulatory Tools Built for Compliance
            </h2>
            <p className="font-jakarta text-[15px] text-stone-600 leading-[1.75] max-w-[480px] max-[900px]:mx-auto">
              Our platform connects municipal agriculture staff, barangay inspectors, and livestock handlers
              through verifiable digital transport credentials.
            </p>
          </AnimatedReveal>

          {/* Right Image */}
          <AnimatedReveal className="flex-1 min-w-0 max-[900px]:w-full">
            <img
              src={FeaturesBg}
              alt="Farmer using digital portal"
              className="w-full h-[280px] object-cover object-center border border-stone-200 rounded-lg max-[900px]:h-[240px] max-[560px]:h-[190px]"
            />
          </AnimatedReveal>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1 max-[560px]:gap-4">
          {FEATURES.map(({ icon: Icon, iconColor, title, desc, bg, border }, i) => (
            <AnimatedReveal key={i} delay={Math.min(i * 0.02, 0.06)} className="landing-card features-card group bg-white p-6 sm:p-7 border border-stone-200 rounded-lg relative overflow-hidden cursor-default">

              {/* Icon Container */}
              <div className={`landing-card-icon w-12 h-12 ${bg} border ${border} rounded-md flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
              </div>

              <h3 className="font-archivo text-[16px] text-stone-900 mb-2 tracking-[-0.01em]">{title}</h3>
              <p className="font-jakarta text-[14px] text-stone-600 leading-[1.65]">{desc}</p>
            </AnimatedReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
