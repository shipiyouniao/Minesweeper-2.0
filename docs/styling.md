# UI styling

Tailwind CSS 4 is compiled through `@tailwindcss/vite` in development and all production/A–B builds. No browser CDN or runtime framework is used.

## New UI

Use prefixed utilities (`tw:flex`, `tw:gap-2`, `tw:hover:bg-accent-soft`) in UI templates. Keep complete class names in source: do not construct partial names such as `tw:bg-${color}`. Choose between complete literal strings instead.

`src/tailwind.css` explicitly scans `src/ui`; generated `.native` and benchmark output are not class sources. Add a source directive if a future template directory needs scanning. The three compilers/bundler routes therefore share the same stylesheet inputs.

The theme aliases the existing runtime palette in `src/tokens.css`: paper, surface, surface-alt, ink, muted, line and accent colors. Use these semantic colors rather than unrelated default palette values. `rounded-panel` and `text-caption` define the first shared panel primitives.

## Gradual migration

The expedition Sonar reading panel is the first migrated component: its shell, spacing, scrollable history and hover/focus/selected buttons use utilities. Semantic classes remain available for behavior and browser tests. Removed its duplicate custom CSS.

Existing resets remain in place; Tailwind Preflight is deliberately omitted while the game relies on existing heading, button and image defaults. Generic border/background resets live in the `base` layer so utility hover/focus/selected states can override them. Existing unlayered component CSS still outranks layered utilities. When migrating another component, remove the corresponding legacy declarations rather than using `!important` to fight them. Borders should explicitly use `tw:border-solid` because Preflight is absent.

Keep board geometry, character movement, mine effects and encounter animations in their specialized CSS. Extract a reusable template helper when markup repeats; do not introduce another global selector for every new panel.

## Build and checks

Use plain CSS imports in the shared entry (`@import './tailwind.css'`). Mixing Tailwind expansion with later `@import url(...)` can leave imports after generated rules and discard styles. The normal `src/style.css` entry also serves local preview pages.

Run `npm run check`, `node scripts/verify-build.mjs`, and both A–B build routes when changing integration. Run browser checks against development and the built preview: `tests/browser/echo.mjs` checks actual computed panel padding, border and radius, plus reading-button hover, keyboard focus and selected colors as well as mouse/touch targeting across locales and viewport sizes.

References: [Vite installation](https://tailwindcss.com/docs/installation/using-vite), [disabling Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight), [explicit source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).

The relic menu shell and disclosure header also use utilities, including hover and keyboard-focus feedback. Its content layout and play-scale rules remain specialized CSS for a separate migration.

The relic header icon retains a component CSS size override: the shared unlayered `.dungeon-sprite` dimensions outrank layered utilities. Browser acceptance checks its rendered 28px dimensions.
