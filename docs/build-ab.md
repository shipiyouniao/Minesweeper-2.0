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

`typescript-legacy` is an npm alias pinned to `typescript@6.0.3`, used for the A/B baseline, legacy test run, and syntax-only contract-style checker. The default development/build/test commands still explicitly invoke `node_modules/typescript/bin/tsc` from TypeScript 7. Explicit paths avoid ambiguity from two packages exposing a command named `tsc`.

The current native emission phase invokes `scripts/compile.mjs`, including wrapper startup and copying authored `src/types/*.d.ts` contracts beside the emitted declarations. The captured results below predate this contract refactor and measure the original direct compiler invocation. Rerun both variants to measure the current source and pipeline; do not treat the historical results as current timings.

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

## Recorded results — September 3, 2026

Both measurements used commit [`74623c8`](https://github.com/shipiyouniao/Minesweeper-2.0/commit/74623c8c0cc0924107a3c44ece118e4a82a50436) with a clean worktree. Their normalized build-input fingerprint is identical:

```text
ba2ff54fc96247488c41cfc14b707aa045a6a07675ad4b781620cbee0ba459e2
```

The records below remain pinned to that measured commit. Later documentation-only commits do not change the measured workload. Node.js 22.18.0, TS6 6.0.3, TS7 7.0.2, and Vite 8.2.2 were used in both environments.

| Environment                          | Variant               | Check median | Emit median | Vite median | Total median |  Total min–max |
| ------------------------------------ | --------------------- | -----------: | ----------: | ----------: | -----------: | -------------: |
| Windows x64, interactive workstation | A: TS6 + Vite source  |      7.939 s |           — |     0.981 s |  **8.923 s** | 6.894–12.898 s |
| Windows x64, interactive workstation | B: TS7 emit + Vite JS |      1.823 s |     1.055 s |     0.835 s |  **3.980 s** |  2.733–6.979 s |
| Ubuntu x64, GitHub Actions           | A: TS6 + Vite source  |      2.640 s |           — |     0.206 s |  **2.859 s** |  2.828–2.970 s |
| Ubuntu x64, GitHub Actions           | B: TS7 emit + Vite JS |      0.495 s |     0.301 s |     0.204 s |  **1.000 s** |  0.991–1.024 s |

There are six samples per row. The local machine had its development/preview servers stopped but remained an interactive workstation, and its results show substantial variability. The CI job measured both variants serially on one four-vCPU runner. Its reported processor model and runner image are preserved in the JSON; these are machine-reported metadata, not a promise of dedicated physical hardware.

For this workload, B used **55.4% less total time locally** and **65.0% less total time in CI**, calculated from the ratios of total medians. In CI, Vite's own median bundle time was essentially unchanged (0.206 versus 0.204 seconds). The reduction came from the checking/emission stages: native checking saved more time than the additional native emission cost. This is an observation about these workflows and this source tree, not a general speedup guarantee.

### Output size and behavior

Both variants produced the same measured sizes in both environments:

| Artifact measure                                      |               A |               B |
| ----------------------------------------------------- | --------------: | --------------: |
| JavaScript                                            |    40,856 bytes |    40,856 bytes |
| JavaScript, gzip                                      |    14,899 bytes |    14,899 bytes |
| CSS                                                   |    15,575 bytes |    15,575 bytes |
| Complete site, including artwork and legacy redirects | 1,107,589 bytes | 1,107,589 bytes |

All 30 behavior tests passed when compiled with each compiler, locally and in CI. Both local production artifacts were exercised in a browser through first reveal, pause, custom-board creation, and a completed win. The native artifact also restored paused progress after reload. No browser errors were observed during these checks. These checks establish the exercised behavior; they do not constitute a browser-runtime speed benchmark.

### Evidence and reproduction records

- Windows: [readable report](benchmarks/build-ab-windows.md), [all raw samples and diagnostics](benchmarks/build-ab-windows.json).
- Ubuntu CI: [readable report](benchmarks/build-ab-linux-ci.md), [all raw samples and diagnostics](benchmarks/build-ab-linux-ci.json).
- [Successful measured CI run](https://github.com/shipiyouniao/Minesweeper-2.0/actions/runs/33740190189), including its downloadable reports and both production sites.

The JSON contains every phase sample, so the medians and ranges can be recalculated without rerunning the experiment.

## Interpretation limits

This is a small application and a workflow comparison. It is not a maximum-size test, a statistical claim about all repositories, a watch/HMR latency measurement, or a browser-runtime performance benchmark. B performs extra work by producing native JavaScript and declarations. Differences in output size can come from emitter/minifier interactions and are reported rather than assumed away.

The earlier [synthetic type-shape experiment](typescript7.md) answers a different question. Its recorded application timing predates the OOP/FP refactor and should not be compared directly with the build timings in this experiment.
