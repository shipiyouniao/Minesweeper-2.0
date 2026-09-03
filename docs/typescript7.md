# TypeScript 7 native experiment

## What actually runs

The project pins `typescript@7.0.2`. Its `tsc` launcher resolves and executes the platform-native compiler binary. The old JavaScript TypeScript compiler is not installed as a fallback.

The native compiler owns strict checking, JavaScript emission, declaration emission, watch mode, and compilation of the tests. `index.html` imports `.native/app/main.js`, so Vite bundles the native compiler's output instead of transpiling the application TypeScript itself. Tests run with Node's built-in test runner after the same compiler emits them.

The code enables strict optional-property and indexed-access checks, `erasableSyntaxOnly`, unused checks, and library checking. One concrete migration adjustment was replacing a constructor parameter property with an explicit class field because `erasableSyntaxOnly` rejects that syntax.

## Reproduce

```sh
npm ci
npm run check
npm run dev
npm run bench:types
npm run bench:types -- --files 2000
```

The benchmark generates files under ignored `.bench/`, runs three fresh compiler processes for each scenario, and stores wall-clock samples and native `--extendedDiagnostics` in `.bench/results.json`. It also checks that an intentionally invalid assignment is rejected with TS2322. Failed compilations and timeouts fail the script; they are not counted as successful timing samples.

## September 3, 2026 exploratory sample

Windows x64, Node 22.18.0, TypeScript 7.0.2. This was an interactive development machine with a dev server and other activity, not an isolated benchmark host. The processes were fresh, but filesystem caches were not cleared between runs. Wall time includes the launcher and process startup.

| Workload | Median wall time, 3 runs |
| --- | ---: |
| Actual application, tests, Vite config and their library types | 1.372 s |
| 250 generated modules / 10,000 mapped event variants | 1.615 s |
| 1,000 generated modules / 40,000 mapped event variants | 20.971 s |
| Same 1,000 modules without the cross-module mega-union | 3.101 s |

The 40,000-variant aggregation's final sample reported 19.106 seconds of checking and approximately 362 MiB of compiler memory. Without that aggregation, the final sample reported 1.353 seconds of checking. These are final-sample diagnostics, distinct from the three-run wall-clock medians.

The generated modules contain object types, mapped types, discriminated event unions and indexed accesses. The global aggregator combines the events and maps their discriminants into one large type. **Inference from this controlled change:** the cross-module type aggregation is a substantial source of work in this example; file count alone does not explain its cost.

The negative type-error probe passed. The full captured output is in [typescript7-benchmark.json](typescript7-benchmark.json).

## What this does not establish

- It does not measure a maximum supported project size or prove that all 1,000-file projects have similar performance.
- It does not compare TypeScript 7 with TypeScript 6, or measure Go compiler speedups independently of workloads.
- A successful browser game does not validate every language-service, compiler API, framework integration or build-reference feature. This project specifically exercises CLI checking, emission, declarations and watch mode.
- Larger `--files` runs can consume considerably more time and memory because the global union deliberately stresses a difficult type shape. Keep source boundaries meaningful instead of routinely exporting one enormous union of everything.

For TypeScript 7 RC and later the official command is `tsc`; `tsgo` refers to the previous native-preview command. See [Microsoft's native compiler repository notice](https://github.com/microsoft/typescript-go).
