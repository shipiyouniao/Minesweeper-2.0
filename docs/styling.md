# UI styling

Tailwind CSS 4 is compiled through `@tailwindcss/vite` in development and all production/A–B builds. No browser CDN or runtime framework is used.

## New UI

Use prefixed utilities (`tw:flex`, `tw:gap-2`, `tw:hover:bg-accent-soft`) in UI templates. Keep complete class names in source: do not construct partial names such as `tw:bg-${color}`. Choose between complete literal strings instead.

`src/tailwind.css` explicitly scans `src/ui`; generated `.native` and benchmark output are not class sources. Add a source directive if a future template directory needs scanning. The three compilers/bundler routes therefore share the same stylesheet inputs.

The theme aliases the existing runtime palette in `src/tokens.css`: paper, surface, surface-alt, ink, muted, line and accent colors. Use these semantic colors rather than unrelated default palette values. `rounded-panel` and `text-caption` define the first shared panel primitives.

## Gradual migration

The expedition Sonar reading panel is the first migrated component: its shell, spacing, scrollable history and hover/focus/selected buttons use utilities. Semantic classes remain available for behavior and browser tests. Removed its duplicate custom CSS.

Existing resets remain in place; Tailwind Preflight is deliberately omitted while the game relies on existing heading, button and image defaults. Generic border/background resets live in the `base` layer so utility hover/focus/selected states can override them. All legacy styles now share the `components` layer, below `utilities`, through the single `src/style.css` entry. Existing selector order is preserved within that layer. When migrating another component, remove the corresponding legacy declarations rather than using `!important` to fight them. Borders should explicitly use `tw:border-solid` because Preflight is absent.

Keep board geometry, character movement, mine effects and encounter animations in their specialized CSS. Extract a reusable template helper when markup repeats; do not introduce another global selector for every new panel.

## Build and checks

Use plain CSS imports in the shared entry (`@import './tailwind.css'`). Mixing Tailwind expansion with later `@import url(...)` can leave imports after generated rules and discard styles. The normal `src/style.css` entry also serves local preview pages.

Run `npm run check`, `node scripts/verify-build.mjs`, and both A–B build routes when changing integration. Run browser checks against development and the built preview: `tests/browser/echo.mjs` checks actual computed panel padding, border and radius, plus reading-button hover, keyboard focus and selected colors as well as mouse/touch targeting across locales and viewport sizes.

References: [Vite installation](https://tailwindcss.com/docs/installation/using-vite), [disabling Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight), [explicit source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).

The relic menu shell and disclosure header also use utilities, including hover and keyboard-focus feedback. Its content layout now uses gameplay utilities; shared play-scale rules remain specialized CSS.

The relic header icon retains its component CSS size override. New utility sizing can now override shared sprite defaults because of the explicit layer order. Browser acceptance checks its rendered 28px dimensions.

## Camp and progression migration

Camp overview, navigation, wallet, departure summary, locked equipment panel, shop filters/tiles/details, mission and achievement cards, and title selection use complete utility strings in `src/ui/camp-styles.ts` and `src/ui/progression-styles.ts`. Templates retain semantic classes and data attributes for interactions and accessibility. Responsive grid positions still use the existing runtime CSS variables; utilities reference their complete names.

The single stylesheet entry imports the legacy sheets in their original order within `components`. `src/legacy.css` contains the previous general page styles; this is relocation, not a claim that those components have migrated. Do not also link an individual legacy sheet directly from HTML, which would bypass its layer. The reset remains in `base`; Preflight stays disabled. Board geometry, mobility effects, and notice animation/progress pseudo-elements remain specialized CSS.

Run camp and milestone browser acceptance on the production preview, title/notice acceptance on the development server (it imports the notice controller for its fixture), and Echo acceptance on both. Camp coverage includes 320–3840px layouts, purchases, locked tools, keyboard/touch, persistence and selected states. Milestone coverage includes ready/claimed colors and icon sizing. For this migration, 28 before/after camp views at 390/900/1050/1440px matched computed geometry, typography and colors exactly.

## Gameplay migration

`src/ui/gameplay-styles.ts` contains the complete utility groups for the shared action dock, tool states, skill popover and tooltip, compact tactical panel, run overview, relic contents, extraction button and expedition reward/result dialogs. Keep semantic hooks and dynamic dialog classes: the dialog host includes state-scoped utilities before switching between rewards and settlement.

Shared play-scale defaults and native meter rendering remain component CSS. Moving those broad defaults into utilities would override more specific UI groups migrated earlier. Tooltip arrows/disclosure glyphs remain small CSS pseudo-elements. The scrolling host's reserved dock space stays in CSS with the page geometry.

The narrow combat-button width ranges do not overlap: below 390px uses 68px controls, while 390–900px uses 88px controls. This avoids relying on the ordering of arbitrary media variants. Below 390px, a carried/loaned Sonar gives the five equipment-row entries equal flexible widths so the dock still fits its reserved space.

Run `tests/browser/gameplay-styles.mjs` on development and production: six boss fixtures, 320/390/1440/3840px, native touch tooltip toggling/dismissal, hover/focus, disabled presentation and board/dock clearance. Run reward/settlement, Sonar, Echo and expedition-layout acceptance as well. Reward scroll assertions target `.ruleset-host`, the actual scroll surface. Guidance fixtures use the current boss seed mapping.
