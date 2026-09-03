# TypeScript build A/B measurement

- Measured commit: `74623c8c0cc0924107a3c44ece118e4a82a50436`; worktree dirty: `false`.
- Build-input SHA-256: `ba2ff54fc96247488c41cfc14b707aa045a6a07675ad4b781620cbee0ba459e2`.
- Environment: win32 x64, Node v22.18.0, Intel(R) Core(TM)2 Duo CPU T7700 @ 2.40GHz, 4 logical CPUs.
- Toolchain: TypeScript 6.0.3 / 7.0.2, Vite 8.2.2.
- 6 measured runs per variant, alternating A/B and B/A; one excluded warm-up per variant.
- Fresh output directories, Vite caches, and compiler/bundler processes per sample. Filesystem/OS caches are not flushed; package installation is excluded.

| Variant                       | Check median | Emit median | Vite median | Total median |  Total min–max |
| ----------------------------- | -----------: | ----------: | ----------: | -----------: | -------------: |
| A: TS6 check + Vite source    |      7.939 s |           — |     0.981 s |      8.923 s | 6.894–12.898 s |
| B: TS7 check + emit + Vite JS |      1.823 s |     1.055 s |     0.835 s |      3.980 s |  2.733–6.979 s |

| Variant | JS bytes | JS gzip bytes | CSS bytes | Total artifact bytes |
| ------- | -------: | ------------: | --------: | -------------------: |
| A       |    40856 |         14899 |     15575 |              1107589 |
| B       |    40856 |         14899 |     15575 |              1107589 |

The B/A ratio of total medians is **0.446** for this run. Phase medians need not sum to the total median. B includes native JavaScript, source-map, and declaration emission; A does not emit declarations. These are complete workflow costs, not an isolated compiler speed comparison or a browser-runtime benchmark.

Every sample passed type checking, bundling, and artifact-path verification. Raw samples, phase diagnostics, environment metadata, and artifact inventories are recorded in the accompanying JSON. Timing noise and workload size limit generalization.
