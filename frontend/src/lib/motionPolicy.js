import { useSyncExternalStore } from 'react';

const subscribers = new Set();
let input = 'pointer';

export function setMotionInput(next) {
    document.documentElement.dataset.uiInput = next;
    if (input === next) return;
    input = next;
    subscribers.forEach(notify => notify());
}

function subscribe(notify) {
    subscribers.add(notify);
    return () => subscribers.delete(notify);
}

/** Keyboard actions are immediate; full motion intentionally ignores OS settings. */
export function useInstantMotion() {
    return useSyncExternalStore(subscribe, () => input, () => 'keyboard') === 'keyboard';
}
