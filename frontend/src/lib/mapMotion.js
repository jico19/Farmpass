/** Follow the app's full-motion default, while keeping keyboard actions instant. */
export function mapMotionOptions() {
    const { uiMotion, uiInput } = document.documentElement.dataset;
    return {
        duration: uiInput === 'keyboard' ? 0 : 300,
        essential: uiMotion === 'full',
    };
}
