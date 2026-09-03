# TypeScript 6 + Vite versus TypeScript 7 native + Vite

This experiment compares two complete build workflows for the same refactored Minesweeper application. It runs on the `refactor/oop-fp-ts7-ab` branch and does not deploy that branch to GitHub Pages.

## The two variants

| Phase                         | A: conventional Vite workflow              | B: native TypeScript workflow                                                         |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Type checking                 | TypeScript 6.0.3, `tsconfig.json`, no emit | TypeScript 7.0.2, the same `tsconfig.json`, no emit                                   |
| Separate application emission | None                                       | TypeScript 7 emits JavaScript, source maps, and declarations with `tsconfig.app.json` |
| Vite entry                    | `src/main.ts`                              | The native-emitted `main.js`                                                          |
| Bundler                       | Vite 8.2.2                                 | Vite 8.2.2                                                                            |
| Production target             | ES2023                                     | ES2023                                                                                |
| Output                        | `.bench/ab/legacy/dist/`                   | `.bench/ab/native/dist/`                                                              |

Vite performs TypeScript transpilation with its own transformer; it does not invoke the TypeScript 6 compiler to transpile application modules. A therefore runs a separate TS6 type-check step before Vite consumes the source, following [Vite's documented separation of checking and transpilation](https://vite.dev/guide/features.html#typescript).

B exercises the project's native-emission architecture, including declarations and source maps. That extra emission performs application checking again. Its measured total includes this cost; the experiment does not disguise it as a pure compiler comparison or subtract it from the result.

`typescript-legacy` is an npm alias pinned to `typescript@6.0.3`, used only for the A/B baseline and legacy test run. The default development/build/test commands still explicitly invoke `node_modules/typescript/bin/tsc` from TypeScript 7. Explicit paths avoid ambiguity from two packages exposing a command named `tsc`.

## Reproduce

```sh
npm ci
npm run check
npm run test:legacy

# Build and inspect either complete pipeline individually.
npm run build:legacy
npm run build:native

# One warm-up per variant, followed by six measured runs per variant.
npm run bench:build -- --runs 6
```

The benchmark writes `.bench/ab/results.json` and `.bench/ab/report.md`. Both production sites remain in their separate output directories for inspection. Do not run a development watcher or change source files while measuring.

## Measurement method

- Both variants use the same source tree, dependency lockfile, strictness configuration, Vite settings, target, public assets, and runner. Only the compiler/checking/emission route and entry module differ.
- There is one excluded warm-up for each variant. Six measured rounds alternate A/B and B/A order, giving each variant three first and three second positions.
- Every measured compiler and bundler runs in a fresh process. Each variant's output and Vite cache directories are cleared before its run. OS/filesystem caches are not flushed.
- Each phase records startup-inclusive wall time. Total time starts immediately before checking and stops after Vite completes. Artifact inspection and gzip accounting happen afterward and are excluded.
- The report includes phase medians, the median and range of total times, raw samples, final artifacts, compiler diagnostics, tool versions, OS/CPU metadata, and Git identity.
- A SHA-256 fingerprint covers build and test inputs with normalized text line endings. Documentation-only commits can therefore be distinguished from changes to the measured workload. A run fails if those inputs change during measurement.
- Failed checks, failed bundles, missing Pages assets, and phase timeouts fail the experiment. They are never retained as successful samples.
- Both compilers also compile and execute the same behavior tests outside the timed build loop. Production output is inspected separately in a browser.

Phase medians need not sum to the median of total times. Artifact gzip sizes use Node's gzip implementation and describe compression accounting, not an observed network transfer. The decorative image dominates total site size and is identical between variants.

## CI and result records

[The A/B workflow](../.github/workflows/ab.yml) performs installation, dependency audit, formatting checks, native checks/tests/build, Pages path validation, legacy-compiled tests, and the complete comparison on one Ubuntu runner using Node.js 22.18.0. It publishes a readable job summary and an artifact containing the JSON, Markdown report, and both sites.

The Pages workflow only deploys `refs/heads/main`, including for manual dispatch. The experiment workflow has read-only repository permissions and no deployment job.

Measured local and CI results will be recorded here after the branch workflow completes, together with the exact measured commit and build-input fingerprint.

## Interpretation limits

This is a small application and a workflow comparison. It is not a maximum-size test, a statistical claim about all repositories, a watch/HMR latency measurement, or a browser-runtime performance benchmark. B performs extra work by producing native JavaScript and declarations. Differences in output size can come from emitter/minifier interactions and are reported rather than assumed away.

The earlier [synthetic type-shape experiment](typescript7.md) answers a different question. Its recorded application timing predates the OOP/FP refactor and should not be compared directly with the build timings in this experiment.
