# UI styling

Tailwind CSS 4 runs through `@tailwindcss/vite` in development and all production/native/legacy builds. Interface presentation uses prefixed utilities; native element defaults, board geometry and visual effects keep dedicated CSS.

## Components

Use complete utility classes (`tw:flex`, `tw:gap-2`, `tw:hover:bg-accent-soft`) in UI templates. Never construct partial names such as `tw:bg-${color}`. Select complete literal strings instead. Keep semantic classes and data attributes for behavior, accessibility and browser tests.

Reusable groups live in `src/ui`:

- `shared-styles.ts`: header, language menu, buttons, rankings, forms, mode panels, zoom controls and milestone notifications.
- `camp-styles.ts` and `progression-styles.ts`: camp navigation, shop, loadouts, missions, achievements and titles.
- `gameplay-styles.ts`: action dock, tools, skill popovers, tactical sidebar, relic menu and reward/settlement dialogs.
- `guidance-styles.ts`: tutorials, boss arrivals, illustrated guides and Sonar panels/readings.

`src/tailwind.css` scans `src/ui` explicitly. Generated `.native` fixtures and benchmark output are not class sources. Add a source directive when introducing another template directory.

Use the semantic palette from `src/tokens.css`: paper, surface, surface-alt, ink, muted, line, accent, accent-soft and accent-line. Existing art-directed colors remain where needed. Borders must explicitly use `tw:border-solid` because Preflight is disabled.

## Styles retained as CSS

The migration does not replace the browser's native element defaults or the game's geometry with utility classes. `src/base.css` contains native heading/form/dialog defaults and shared board rules. Mode sheets retain cell sizing, overlays, clue badges, board scaling, movement/attack effects and native meter/progress pseudo-elements. The scroll host and reserved dock space remain together in CSS so controls cannot cover the board.

Shared play-scale defaults remain below utilities. Promoting a broad scaling selector into utilities can override more specific component groups. Keep that ordering when adding equipment, panels or board annotations.

## Cascade and responsive states

`src/style.css` is the only HTML stylesheet entry. It imports defaults and specialized sheets in the `components` layer, below `utilities`, preserving their relative order. Border/background resets are in `base`. Do not link a specialized sheet directly from HTML or mix plain imports with later `@import url(...)` after Tailwind expansion.

Arbitrary media variants are not ordered by their position in a class string. Use non-overlapping width ranges for properties that change at adjacent breakpoints. Preserve default rules that originally followed a media query; otherwise an obsolete mobile override can unexpectedly return.

Use scoped selectors for shared-control states: tutorial button colors, sound toggles, dialog eyebrows and completed notification colors must beat generic button/text defaults. Tutorial dialogs restore their complete original class list on close because they borrow another mode's dialog host.

## Verification

The [homepage redesign](home-and-navigation.md) adds `src/shell.css` for page composition, decorative mini-boards and shared glass surfaces. Glass, dock and dialog colors live in `tokens.css`; existing utility groups consume those tokens. Keep blur off ancestors of the fixed action dock, and keep clue-bearing cells opaque. Do not put filters or entry transforms on the scrolling route host. The glass theme has opaque fallbacks, and menu motion follows the existing reduced-motion rule.

Run `npm run check`, both `build:native` and `build:legacy`, and `node scripts/verify-build.mjs` for styling integration changes. Exercise production output as well as development.

- `tests/browser/shared-styles.mjs`: shared controls, responsive sizing, language menu, ranking dialog and keyboard focus in three languages.
- `camp.mjs`, `milestones.mjs`, `achievement-titles.mjs`: purchases, unlocks, title selection and queued notices. The notice fixture uses the development server.
- `gameplay-styles.mjs`, `rewards.mjs`, `expedition-layout.mjs`: six bosses, dock clearance, mouse/touch tooltips, rewards and scroll boundaries.
- `guidance.mjs`, `clock-sonar-guidance.mjs`, `dialogue.mjs`: tutorials, illustrated guides, arrival dialogue and per-character playback.
- `sonar.mjs`, `echo.mjs`, `localization.mjs`: scan interaction, reading selection and language changes.

The final shared-UI migration was checked against 38 pre-migration views at 320/390/800/1050/1440/3840px. Board geometry and interface dimensions/colors matched.
