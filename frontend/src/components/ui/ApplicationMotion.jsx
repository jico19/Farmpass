import { useLayoutEffect } from 'react';

/** Shared by auth, every portal, and overlays rendered into document.body. */
export default function ApplicationMotion({ children }) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.dataset.uiMotion = 'full';
        const onKey = (event) => {
            if (['Tab', 'Enter', ' ', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                root.dataset.uiInput = 'keyboard';
            }
        };
        const onPointer = () => { root.dataset.uiInput = 'pointer'; };
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('pointerdown', onPointer, true);
        return () => {
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('pointerdown', onPointer, true);
            delete root.dataset.uiMotion;
            delete root.dataset.uiInput;
        };
    }, []);
    return children;
}
