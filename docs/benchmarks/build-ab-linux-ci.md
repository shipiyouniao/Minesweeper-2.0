# TypeScript build A/B measurement

- Measured commit: `74623c8c0cc0924107a3c44ece118e4a82a50436`; worktree dirty: `false`.
- Build-input SHA-256: `ba2ff54fc96247488c41cfc14b707aa045a6a07675ad4b781620cbee0ba459e2`.
- Environment: linux x64, Node v22.18.0, AMD EPYC 9V74 80-Core Processor, 4 logical CPUs.
- Toolchain: TypeScript 6.0.3 / 7.0.2, Vite 8.2.2.
- 6 measured runs per variant, alternating A/B and B/A; one excluded warm-up per variant.
- Fresh output directories, Vite caches, and compiler/bundler processes per sample. Filesystem/OS caches are not flushed; package installation is excluded.

| Variant                       | Check median | Emit median | Vite median | Total median | Total min–max |
| ----------------------------- | -----------: | ----------: | ----------: | -----------: | ------------: |
| A: TS6 check + Vite source    |      2.640 s |           — |     0.206 s |      2.859 s | 2.828–2.970 s |
| B: TS7 check + emit + Vite JS |      0.495 s |     0.301 s |     0.204 s |      1.000 s | 0.991–1.024 s |

| Variant | JS bytes | JS gzip bytes | CSS bytes | Total artifact bytes |
| ------- | -------: | ------------: | --------: | -------------------: |
| A       |    40856 |         14899 |     15575 |              1107589 |
| B       |    40856 |         14899 |     15575 |              1107589 |

The B/A ratio of total medians is **0.350** for this run. Phase medians need not sum to the total median. B includes native JavaScript, source-map, and declaration emission; A does not emit declarations. These are complete workflow costs, not an isolated compiler speed comparison or a browser-runtime benchmark.

Every sample passed type checking, bundling, and artifact-path verification. Raw samples, phase diagnostics, environment metadata, and artifact inventories are recorded in the accompanying JSON. Timing noise and workload size limit generalization.
