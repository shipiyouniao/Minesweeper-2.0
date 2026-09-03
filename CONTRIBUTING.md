# Contributing to Minesweeper 2.0

Thanks for helping improve this small game and its TypeScript 7 experiment. Bug reports, accessibility improvements, translations, clearer explanations, and reproducible compiler measurements are welcome.

Read the [architecture guide](docs/architecture.md) before changing application behavior. For a large feature or toolchain change, open an issue first to explain the problem and proposed scope.

## Report a bug or suggest an improvement

Search [existing issues](https://github.com/shipiyouniao/Minesweeper-2.0/issues) before opening a new one. Include steps to reproduce, expected and actual behavior, and your browser or Node.js version. For a game bug, include the difficulty and whether you restored a saved game. Screenshots help with visual and accessibility issues.

Use the [security policy](SECURITY.md) for suspected vulnerabilities. Do not publish exploit details, credentials, or private browser data in a public issue.

## Set up a development environment

Use Node.js 22.12 or later in the 22.x series, or Node.js 24 or later, with npm.

1. Fork the repository and clone your fork.
2. Create a focused branch from the latest `main`.
3. Install the locked dependencies and start the native compiler and development server:

```sh
npm ci
npm run dev
```

Open [the local game](http://127.0.0.1:5173/Minesweeper-2.0/). The default compiler is the pinned TypeScript 7 native compiler. Do not replace it with a global `tsc` or rely on the legacy alias's executable.

## Keep the architecture readable

- Keep game rules and derived presentation in pure functions. Pass randomness, time, storage, and browser effects through their owning services and adapters.
- Use objects to own session state, clocks, DOM elements, and listener lifetimes. Release timers and listeners when an object is disposed.
- Declare named interfaces and type aliases in module-scoped `src/types/*.d.ts` files and consume them with `import type`.
- Use concrete object models and small unions. Use a discriminated union when a command kind determines its payload. Application code should not introduce `any`, `unknown`, mapped types, or conditional types.
- Parse stored JSON and browser input at their boundaries. Construct validated domain values; do not cast arbitrary input to a domain interface.
- Give named functions, methods, and lifecycle callbacks a documentation comment explaining their purpose. Add internal comments for decisions and invariants, and blank lines between validation, calculation, effects, and return values.
- Keep the interface minimal and keyboard accessible. Preserve covered-cell privacy in both visible markup and accessibility labels. Update all three translations when changing message contracts.

Run `npm run format` to apply the pinned formatter. Keep unrelated formatting, dependency updates, and generated files out of your change. The intentionally complex synthetic compiler workloads live separately from application code.

## Validate a change

The standard CI checks are:

```sh
npm ci
npm audit
npm run check
node scripts/verify-build.mjs
```

These check formatting, declaration conventions, strict types, behavioral tests, the native production build, Pages paths, and the emitted declaration graph. Add or adjust a regression test when changing behavior; documentation and artwork changes generally do not need new behavior tests.

For UI changes, also try the affected interaction in a browser, including keyboard controls and a narrow viewport when relevant. For persistence changes, check both restored progress and unavailable storage.

For compiler, type-contract, or build-pipeline changes, check the legacy route too:

```sh
npm run test:legacy
npm run build:legacy
npm run build:native
```

For performance claims, follow [the A/B measurement method](docs/build-ab.md): run `npm run bench:build -- --runs 6` on a clean, identified commit with development watchers stopped. Include raw samples, environment and tool versions, the build-input fingerprint, and limitations. Keep historical reports tied to their measured commits; do not relabel old measurements as results for new code.

## Submit a pull request

Open the pull request against `main`. Explain the concrete problem, resulting behavior, and checks you ran. Include before/after screenshots for visual changes and reproduction details for bug fixes. Keep one coherent change per pull request and respond to review feedback in that scope.

Do not commit `node_modules/`, `dist/`, `.native/`, or generated `.bench/` trees. Selected benchmark reports belong in `docs/` with their provenance. New artwork should be stored in the repository with an accurate description of its source and any generation prompt in [artwork notes](docs/artwork.md).

Pull requests run validation. Only the `main` branch can deploy the public game through the Pages workflow.

## Contribution terms

Submit only work you are entitled to contribute. Contributions are offered under the repository's [license](LICENSE); retain applicable third-party notices and identify any material with different terms. No separate contributor license agreement or sign-off is required. Please follow the [code of conduct](CODE_OF_CONDUCT.md).
