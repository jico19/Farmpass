import { m as M } from 'motion/react';
import { useInstantMotion } from '../../lib/motionPolicy';
import { motionTransition } from '../../lib/motionPresets';

/** Keep content mounted so forms retain values and interrupted toggles retarget. */
export default function AnimatedCollapse({ open, children, ...props }) {
    const instant = useInstantMotion();
    return (
        <M.div {...props} data-motion-surface inert={!open} aria-hidden={!open}
            initial={false}
            animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
            transition={motionTransition('collapse', open, instant)}
            style={{ overflow: 'hidden', ...props.style }}>
            {children}
        </M.div>
    );
}
