export const easing = {
    smooth: [0.4, 0, 0.2, 1],
    enter: [0.32, 0.72, 0, 1],
    exit: [0.895, 0.03, 0.685, 0.22],
};

export const timing = {
    popover: { enter: 0.15, exit: 0.1 },
    dialog: { enter: 0.2, exit: 0.15 },
    alert: { enter: 0.1, exit: 0.1 },
    sheet: { enter: 0.3, exit: 0.2 },
    collapse: { enter: 0.2, exit: 0.15 },
};

export function motionTransition(kind, opening, instant = false) {
    return {
        type: 'tween',
        duration: instant ? 0 : timing[kind][opening ? 'enter' : 'exit'],
        ease: opening ? easing.enter : easing.exit,
    };
}
