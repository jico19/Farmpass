import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, useAnimate, usePresence } from 'motion/react';
import { useInstantMotion } from '../../lib/motionPolicy';
import { motionTransition } from '../../lib/motionPresets';
import useDialogBehavior from './useDialogBehavior';

function DialogFrame({ children, onDismiss, variant, side, previousFocus }) {
    const [present, safeToRemove] = usePresence();
    const [scopeRef, animate] = useAnimate();
    const instant = useInstantMotion();
    const entered = useRef(false);
    const [restoreFocus] = useState(previousFocus);
    useDialogBehavior(scopeRef, present, onDismiss, variant, restoreFocus);

    useLayoutEffect(() => {
        const root = scopeRef.current.querySelector('dialog, .fixed');
        if (!root) { if (!present) safeToRemove(); return; }
        root.dataset.motionSurface = '';
        const native = root.tagName === 'DIALOG';
        const panel = native ? root : root.firstElementChild;
        if (!panel) { if (!present) safeToRemove(); return; }
        panel.dataset.motionSurface = '';
        const sheetSide = side || (!native && getComputedStyle(root).alignItems === 'flex-end' ? 'bottom' : null);
        const kind = sheetSide ? 'sheet' : variant;
        const transition = { ...motionTransition(kind, present, instant), reduceMotion: false };
        const displacement = sheetSide === 'right' ? { x: '100%' } : sheetSide === 'left' ? { x: '-100%' } : { y: '100%' };
        const closed = sheetSide ? displacement : { scale: present ? 1.02 : 0.98 };
        const opened = sheetSide ? { x: 0, y: 0 } : { scale: 1 };
        const controls = [];
        let cancelled = false;
        if (!entered.current && present) {
            // Initial values only on first mount; rapid reopen retargets in place.
            if (!native) root.style.opacity = '0';
            controls.push(animate(panel, { opacity: [0, 1], ...Object.fromEntries(
                Object.entries(opened).map(([key, value]) => [key, [closed[key] ?? value, value]]),
            ) }, transition));
            entered.current = true;
        } else {
            controls.push(animate(panel, present ? { opacity: 1, ...opened } : { opacity: 0, ...closed }, transition));
        }
        if (!native) controls.push(animate(root, { opacity: present ? 1 : 0 }, transition));
        void Promise.all(controls).then(() => {
            if (!cancelled && !present) safeToRemove();
        });
        return () => {
            cancelled = true;
            controls.forEach(control => control.stop());
        };
    }, [animate, instant, present, safeToRemove, scopeRef, side, variant]);

    return <div ref={scopeRef} className="contents" data-motion-dialog data-state={present ? 'open' : 'closed'}
        inert={!present} aria-hidden={!present || undefined}>{children}</div>;
}

/** Presence retains the last open React tree, replacing manual exit timers. */
export default function AnimatedDialog({ open, children, onDismiss, portal = false, variant = 'dialog', side }) {
    const [previousOpen, setPreviousOpen] = useState(false);
    const [previousFocus, setPreviousFocus] = useState(null);
    if (open !== previousOpen) {
        setPreviousOpen(open);
        if (open) setPreviousFocus(document.activeElement);
    }
    const content = <AnimatePresence>
        {open && <DialogFrame key="dialog" onDismiss={onDismiss} variant={variant} side={side} previousFocus={previousFocus}>
            {children}
        </DialogFrame>}
    </AnimatePresence>;
    return portal ? createPortal(content, document.body) : content;
}
