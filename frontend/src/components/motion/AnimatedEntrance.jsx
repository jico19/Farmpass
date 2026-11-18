import { m as M } from 'motion/react';
import { useInstantMotion } from '../../lib/motionPolicy';
import { motionTransition } from '../../lib/motionPresets';

/** Explicit, once-on-mount entrance. Not for query refetches, rows or tab panels. */
export default function AnimatedEntrance({ children, as = 'div', ...props }) {
    const instant = useInstantMotion();
    const Element = M[as];
    return (
        <Element {...props} data-motion-surface initial={instant ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }} transition={motionTransition('dialog', true, instant)}>
            {children}
        </Element>
    );
}
