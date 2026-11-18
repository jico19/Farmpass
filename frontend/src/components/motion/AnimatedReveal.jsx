import { useState } from 'react';
import { m as M } from 'motion/react';
import { useInstantMotion } from '../../lib/motionPolicy';
import { motionTransition } from '../../lib/motionPresets';

const hidden = { opacity: 0, y: 8 };
const shown = { opacity: 1, y: 0 };
const viewport = { once: true, amount: 0.1, margin: '0px 0px -60px 0px' };

/** Landing content reveals once on scroll. Keyboard and focused content are immediate. */
export default function AnimatedReveal({ children, delay = 0, ...props }) {
    const instant = useInstantMotion();
    const canObserve = typeof IntersectionObserver !== 'undefined';
    const [revealed, setRevealed] = useState(!canObserve);
    const [focused, setFocused] = useState(false);
    const visible = revealed || instant || focused;
    const immediate = instant || focused;

    return (
        // Unlike dialog surfaces, retain CSS hover feedback on translate/border/color.
        // Motion owns only transform and opacity here, so the properties do not compete.
        <M.div {...props} data-motion-reveal
            initial={visible ? false : hidden} animate={visible ? shown : hidden}
            viewport={viewport} onViewportEnter={canObserve ? () => setRevealed(true) : undefined}
            onFocusCapture={() => setFocused(true)}
            onAnimationComplete={() => { if (visible && !revealed) setRevealed(true); }}
            transition={{ ...motionTransition('dialog', true, immediate), delay: immediate ? 0 : delay }}>
            {children}
        </M.div>
    );
}
