import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import LandingButton from './LandingButton';
import AgriLogo from '../../assets/sariaya-agri-logo.jpg';

const NAV_LINKS = [
  { key: "home", label: "Home" },
  { key: "requirements", label: "Requirements" },
  { key: "about", label: "About Us" },
  { key: "faqs", label: "FAQs" },
];

export default function LandingNavbar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event) => {
      if (!menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 911px)");
    const onResize = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      desktop.removeEventListener("change", onResize);
    };
  }, [menuOpen]);

  const getActivePage = () => {
    const path = location.pathname;
    if (path.startsWith("/requirements")) return "requirements";
    if (path.startsWith("/about")) return "about";
    if (path.startsWith("/faqs")) return "faqs";
    return "home";
  };

  const currentActivePage = activePage || getActivePage();

  const handleNav = (key) => {
    const routes = {
      home: "/",
      requirements: "/requirements",
      about: "/about",
      faqs: "/faqs",
    };
    navigate(routes[key] || "/");
    setMenuOpen(false);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="w-full h-[68px] bg-white border-b border-[#e8e8e8] flex items-center px-10 relative z-[100] font-jakarta max-[910px]:px-5 max-[910px]:justify-between">

        {/* Hamburger — mobile only */}
        <button
          type="button"
          ref={triggerRef}
          className="hidden max-[910px]:flex flex-col justify-center items-center gap-[5px] w-9 h-9 bg-transparent border-none cursor-pointer p-1 shrink-0 -order-1"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
        >
          <span className={`block w-[22px] h-[2px] bg-[#0a2a1a] rounded-sm origin-center transition-transform duration-150 ease-smooth motion-reduce:transition-none ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`block w-[22px] h-[2px] bg-[#0a2a1a] rounded-sm origin-center transition-opacity duration-150 ease-smooth motion-reduce:transition-none ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-[22px] h-[2px] bg-[#0a2a1a] rounded-sm origin-center transition-transform duration-150 ease-smooth motion-reduce:transition-none ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>

        {/* Logo */}
        <Link
          to="/"
          onClick={() => {
            setMenuOpen(false);
          }}
          className="flex items-center gap-[10px] no-underline shrink-0 max-[910px]:absolute max-[910px]:left-1/2 max-[910px]:-translate-x-1/2"
        >
          <div className="flex items-center -space-x-2">
            <img src={AgriLogo} alt="Sariaya" className="w-8 h-8 rounded-full shrink-0 object-cover border border-stone-100" />
          </div>
          <span className="font-archivo text-[25px] text-[#1b6b3a] tracking-[0.01em] max-[910px]:hidden">
            FarmPass
          </span>
        </Link>

        {/* Nav links — desktop only */}
        <div className="mx-auto max-[910px]:hidden">
          <div className="flex flex-row items-center gap-1">
            {NAV_LINKS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`relative px-4 py-1.5 text-sm cursor-pointer border-none font-jakarta transition-[color,background-color,border-color,opacity] duration-150 ease-smooth motion-reduce:transition-none motion-safe:active:scale-100
                  hover-only:hover:text-green-700
                  ${currentActivePage === key
                    ? "font-bold text-green-800 border-b-2 border-green-700 -mb-0.5"
                    : "font-medium text-stone-700 bg-transparent"
                  }`}
                onClick={() => handleNav(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="text-sm font-medium text-stone-700 bg-transparent border border-transparent cursor-pointer px-3 py-1.5 font-jakarta transition-[color,opacity] duration-150 ease-smooth motion-reduce:transition-none motion-safe:active:scale-100 hover-only:hover:text-green-800 max-[910px]:px-1"
            onClick={() => {
              navigate("/login");
            }}
          >
            Sign In
          </button>
          <div className="w-[100px] max-[910px]:hidden">
            <LandingButton
              label="Sign Up"
              bgColor="#15803d"
              textColor="#ffffff"
              baseColor="#15803d"
              onClick={() => {
                navigate("/register");
              }}
            />
          </div>
        </div>

      </nav>

      {/* MOBILE DROPDOWN */}
      <div
        ref={menuRef}
        id="landing-mobile-menu"
        data-open={menuOpen}
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        className="landing-menu fixed top-[68px] left-0 right-0 bg-white border-b border-stone-200 flex-col gap-[2px] z-[99] overflow-y-auto max-h-[calc(100dvh-68px)] px-5 pt-3 pb-5 hidden max-[910px]:flex motion-reduce:transition-none"
      >
        {NAV_LINKS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`w-full text-left px-4 py-3 text-[15px] border-none rounded-md cursor-pointer font-jakarta transition-[color,background-color,opacity] duration-150 ease-smooth motion-reduce:transition-none motion-safe:active:scale-100
              hover-only:hover:bg-[#0a2a1a] hover-only:hover:text-[#f5a623]
              ${currentActivePage === key
                ? "font-bold bg-[#f0f7f3] text-[#0a2a1a]"
                : "font-medium text-[#0a2a1a] bg-transparent"
              }`}
            onClick={() => handleNav(key)}
          >
            {label}
          </button>
        ))}
        <div className="pt-2 mt-2 border-t border-stone-200 flex flex-col gap-2">
          <button
            type="button"
            className="w-full text-center py-2.5 text-[15px] font-medium text-[#0a2a1a] bg-[#f8faf8] border border-stone-200 rounded-md cursor-pointer font-jakarta transition-[color,background-color,opacity] duration-150 ease-smooth motion-reduce:transition-none hover-only:hover:text-[#1b6b3a]"
            onClick={() => {
              navigate("/login");
              setMenuOpen(false);
            }}
          >
            Sign In
          </button>
          <LandingButton
            label="Sign Up"
            bgColor="#1b6b3a"
            textColor="#f5a623"
            baseColor="#0a2a1a"
            onClick={() => {
              navigate("/register");
              setMenuOpen(false);
            }}
          />
        </div>
      </div>
    </>
  );
}
