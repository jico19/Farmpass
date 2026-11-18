import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://www.google.com/maps/embed**', route => route.abort());
});

const surfaces = [
    { path: '/', selector: '.features-card' },
    { path: '/requirements', selector: '.guide-step' },
    { path: '/about', selector: '.contact-card-inner' },
    { path: '/faqs', selector: 'main section:last-child > div' },
];

for (const width of [1440, 390]) {
    for (const { path, selector } of surfaces) {
        test(`landing scroll reveal on ${path} at ${width}px`, async ({ page }) => {
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewportSize({ width, height: 844 });
            // Preserve the existing full motion product policy.
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto(path);
            const surface = page.locator(selector).first();
            await expect(surface).toHaveCSS('opacity', '0');

            const frames = await surface.evaluate(async element => {
                element.scrollIntoView({ behavior: 'instant', block: 'center' });
                const samples = [];
                const start = performance.now();
                while (performance.now() - start < 450) {
                    await new Promise(requestAnimationFrame);
                    const style = getComputedStyle(element);
                    samples.push({
                        opacity: Number(style.opacity),
                        y: new DOMMatrixReadOnly(style.transform).m42,
                    });
                }
                return samples;
            });
            expect(frames.some(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
            expect(frames.some(frame => frame.y > 0 && frame.y < 8)).toBe(true);
            await expect(surface).toHaveCSS('opacity', '1');
            await expect(surface).toHaveCSS('transform', 'none');

            // Reveals play once, not every time a section returns to view.
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await expect(surface).toHaveCSS('opacity', '1');
            await surface.scrollIntoViewIfNeeded();
            await expect(surface).toHaveCSS('opacity', '1');
            expect(errors).toEqual([]);
        });
    }
}

test('keyboard focus reveals contact links immediately', async ({ page }) => {
    await page.goto('/about');
    const card = page.locator('.contact-card-inner').filter({ has: page.locator('a') });
    await expect(card).toHaveCSS('opacity', '0');
    await page.keyboard.press('Tab');
    const opacity = await card.locator('a').first().evaluate(async link => {
        link.focus();
        await new Promise(requestAnimationFrame);
        return getComputedStyle(link.closest('.contact-card-inner')).opacity;
    });
    expect(opacity).toBe('1');
    await expect(card.locator('a').first()).toBeFocused();
});

test('scroll content remains visible without IntersectionObserver', async ({ page }) => {
    await page.addInitScript(() => { delete window.IntersectionObserver; });
    await page.goto('/');
    await expect(page.locator('.features-card').first()).toHaveCSS('opacity', '1');
});

test('contact hash navigation still reveals the destination', async ({ page }) => {
    await page.goto('/about#contact-section');
    const card = page.locator('.contact-card-inner').first();
    await expect(card).toBeInViewport();
    await expect(card).toHaveCSS('opacity', '1');
});

test('revealed cards retain CSS hover feedback', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.features-card').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveCSS('opacity', '1');
    await card.hover();
    await expect(card).toHaveCSS('translate', '0px -3px');
    await expect(card).toHaveCSS('transition-property', 'translate, border-color, box-shadow, background-color');
    await expect(card).toHaveCSS('transform', 'none');
});

test('keyboard reveals stay visible after returning to pointer input', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.features-card').first();
    await expect(card).toHaveCSS('opacity', '0');
    await page.keyboard.press('Tab');
    await expect(card).toHaveCSS('opacity', '1');
    await page.locator('h1').click();
    await expect(page.locator('html')).toHaveAttribute('data-ui-input', 'pointer');
    await expect(card).toHaveCSS('opacity', '1');
});
