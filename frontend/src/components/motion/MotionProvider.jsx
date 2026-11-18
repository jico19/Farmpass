import { useLayoutEffect } from 'react';
import { LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { setMotionInput } from '../../lib/motionPolicy';
import { easing } from '../../lib/motionPresets';

const transition = { type: 'tween', duration: 0.15, ease: easing.smooth };

export default function MotionProvider({ children }) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.dataset.uiMotion = 'full';
        const onKey = event => {
            if (['Tab', 'Enter', ' ', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                setMotionInput('keyboard');
            }
        };
        const onPointer = () => setMotionInput('pointer');
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('pointerdown', onPointer, true);
        return () => {
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('pointerdown', onPointer, true);
            delete root.dataset.uiMotion;
            delete root.dataset.uiInput;
        };
    }, []);

    return (
        <MotionConfig reducedMotion="never" transition={transition}>
            <LazyMotion features={domAnimation} strict>{children}</LazyMotion>
        </MotionConfig>
    );
}
