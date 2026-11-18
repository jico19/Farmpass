import LandingNavbar from '../../components/ui/LandingNavbar';
import LandingFooter from '../../components/ui/LandingFooter';
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";

const LandingLayout = () => {
    const { pathname, hash, key } = useLocation();

    useEffect(() => {
        const onKey = (event) => {
            if (["Tab", "Enter", " "].includes(event.key)) document.documentElement.dataset.landingInput = "keyboard";
        };
        const onPointer = () => {
            document.documentElement.dataset.landingInput = "pointer";
            document.querySelectorAll(".landing-motion .reveal-instant").forEach((element) => element.classList.remove("reveal-instant"));
        };
        document.addEventListener("keydown", onKey, true);
        document.addEventListener("pointerdown", onPointer, true);
        return () => {
            document.removeEventListener("keydown", onKey, true);
            document.removeEventListener("pointerdown", onPointer, true);
            delete document.documentElement.dataset.landingInput;
        };
    }, []);

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        if (!hash) return;
        const scrollToTarget = () => {
            const target = document.getElementById(hash.slice(1));
            if (!target) return false;
            target.scrollIntoView({ behavior: "instant" });
            return true;
        };
        if (scrollToTarget()) return;
        // The destination may still be behind its route's Suspense boundary.
        const observer = new MutationObserver(() => {
            if (scrollToTarget()) observer.disconnect();
        });
        observer.observe(document.querySelector(".landing-motion main"), { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [pathname, hash, key]);

    return (
        <div className="landing-motion flex flex-col min-h-screen">
            <LandingNavbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <LandingFooter />
        </div>
    );
};

export default LandingLayout;
