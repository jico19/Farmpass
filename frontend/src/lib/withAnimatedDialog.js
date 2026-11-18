import { createElement } from 'react';
import AnimatedDialog from '../components/motion/AnimatedDialog';

/** Share dialog presence without changing each form's data/submission contract. */
export function withAnimatedDialog(Component, { when = props => props.isOpen !== false, portal = false, variant = 'dialog' } = {}) {
    function Dialog(props) {
        const onDismiss = () => {
            if (!(props.isSubmitting || props.isLoading || props.isPending || props.busy || props.isVerifying)) props.onClose?.();
        };
        return createElement(AnimatedDialog, { open: Boolean(when(props)), onDismiss, portal, variant },
            createElement(Component, props));
    }
    Dialog.displayName = `Animated${Component.displayName || Component.name || 'Dialog'}`;
    return Dialog;
}
