import { m as M } from 'motion/react';
import { useInstantMotion } from '../../lib/motionPolicy';
import { motionTransition } from '../../lib/motionPresets';

/** Positioned by the caller; owns only opacity, scale, translate and visibility. */
export default function AnimatedPopover({ open, children, origin = 'bottom right', ...props }) {
    const instant = useInstantMotion();
    return (
        <M.div {...props} data-motion-surface inert={!open} aria-hidden={!open}
            initial={false}
            animate={open
                ? { opacity: 1, scale: 1, y: 0, visibility: 'visible' }
                : { opacity: 0, scale: 0.95, y: 8, transitionEnd: { visibility: 'hidden' } }}
            transition={motionTransition('popover', open, instant)}
            style={{ transformOrigin: origin, ...props.style }}>
            {children}
        </M.div>
    );
}
