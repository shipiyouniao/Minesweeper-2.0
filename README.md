![Minesweeper 2.0 — A TypeScript 7 experiment, with ivory ceramic tiles and a cobalt flag](docs/assets/readme-banner.png)

# Minesweeper 2.0 — A TypeScript 7 Experiment

**New game modes:** choose from five difficulty tiers and play a 3–12-floor **Expedition** with relic builds, permanent camp unlocks, professions and equipment. Walk a generated explorer through connected floors, collect chests, probe 3×3 areas for locked mine confirmations or scan whole rows, and click the stairs to advance. Or solve **Twin boards**, where matching coordinates cannot both contain mines. Classic mode retains its own difficulties and records. See the [difficulty rules](docs/variant-difficulties.md) and [expansion Roadmap](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1). Read the [mode design and roadmap](docs/game-modes.md) for complete rules and the approved Sonar, Survey and Tides plans.

A playable Minesweeper game and a practical testbed for the **TypeScript 7 native compiler**. This repository revisits a first-year university project with a minimal interface, original artwork, a deterministic game engine, and a native TypeScript development workflow.

**[Play in your browser →](https://shipiyouniao.github.io/Minesweeper-2.0/)** · [Compiler experiment notes](docs/typescript7.md) · [Captured benchmark results](docs/typescript7-benchmark.json)

[Contributing](CONTRIBUTING.md) · [Code of conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [License](LICENSE)

## Why this project exists

The renovation is an experiment in using TypeScript 7 for an entire small application: editing, strict type checking, JavaScript and declaration emission, watch mode, tests, production builds, and deployment. Minesweeper provides real state transitions, browser interaction, persistence, localization, and test cases to exercise that workflow.

The questions behind the experiment are:

- Can the native compiler own the application's compilation pipeline from development through CI?
- What changes does a strict, native-compiled TypeScript codebase require in everyday development?
- How does checking behave as the workload grows from the actual game to hundreds or thousands of generated modules?
- How much does type structure, especially large mapped discriminated unions, affect that workload?

**This repository is an experimental application, not a claim that TypeScript 7 itself is a preview release.** It pins `typescript@7.0.2`, the released native compiler package. The game is available to play, while the repository documents the compiler setup, reproducible experiments, and their limitations.

## TypeScript 7, `tsgo`, and the actual build pipeline

The native TypeScript compiler originated as the Go port commonly called **`tsgo`**. For TypeScript 7 RC and later, the official command is **`tsc`**; `tsgo` was the command supplied by the earlier native-preview package. See [Microsoft's native compiler repository notice](https://github.com/microsoft/typescript-go).

Here, `typescript@7.0.2` is pinned in `package.json` and the lockfile. Its `tsc` launcher resolves and executes a platform-native compiler binary. The default workflow explicitly invokes this compiler. A separately named TypeScript 6 package supports the A/B experiment and a syntax-only contract-style check; it is never a compiler fallback.

The native compiler does more than run a separate type-check command:

```text
Application
  src/**/*.ts
      │ TypeScript 7 native: check + emit
      ▼
  .native/app/**/*.js + .d.ts
      │ Vite: bundle emitted JavaScript and process assets
      ▼
  dist/ → GitHub Pages

Tests
  tests/**/*.ts + tested source modules
      │ TypeScript 7 native: check + emit
      ▼
  .native/tests/ → Node.js built-in test runner
```

`index.html` imports `.native/app/main.js`. Vite therefore bundles the JavaScript emitted by TypeScript 7 instead of independently transpiling the application's TypeScript source. Vite remains responsible for the development server, asset processing, and production bundling; it does not replace the native compiler's role.

Authored contracts live in module-scoped `src/types/*.d.ts` files and are imported with `import type`. The compile script copies them beside the native-emitted declarations, because TypeScript does not re-emit declaration inputs. Build verification checks that this complete declaration graph resolves independently of `src/`.

| Area                   | How this repository exercises it                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Strict checking        | Application code, tests, and Vite configuration are checked together with `tsconfig.json`.                              |
| Application emission   | `tsconfig.app.json` emits JavaScript, source maps, and declarations into `.native/app/`.                                |
| Development watch      | The development script completes an initial native compile, then runs the compiler in watch mode alongside Vite.        |
| Test compilation       | `tsconfig.test.json` emits Node-compatible tests and their source dependencies before `node --test` executes them.      |
| Production integration | Vite bundles the native-emitted application; a separate script checks the output and Pages asset paths.                 |
| Diagnostic correctness | The benchmark includes an invalid assignment that must be rejected with `TS2322`.                                       |
| Scaling behavior       | Generated workloads compare large cross-module type aggregation with the same modules checked without that aggregation. |

### Compiler settings and migration choices

The shared configuration enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, unused-variable and parameter checks, switch fallthrough checks, and full library checking (`skipLibCheck: false`). It also uses `verbatimModuleSyntax` and `erasableSyntaxOnly`.

These settings make optional values, indexed access, and runtime/type import boundaries explicit. One concrete migration adjustment was replacing a constructor parameter property with an explicitly declared field and assignment, because the selected `erasableSyntaxOnly` setting rejects parameter properties. That is a consequence of the chosen configuration, not evidence that all TypeScript 7 projects must avoid them.

The application targets ES2023 and modern browsers. Generated JavaScript, declarations, test output, and synthetic workloads stay in ignored directories; source files remain the inputs to the experiment.

## Run locally

Use **Node.js 22.12 or later in the 22.x series, or Node.js 24 or later**, with npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/Minesweeper-2.0/**. The development command performs the first native compile before starting the server. Subsequent TypeScript edits are compiled by the native watcher and served through Vite.

| Command                         | Purpose                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run typecheck`             | Check application code, tests, and Vite configuration without emitting files.      |
| `npm run compile`               | Emit application JavaScript, source maps, and declarations with TypeScript 7.      |
| `npm test`                      | Compile tests with TypeScript 7 and execute them with Node's built-in test runner. |
| `npm run build`                 | Compile the application, then bundle it into `dist/` with Vite.                    |
| `npm run preview`               | Serve the production build locally after building.                                 |
| `npm run check`                 | Run formatting checks, type checking, tests, and the production build.             |
| `node scripts/verify-build.mjs` | Verify the built assets, native output, and GitHub Pages paths.                    |
| `npm audit`                     | Check the installed dependency tree for known advisories.                          |
| `npm run bench:types`           | Run the real-project and synthetic type-checking experiments.                      |

There are no runtime npm dependencies. The compilers, Vite, Node type definitions, and Prettier are development dependencies.

## Comparing the old and native build workflows

The [build A/B experiment](docs/build-ab.md) compares TypeScript 6 checking plus Vite source bundling against TypeScript 7 checking/emission plus Vite JavaScript bundling. Both use the same refactored application, strict settings, lockfile, assets, and bundler. It records check, emit, bundle, and total wall times plus artifact sizes, with repeated alternating runs locally and in branch CI.

Use `npm run build:legacy`, `npm run build:native`, and `npm run bench:build -- --runs 6`. The default `npm run build` remains the native workflow. The experiment branch does not deploy to Pages.

In the recorded six-run comparison, total build medians were **8.923 s → 3.980 s on Windows** and **2.859 s → 1.000 s in Ubuntu CI** (A → B). Both variants produced the same measured artifact sizes and passed the same 30 behavior tests. See the [full results and limitations](docs/build-ab.md#recorded-results--september-3-2026) for phase timings, raw data, and the exact measured commit.

Those measurements describe commit `74623c8`, before the explicit declaration-contract refactor. The current code has additional boundary tests and includes declaration copying in the native emission phase; the historical numbers are not measurements of the current tree.

## Exploring the compiler's limits

The benchmark script starts with this application's actual type-checking workload, then generates modules containing object types, mapped types, discriminated event unions, and indexed accesses. A global aggregator combines the events into a large union and maps their discriminants into another type. A companion scenario checks the same modules without the global aggregator.

```sh
npm run bench:types
npm run bench:types -- --files 2000
```

The default largest workload uses 1,000 generated modules. `--files` changes that size. Each timing scenario runs in three fresh compiler processes with native `--extendedDiagnostics`; the script records all wall-clock samples and the final run's diagnostic output in `.bench/results.json`. Generated sources also stay under `.bench/`.

Each timing run has a 120-second timeout. Compilation failures and timeouts fail the experiment rather than becoming successful timing samples. The separate negative probe must report `TS2322` for an intentionally invalid assignment.

### Recorded exploratory sample

Captured on **September 3, 2026**, using Windows x64, Node.js 22.18.0, and TypeScript 7.0.2:

| Workload                                                         | Median wall time across 3 runs |
| ---------------------------------------------------------------- | -----------------------------: |
| Actual application, tests, Vite configuration, and library types |                        1.372 s |
| 250 generated modules / 10,000 mapped event variants             |                        1.615 s |
| 1,000 generated modules / 40,000 mapped event variants           |                       20.971 s |
| The same 1,000 modules without the cross-module mega-union       |                        3.101 s |

The useful observation is the difference between the final two workloads: **type aggregation is a substantial source of checking work in this example**. File count alone does not explain the result. The full experiment, diagnostics, and memory observations are documented in [the experiment notes](docs/typescript7.md), with [the captured JSON report](docs/typescript7-benchmark.json) available for inspection.

These measurements came from an interactive development machine with other activity. Compiler processes were fresh, filesystem caches were not cleared, and wall time includes startup. They are exploratory measurements, not a controlled performance ranking.

### What remains unproven

- These workloads do not establish the compiler's maximum supported project size. Increasing `--files` explores one particular type shape, not every possible large application.
- There is no TypeScript 6 baseline here, so the results do not establish a version-to-version speedup.
- This project exercises CLI checking, emission, declarations, watch mode, and build integration. It does not validate every editor feature, language-service integration, compiler API consumer, framework plugin, or project-reference build.
- The synthetic global union deliberately creates expensive aggregation. Its behavior should not be generalized to all projects with the same number of files.

The repository is a starting point for further TS7 experiments. Any broader compatibility or performance claim should come with its own reproducible workload and measurements.

## The game

- Minimal ivory-and-blue interface with original artwork, responsive desktop and mobile layouts, and Chinese, English, and Japanese translations.
- Beginner: 9 × 9 with 10 mines; intermediate: 16 × 16 with 40 mines; expert: 30 × 16 with 99 mines; custom practice boards.
- A safe first click and safe neighboring cells, automatic blank-region expansion, flags, and number chording.
- Pause, automatic pause when leaving the page, saved progress per difficulty, and local top-10 records.
- A static website that runs without an account, application server, or NW.js installation.
- A compact, keyboard-accessible language flyout and optional, original synthesized interaction sounds.

| Action                  | Mouse                   | Touch / keyboard                      |
| ----------------------- | ----------------------- | ------------------------------------- |
| Reveal a cell           | Left-click              | Tap; Space or Enter                   |
| Toggle a flag           | Right-click             | Long press; flag mode; F              |
| Chord neighboring cells | Click a revealed number | Tap a revealed number; Space or Enter |
| Move board focus        | —                       | Arrow keys, Home / End                |
| Pause or resume         | Pause control           | P                                     |
| Start a new game        | New-game control        | N                                     |

Chording opens neighboring cells when the adjacent flag count matches the number. Incorrect flags can still cause a loss. The panel uses the available browser width, and square cells scale to their container. Wide boards take the full row on smaller desktop screens. Cells retain an 18 px minimum, so very wide boards on narrow phones still scroll instead of becoming unreadable; the scrolling hint appears only when needed. Keyboard focus is drawn above neighboring cells on every side. Custom boards are for practice and do not enter the preset-difficulty rankings.

Progress and records are stored in the current browser for the current site origin; they do not synchronize across devices. The game remains playable when storage is unavailable. Legacy `MinesweeperRank` records can migrate on the same origin, but unfinished legacy boards cannot. Old `game.html` and `menu.html` URLs, including supported language and difficulty parameters, redirect to the new application.

### Language and sound

On first visit, the primary browser language selects Chinese (`zh-*`) or Japanese (`ja-*`); every other language falls back to English. A saved manual choice takes precedence over the browser, and a supported `?lang=zh`, `?lang=en`, or `?lang=ja` link overrides both. Choosing a language updates that link parameter and saves the preference, so an old URL cannot undo the new choice on reload. Unsupported link values fall through to the saved choice or browser language.

The language flyout takes visual inspiration from [VitePress's translation control](https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/components/VPNavBarTranslations.vue), implemented here without Vue or another dependency. Click or press Enter/Space to open it, use arrows or Home/End to choose an option, and press Enter/Space to select. Escape returns focus to the trigger; Tab and outside clicks dismiss the menu.

The speaker button beside the game title toggles sound and remembers the setting. Short Web Audio sine envelopes provide reveal, flag, unflag, win, and loss cues, plus feedback for difficulty/record tabs, menu opening and dismissal, keyboard navigation, form edits, confirmations, and rejected actions. Navigation and typing use quieter notes. Gameplay cues take priority over incidental menu dismissal from the same gesture, while rapid repeats are bounded to avoid a wall of sound. Muting takes effect immediately and stays silent.

These are original procedural sounds, not recordings or AI-generated audio files, and require no downloads. Sound is enabled by default but the audio context is created only after a user gesture; loading the page is silent. Backgrounding and hot-reload teardown cancel pending playback. A flood reveal produces one cue, and unsupported or blocked audio does not prevent play.

## Mine placement: shuffle positions, then select

The board is generated on the first reveal:

1. Exclude the clicked cell and all of its neighbors from the candidate positions.
2. Shuffle the remaining positions with seeded Fisher–Yates.
3. Select the first M distinct positions for exactly M mines.
4. Compute the neighboring mine counts.

The game seed comes from browser `crypto.getRandomValues`. A seeded PRNG drives the shuffle, and bounded random indices use rejection sampling to avoid modulo bias. Given the same configuration, seed, and first-click position, the layout is reproducible for tests and saved games.

Placement takes O(number of cells) time and needs no repeated attempts to place a mine in an unused position. Blank-region expansion uses an iterative queue to avoid recursive stack growth. A safe opening does **not** guarantee that every board can be solved without guessing.

## OOP + FP architecture

The application uses a functional core for game rules and derived presentation, with objects owning session state, timing, persistence, DOM elements, and input lifetimes. `GameSession` coordinates the pure engine and injected services; `MinesweeperApp`, `AppView`, `BoardView`, and `InputController` own distinct UI responsibilities. Read the [architecture guide](docs/architecture.md) for the dependency diagram, move lifecycle, pause rules, and commenting conventions.

Run `npm run format` to apply the pinned formatter. `npm run format:check` is included in local checks and CI.

### Explicit type contracts

This project declares named interfaces and type aliases in `src/types/*.d.ts`, grouped by domain: game, session, storage, localization, icons, and UI. Implementation modules contain behavior and import these contracts explicitly. The files are modules, so they do not add application types to the global namespace.

- Business APIs use concrete models and small unions. For example, a `Preference` pairs a language key with a `Language` value, while `FormSubmission` pairs each form kind with its own payload.
- Message tables implement an explicit `Messages` interface. Types are not inferred from a particular translation or assembled with mapped/conditional types.
- Persistence decoders turn serialized JSON into `GameSnapshot`, `StoredSession`, and `Score` values. A recursive JSON value union stays inside the parsing boundary; it never becomes a business API parameter. Domain values are constructed after validation instead of asserted onto parsed objects.
- `InputController` decodes DOM attributes, key names, and form data before calling typed application operations. Runtime validation remains necessary for browser input and stored data.

`npm run check:contracts` enforces module-scoped declaration files and rejects application `any`, `unknown`, mapped types, and conditional types. It uses the legacy package's syntax parser only for this style check; TypeScript 7 remains the default checker and emitter. Compile-only negative probes also ensure both compilers reject invalid preference, form, and UI-command combinations. Synthetic compiler stress workloads remain separate under `scripts/` and `.bench/`.

### Source layout and verification

| Location                                          | Responsibility                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/game/engine.ts`                              | Pure, immutable game transitions, seeded placement, flood fill, chording, and snapshot validation. |
| `src/storage.ts`                                  | Local progress, records, legacy migration, and graceful handling of unavailable storage.           |
| `src/main.ts`                                     | Composition root: connect the browser adapters, session, repository, and UI.                       |
| `src/i18n.ts`                                     | Translations with a shared, compile-checked message shape.                                         |
| `src/icons.ts`, `src/style.css`, `src/tokens.css` | Original SVG controls and the visual system.                                                       |
| `tests/`                                          | Engine, session lifecycle, persistence, and presentation regression tests.                         |
| `scripts/`                                        | Native development orchestration, build verification, and compiler experiments.                    |
| `docs/`                                           | Experiment notes, captured measurements, and artwork provenance.                                   |

The engine does not depend on the DOM, clock, or browser storage. That boundary lets tests check game behavior directly and lets saved games regenerate mine positions and clues instead of trusting stored cell data.

The test suite covers exact mine counts, uniqueness, safe openings across seeds and difficulty presets, deterministic layouts, independently calculated adjacency counts, flood fill, flags, winning and losing, correct and incorrect chording, dense and large boards, invalid snapshots, local records, and unavailable storage.

## CI and GitHub Pages

[The workflow](.github/workflows/pages.yml) runs on pull requests, pushes to `main`, and manual dispatch. Its validation job performs:

```sh
npm ci
npm audit
npm run check
node scripts/verify-build.mjs
```

Pull requests run validation. Pushes to `main` and manual runs on `main` also upload `dist/` and deploy it to GitHub Pages after validation succeeds. The public game is hosted at [shipiyouniao.github.io/Minesweeper-2.0](https://shipiyouniao.github.io/Minesweeper-2.0/).

For a fork, set **Settings → Pages → Source** to **GitHub Actions**. The current Vite `base` is `/Minesweeper-2.0/`; update `vite.config.ts` and the expected path in `scripts/verify-build.mjs` if the repository name or hosting path changes.

## Artwork and project history

The README cover, ceramic-board illustration, and SVG icons were created for this renovation. [Artwork notes](docs/artwork.md) document the assets and the complete image-generation prompts. The original application's source and images remain available in Git history.

The original project was created by **SPYN** as an engineering practice assignment.

## Contributing and community

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, architecture and type conventions, validation, and pull request guidance. Use the repository's issue forms for bugs and proposals, follow the [code of conduct](CODE_OF_CONDUCT.md), and report suspected vulnerabilities through the [security policy](SECURITY.md).

## License

The project is licensed under the [MIT License](LICENSE). This covers the current project's code, documentation, and original artwork; third-party dependencies retain their own licenses and notices. The MIT license replaces the original edition's non-commercial usage notice for this version of the project.
