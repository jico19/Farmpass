import { Link } from 'react-router-dom';
import { HelpCircle } from "lucide-react";
import AnimatedReveal from '../../../../components/motion/AnimatedReveal';

export default function NeedHelp() {

  return (
    <section className="bg-stone-50 py-16 max-[640px]:py-12 px-8 max-[640px]:px-5">
      <AnimatedReveal
        className="landing-card max-w-[54rem] mx-auto bg-white border border-stone-200 rounded-lg p-8">

        <div className="flex items-center gap-3 mb-3">
          <div className="landing-card-icon w-10 h-10 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-amber-700" strokeWidth={2} />
          </div>
          <h2 className="font-archivo text-xl text-stone-900 font-bold tracking-tight">Need Assistance?</h2>
        </div>

        <p className="font-jakarta text-sm text-stone-600 leading-relaxed mb-5">
          For technical issues or clarification regarding requirements, contact the Sariaya Municipal Agriculture Office:
        </p>

        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {[
            <>Review frequently asked questions in our <Link to="/faqs" className="text-green-700 font-semibold no-underline hover-only:hover:underline motion-safe:active:scale-100">Help & FAQs Center</Link></>,
            <>Direct line: <a className="landing-contact-link font-semibold text-stone-900 hover-only:hover:text-green-700" href="tel:0425258200">(042) 525-8200</a> or email <a className="landing-contact-link font-semibold text-stone-900 hover-only:hover:text-green-700" href="mailto:agri@sariaya.gov.ph">agri@sariaya.gov.ph</a></>,
            <>Visit in-person: <strong className="text-stone-900">Municipal Agriculture Office, New Municipal Hall</strong> (Mon–Fri, 8:00 AM – 5:00 PM)</>,
          ].map((item, i) => (
            <li key={i}
              className="font-jakarta text-xs sm:text-sm text-stone-700 pl-4 relative leading-relaxed
                before:content-['•'] before:absolute before:left-0 before:text-stone-400 before:font-bold">
              {item}
            </li>
          ))}
        </ul>
      </AnimatedReveal>
    </section>
  );
}
