# FarmPass motion

## Policy

Full motion is the product default, even when Windows/OS animations are off.
`MotionProvider` configures `MotionConfig reducedMotion="never"` and the
`data-ui-motion="full"` flag used by CSS and MapLibre.

Keyboard actions are instant. The provider owns one input-mode listener, shared
by public pages, portals and document-body portals. Use `useInstantMotion()` for
new animated components; do not add separate key/pointer listeners.

## Ownership

- **Motion:** stateful entrances/exits, expandable panels, popovers, dialogs and sheets.
- **CSS:** hover/focus/press feedback, spinners, loading skeletons and small icon feedback.
- **MapLibre / Sonner / Recharts:** their own map, toast and chart animations.

Never let CSS and Motion animate the same property on the same element.
`data-motion-surface` disables legacy CSS animations/transitions on Motion-owned
surfaces. Do not add `transition-all`, entrance classes or permanent `will-change`
to these elements. No row, query-refetch or tab-panel entrances.

## Shared components

Under `src/components/motion/`:

- `AnimatedCollapse`: persistent content, `height: auto`, opacity, inert when closed.
  Preserves form state and retargets interrupted toggles.
- `AnimatedPopover`: caller-positioned surface with opacity/scale/translate and
  visibility. Keep its toggle outside the surface and wire `aria-expanded` and
  `aria-controls`.
- `AnimatedDialog`: `AnimatePresence` plus scoped Motion animation. Supports
  native `<dialog>` and the existing `.fixed` backdrop → panel structure. The
  first element inside a non-native backdrop must be its panel.
- `AnimatedSheet`: dialog presence with a bottom/left/right slide and body portal.
  Bottom-aligned legacy modals also use sheet motion on mobile.
- `AnimatedEntrance`: an explicit once-on-mount entrance; `as="form"` preserves
  form semantics when needed.
- `AnimatedReveal`: landing content reveals once when scrolled into view.
  Keyboard input and focus reveal content immediately, and browsers without
  IntersectionObserver show it without animation. Motion owns transform/opacity;
  CSS may still animate separate hover properties such as translate and border color.

Keep presence components mounted and pass `open`, rather than conditionally
rendering them. Motion retains the last open tree through exit; no manual exit
timers. The small `withAnimatedDialog` form adapter preserves existing prop and
submission contracts, without maintaining a second animation implementation.

Dialog behavior is separate in `useDialogBehavior`: stacking, scroll locking,
Escape, focus trapping and focus restoration. Closing surfaces become inert
immediately, but scroll locks are held until exit completes. Busy submission
guards remain in the calling form. Animation never delays mutation callbacks.
Native dialogs own their focus trap and must prevent default `cancel`, notify
the caller and close only when unmounted.

Timings/easing live in `src/lib/motionPresets.js` (seconds):

| Kind | Enter | Exit |
| --- | --- | --- |
| Popover | .15 | .10 |
| Dialog | .20 | .15 |
| Alert | .10 | .10 |
| Sheet | .30 | .20 |
| Collapse | .20 | .15 |

Tweens are the default. Animate transform/opacity wherever possible; measured
height is reserved for expandable content. Do not scale the map canvas: keep its
ResizeObserver and let MapLibre handle cameras via `mapMotionOptions()`.

## Cleanup

Removed the timer-based `MotionPresence`, `withModalMotion`, the map's manual
Web Animations code/legend CSS, FAQ measurement/keyframes, duplicate landing input
tracking, CSS scroll-reveal hooks, legacy modal/view/stagger/auth entrance classes,
unused theme keyframes, and the checkbox/CSS portal drawer animation.
Landing heroes retain explicit Motion entrances, landing scroll reveals use
`AnimatedReveal`, and dashboard KPI staggers remain retired.

`tw-animate-css` remains because small icon/badge and MapLibre popup consumers
still use it (and the shadcn stylesheet imports it). It is not a second dialog
animation system.

## Verification

```powershell
npm.cmd run lint
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:motion
```

The focused Playwright suite uses real shared components, real auth routes,
and seeded map-query fixtures at 1440/1024/768/390px; no backend or credentials.
It covers nested dialogs, native dialogs, focus, locks, busy guards, action
callbacks, rapid reopening, retained form values, FAQ, mobile navigation, and
actual intermediate animation frames with OS reduced motion emulated. Portal
navigation also checks link dismissal and a mobile-to-desktop breakpoint change.

Browser traces/screenshots go to ignored `test-results/`. Fixtures are dev-only
test entries and are not included in the production app's route tree/build.
