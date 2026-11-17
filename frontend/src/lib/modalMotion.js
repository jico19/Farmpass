import { createElement } from 'react';
import MotionPresence from '../components/ui/MotionPresence';

/** Keep this wrapper mounted and pass isOpen, rather than conditionally rendering it. */
export function withModalMotion(Component, { when = (props) => props.isOpen !== false, duration = 150, portal = false, variant = 'dialog' } = {}) {
    function AnimatedModal(props) {
        const open = Boolean(when(props));
        const close = () => {
            if (!(props.isSubmitting || props.isLoading || props.isPending || props.busy || props.isVerifying)) props.onClose?.();
        };
        return createElement(MotionPresence, { open, duration, portal, variant, onDismiss: close }, createElement(Component, props));
    }
    AnimatedModal.displayName = `Animated${Component.displayName || Component.name || 'Modal'}`;
    return AnimatedModal;
}
