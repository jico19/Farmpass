import { useNavigate } from "react-router-dom";
import AnimatedReveal from '../../../../components/motion/AnimatedReveal';

export default function FAQsCTA() {
  const navigate = useNavigate();

  const handleContact = () => {
    navigate("/about#contact-section");
  };

  return (
    <section className="bg-brand-bg px-8 pb-20 box-border max-[640px]:px-5 max-[640px]:pb-16">
      <AnimatedReveal
        className="relative max-w-[60rem] mx-auto bg-brand-primary px-8 py-12 text-center border border-white/10 rounded-xl box-border max-[640px]:px-6 max-[640px]:py-8">

        <div className="relative z-[1]">
          <h2 className="font-archivo text-[clamp(1.4rem,3vw,2rem)] text-white tracking-[-0.02em] mb-2">
            Still Have Questions?
          </h2>
          <p className="font-jakarta text-[clamp(0.88rem,1.2vw,1rem)] text-white/70 leading-[1.7] mb-6 max-w-[500px] mx-auto">
            Contact the Municipal Agriculture Office in Sariaya for direct assistance with requirements or account setup.
          </p>
          <button
            type="button"
            onClick={handleContact}
            className="inline-flex items-center px-6 py-2.5 bg-white text-stone-900 font-jakarta text-[13px] font-bold rounded-md cursor-pointer transition-[color,background-color,opacity,transform] duration-150 ease-smooth motion-reduce:transition-none motion-safe:active:scale-[0.97] hover-only:hover:bg-stone-100"
          >
            Contact the Office
          </button>
        </div>
      </AnimatedReveal>
    </section>
  );
}
