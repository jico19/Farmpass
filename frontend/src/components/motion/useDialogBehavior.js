import { useEffectEvent, useLayoutEffect } from 'react';

const stack = [];
let savedOverflow;
const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Dialog semantics are independent of animation and live until exit completes. */
export default function useDialogBehavior(scope, present, onDismiss, variant, previousFocus) {
    const dismiss = useEffectEvent(() => { if (present) onDismiss?.(); });

    useLayoutEffect(() => {
        const container = scope.current;
        const dialog = container.querySelector('dialog, .fixed');
        if (!dialog) return;
        const native = dialog.tagName === 'DIALOG';
        const entry = { dialog };
        if (!stack.length) {
            savedOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        stack.push(entry);
        if (!native) {
            dialog.setAttribute('role', variant === 'alert' ? 'alertdialog' : 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
                dialog.setAttribute('aria-label', dialog.querySelector('h1, h2, h3')?.textContent || 'Dialog');
            }
            dialog.tabIndex = -1;
            if (!dialog.contains(document.activeElement)) {
                (dialog.querySelector(focusable) || dialog).focus({ preventScroll: true });
            }
        }
        const onKey = event => {
            if (stack.at(-1) !== entry || native) return;
            if (event.key === 'Escape' && !event.defaultPrevented) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (dialog.getAttribute('aria-busy') !== 'true') dismiss();
            }
            if (event.key !== 'Tab') return;
            const controls = [...dialog.querySelectorAll(focusable)].filter(element =>
                element.getClientRects().length && !element.closest('[inert]'));
            const first = controls[0];
            const last = controls.at(-1);
            if (!first) {
                event.preventDefault();
                dialog.focus({ preventScroll: true });
            } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            const index = stack.indexOf(entry);
            const wasTop = index === stack.length - 1;
            if (index !== -1) stack.splice(index, 1);
            if (!stack.length) document.body.style.overflow = savedOverflow;
            if (wasTop && previousFocus?.isConnected && !previousFocus.closest('[inert]')) {
                previousFocus.focus({ preventScroll: true });
            }
        };
    }, [scope, variant, previousFocus]);

    useLayoutEffect(() => {
        const dialog = scope.current.querySelector('dialog, .fixed');
        if (!dialog) return;
        dialog.inert = !present;
        if (present && dialog.tagName !== 'DIALOG' && !dialog.contains(document.activeElement)) {
            (dialog.querySelector(focusable) || dialog).focus({ preventScroll: true });
        }
    }, [scope, present]);
}
