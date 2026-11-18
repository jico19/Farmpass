import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const modalStack = [];
let savedOverflow;
const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function ModalFrame({ open, instant, onDismiss, variant, children }) {
    // This frame mounts only when opened, before descendants can autofocus.
    const [previousFocus] = useState(() => document.activeElement);
    const containerRef = useRef(null);
    const dismiss = useEffectEvent(() => { if (open) onDismiss?.(); });

    useEffect(() => {
        const dialog = containerRef.current.querySelector('dialog, .fixed');
        // Native top-layer dialogs can escape an ancestor's inert state.
        if (dialog) dialog.inert = !open;
    }, [open]);

    useEffect(() => {
        const container = containerRef.current;
        const dialog = container.querySelector('dialog, .fixed');
        if (!dialog) return;
        const entry = { dialog };
        if (modalStack.length === 0) {
            savedOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        modalStack.push(entry);
        // Native dialogs supply their own focus management.
        const native = dialog.tagName === 'DIALOG';
        if (!native) {
            dialog.setAttribute('role', variant === 'alert' ? 'alertdialog' : 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            const heading = dialog.querySelector('h1, h2, h3');
            if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
                dialog.setAttribute('aria-label', heading?.textContent || 'Dialog');
            }
            dialog.tabIndex = -1;
            if (!dialog.contains(document.activeElement)) {
                const first = [...dialog.querySelectorAll(focusable)].find((el) => el.getClientRects().length && !el.closest('[inert]'));
                (first || dialog).focus({ preventScroll: true });
            }
        }
        const onKey = (event) => {
            if (modalStack.at(-1) !== entry || native) return;
            if (event.key === 'Escape' && !event.defaultPrevented) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (dialog.getAttribute('aria-busy') !== 'true') dismiss();
                return;
            }
            if (event.key !== 'Tab') return;
            const controls = [...dialog.querySelectorAll(focusable)].filter((el) => el.getClientRects().length && !el.closest('[inert]'));
            const first = controls[0];
            const last = controls.at(-1);
            if (!first) {
                event.preventDefault();
                dialog.focus();
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
            const index = modalStack.indexOf(entry);
            const wasTop = index === modalStack.length - 1;
            if (index !== -1) modalStack.splice(index, 1);
            if (modalStack.length === 0) document.body.style.overflow = savedOverflow;
            if (wasTop && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        };
    }, [previousFocus, variant]);

    // Restore focus inside a dialog reopened before its exit has completed.
    useEffect(() => {
        if (!open) return;
        const dialog = containerRef.current.querySelector('dialog, .fixed');
        if (dialog && dialog.tagName !== 'DIALOG' && !dialog.contains(document.activeElement)) {
            const first = [...dialog.querySelectorAll(focusable)].find((el) => el.getClientRects().length && !el.closest('[inert]'));
            (first || dialog).focus({ preventScroll: true });
        }
    }, [open]);

    return (
        <div ref={containerRef} className={`ui-presence contents ${variant === 'alert' ? 'ui-alert' : ''}`} data-state={open ? 'open' : 'closed'}
            data-instant={instant} inert={!open} aria-hidden={!open || undefined}>
            {children}
        </div>
    );
}

/**
 * Retains the last open element and data until exit completes. Keep this
 * outside conditional rendering; action/submit callbacks are never delayed.
 */
export default function MotionPresence({ open, children, duration = 150, portal = false, onDismiss, variant = 'dialog' }) {
    const [retained, setRetained] = useState(open ? children : null);
    const instant = document.documentElement.dataset.uiInput === 'keyboard';
    if (open && retained !== children) setRetained(children);
    const present = open || (retained !== null && !instant);

    useEffect(() => {
        if (open || retained === null) return;
        const timer = window.setTimeout(() => setRetained(null), instant ? 0 : duration);
        return () => window.clearTimeout(timer);
    }, [open, retained, duration, instant]);

    if (!present) return null;
    const content = (
        <ModalFrame open={open} instant={instant} onDismiss={onDismiss} variant={variant}>
            {open ? children : retained}
        </ModalFrame>
    );
    return portal ? createPortal(content, document.body) : content;
}
