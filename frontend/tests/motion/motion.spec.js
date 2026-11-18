import { test, expect } from '@playwright/test';

const browserErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
    const errors = [];
    browserErrors.set(page, errors);
    page.on('pageerror', error => errors.push(error.message));
    // Tests don't need third-party fonts, tiles or a backend.
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://tiles.openfreemap.org/**', route => route.fulfill({
        json: { version: 8, sources: {}, layers: [] },
    }));
    await page.goto('/tests/fixtures/motion.html');
});

test.afterEach(async ({ page }) => {
    expect(browserErrors.get(page)).toEqual([]);
});

test('dialogs retain focus trapping, nested portals, Escape and scroll locks', async ({ page }) => {
    await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Test form' });
    await expect(dialog.getByLabel('Name')).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.getByRole('button', { name: 'Close form' }).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByLabel('Name')).toBeFocused();
    await dialog.getByRole('button', { name: 'Open nested viewer' }).click();
    await expect(page.getByRole('dialog', { name: 'Nested viewer' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Nested viewer' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Open nested viewer' })).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#open-dialog')).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('busy dialogs cannot be dismissed with Escape and submitting is immediate', async ({ page }) => {
    await page.locator('#open-dialog').click();
    await page.getByRole('checkbox', { name: 'Busy' }).check();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Test form' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Busy' }).uncheck();
    await page.getByRole('button', { name: 'Send form' }).click();
    await expect(page.getByRole('status', { name: 'Submissions' })).toHaveText('1');
    await expect(page.locator('[data-motion-dialog]')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('rapid close and reopen retains a single dialog and releases its lock', async ({ page }) => {
    await page.locator('#open-dialog').click();
    await page.locator('#close-dialog').click();
    // Programmatically reopen while the exit is still in progress.
    await page.locator('#open-dialog').evaluate(button => button.click());
    await expect(page.locator('[data-motion-dialog]')).toHaveCount(1);
    await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Close form' }).click();
    await expect(page.locator('[data-motion-dialog]')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('native dialogs stay top-layer until exit and clean up on Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Open native dialog' }).click();
    await expect(page.locator('dialog')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('the migrated confirmation adapter preserves action and alert semantics', async ({ page }) => {
    await page.getByRole('button', { name: 'Open confirmation' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Confirm test' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Submissions' })).toHaveText('1');
    await expect(page.locator('[data-motion-dialog]')).toHaveCount(0);
});

test('full motion ignores Windows preference, but keyboard collapses are instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const toggle = page.getByRole('button', { name: 'Toggle collapse' });
    const frames = await toggle.evaluate(async button => {
        // Real pointer policy, then sample intermediate frames rather than merely
        // asserting the final state (which would also pass with no animation).
        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        button.click();
        const panel = document.getElementById('test-collapse');
        const samples = [];
        const start = performance.now();
        while (performance.now() - start < 350) {
            await new Promise(requestAnimationFrame);
            samples.push({ height: panel.getBoundingClientRect().height, opacity: Number(getComputedStyle(panel).opacity) });
        }
        return samples;
    });
    expect(frames.some(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
    expect(frames.some(frame => frame.height > 0 && frame.height < frames.at(-1).height)).toBe(true);
    await expect(page.locator('#test-collapse')).toHaveCSS('opacity', '1');
    await expect(page.getByLabel('Retained input')).toHaveValue('Preserved');
    await page.getByLabel('Retained input').fill('Still here');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#test-collapse')).toHaveCSS('height', '0px');
    await expect(page.locator('#test-collapse')).toHaveAttribute('inert', '');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Retained input')).toHaveValue('Still here');
    await expect(page.locator('#test-collapse')).toHaveCSS('opacity', '1');
});

test('FAQ expansion uses the shared collapse without hidden content races', async ({ page }) => {
    const question = page.getByRole('button', { name: 'What is FarmPass?' });
    await question.click();
    const answer = page.locator(`[id="${await question.getAttribute('aria-controls')}"]`);
    await expect(answer).toHaveCSS('opacity', '1');
    await question.click();
    await expect(answer).toHaveCSS('height', '0px');
    await question.click();
    await expect(answer).toHaveCSS('opacity', '1');
});

for (const width of [1440, 1024, 768, 390]) {
    test(`map comparison, legend and details at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/tests/fixtures/motion.html?view=map');
        await expect(page.getByRole('heading', { name: 'Pig Population Map' })).toBeVisible();
        if (width < 768) await page.getByRole('button', { name: 'Filters', exact: true }).click();
        await page.getByRole('button', { name: 'Compare years' }).click();
        await expect(page.locator('#map-comparison-controls')).toHaveCSS('opacity', '1');
        await page.getByRole('button', { name: 'Exit comparison' }).click();
        await expect(page.locator('#map-comparison-controls')).toHaveCSS('height', '0px');
        const legend = page.getByRole('button', { name: 'Population level', exact: true });
        if (await legend.getAttribute('aria-expanded') === 'false') await legend.click();
        const legendPanel = page.locator(`[id="${await legend.getAttribute('aria-controls')}"]`);
        await expect(legendPanel).toHaveCSS('opacity', '1');
        await legendPanel.getByRole('button', { name: 'Low 1–99' }).click();
        await expect(legendPanel.getByRole('button', { name: 'Low 1–99' })).toHaveAttribute('aria-pressed', 'false');
        await legend.click();
        await expect(legendPanel).toHaveCSS('visibility', 'hidden');
        if (width < 1280) {
            await page.getByRole('button', { name: 'View details' }).click();
            await expect(page.getByRole('dialog', { name: 'Sariaya overview' })).toBeVisible();
            await page.getByRole('button', { name: 'Close details' }).click();
            await expect(page.locator('[data-motion-dialog]')).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: test.info().outputPath(`map-${width}.png`) });
    });
}

test('mobile landing navigation uses the same input and popover policy', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole('button', { name: 'Toggle menu' });
    await menu.click();
    await expect(page.locator('#landing-mobile-menu')).toHaveCSS('visibility', 'visible');
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(page.locator('#landing-mobile-menu')).toHaveCSS('visibility', 'hidden');
});

test('real login and registration routes load with the shared provider', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reset Password', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Reset Password' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Reset Password' })).toHaveCount(0);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Personal & Mobile Details' })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(1);
});

test('portal navigation shares sheet focus, lock and breakpoint behavior', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tests/fixtures/motion.html?view=sidebar');
    const trigger = page.getByRole('button', { name: 'Open navigation' });
    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Portal navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Public Info' })).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await drawer.getByRole('link', { name: 'Public Info' }).click();
    await expect(drawer).toHaveCount(0);
    await trigger.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('[data-motion-dialog]')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect(page.getByRole('complementary', { name: 'Portal navigation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the real mobile sheet still slides when OS animations are disabled', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tests/fixtures/motion.html?view=map');
    const samples = await page.getByRole('button', { name: 'View details' }).evaluate(async button => {
        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        button.click();
        const positions = [];
        const start = performance.now();
        while (performance.now() - start < 450) {
            await new Promise(requestAnimationFrame);
            const panel = document.querySelector('[data-motion-dialog] .fixed')?.firstElementChild;
            if (panel) positions.push(new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42);
        }
        return positions;
    });
    expect(samples.some(y => y > 1)).toBe(true);
    expect(Math.abs(samples.at(-1))).toBeLessThan(1);
    await page.getByRole('button', { name: 'Close details' }).click();
    await expect(page.locator('[data-motion-dialog]')).toHaveCount(0);
});
