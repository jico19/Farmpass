import { useEffect, useRef } from "react";

/** 
 *
 * @param {number} options.threshold  — 0–1, how much must be visible (default 0.15)
 * @param {string} options.rootMargin — margin around viewport (default "0px 0px -60px 0px")
 */
export default function useScrollReveal({
  threshold  = 0.15,
  rootMargin = "0px 0px -60px 0px",
  selector,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = selector ? [...el.querySelectorAll(selector)] : [el];
    const show = (target) => {
      target.classList.add("is-visible");
      target.classList.remove("reveal-pending");
    };
    if (document.documentElement.dataset.landingInput === "keyboard" || !("IntersectionObserver" in window)) {
      targets.forEach(show);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold, rootMargin });
    targets.forEach((target, index) => {
      target.style.transitionDelay = `${Math.min(index * 20, 60)}ms`;
      if (!target.classList.contains("is-visible")) target.classList.add("reveal-pending");
      observer.observe(target);
    });
    const revealAll = () => {
      targets.forEach(show);
      observer.disconnect();
    };
    const onFocus = () => {
      if (document.documentElement.dataset.landingInput === "keyboard") el.classList.add("reveal-instant");
      revealAll();
    };
    el.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocus);
    };
  }, [threshold, rootMargin, selector]);

  return ref;
}
