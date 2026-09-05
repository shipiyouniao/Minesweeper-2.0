# Expedition save policy

The game supports **one current expedition implementation**. When a rules update invalidates an active expedition, the explorer returns to camp. Permanent supplies, purchases, completion counts and records are preserved. Old generators, combat resolvers, reward tables and localized rule variants are removed instead of retained for replay.

The pointer-controls and deliberate-exit release uses rules revision **4**. Earlier version-4 journals bank their recorded extraction checkpoint and return to camp without replay.

## This transition

Envelope versions 1–3 do not store an independent extraction value. Each active journal in these formats is retired with **200 supplies of compensation**. This includes the most recently released `tactics-v2` journals. A present, non-null journal receives compensation even if its obsolete payload is malformed; its contents are never replayed. A camp-only or already-settled save receives no compensation. Retirement does not count as a victory or defeat and does not add a fabricated result.

The compensation and removal of the journal are written as one complete envelope. Reloading the resulting camp cannot award compensation again. If storage rejects the write, the app reports unavailable storage; retrying the same normalized state does not add another credit. Reloading an unwritten old envelope starts from its original camp balance, so the credit cannot compound.

## Future rules updates

Envelope version 4 stores `rulesRevision` and `returnSupplies` with the active journal. Every accepted action checkpoints the amount that ordinary extraction would currently bank, including the selected difficulty multiplier. It excludes an unearned victory bonus. Normal victory, defeat or extraction still settles atomically and removes the active journal.

On load, the persistence boundary compares the journal revision with `EXPEDITION_RULES_REVISION` in `src/persistence/expedition-format.ts`:

- Matching revision: validate the departure and replay its accepted intents through the current engine. Serialized boards, health and tool counters are not used.
- Different rules revision in a version-4 envelope: read the bounded extraction checkpoint, credit it to camp and discard the journal without interpreting its actions.
- Malformed current journal: retain valid camp progress and records, discard the invalid run and report recovery. Invalid checkpoints never create credit.

`returnSupplies` is a local recovery value, bounded to 0–10,000 whole supplies, not an alternative source of active-run resources. Camp and checkpoint fields have the same local-storage trust boundary. Records and permanent ownership remain independently validated.

Camp balances use exact non-negative JavaScript integers. Credit saturates at `Number.MAX_SAFE_INTEGER`, so even a manually supplied extreme balance remains loadable after settlement; a return notice reports the amount actually credited.

## Maintenance rule

Increment `EXPEDITION_RULES_REVISION` when changing anything that can invalidate deterministic replay: generation, accepted intents, movement, combat, profession effects, relic effects or rewards. Keep the version-4 envelope stable for these changes. Update the current implementation and its tests; do not add a branch for the previous revision.

Presentation, translations, artwork and compiler changes that preserve replay do not require a revision bump. Tests and browser fixtures import the current revision constant. Schema migrations may keep a small envelope reader, but must not retain obsolete gameplay engines.

This policy applies to expeditions and their camp. Classic and Twin saves use independent slots. Their progress is not modified by expedition retirement.

Classic's unchanged rules preserve active boards; absent note metadata initializes to an empty list at the decoder boundary. Twin notes and quick-open commands use its existing typed replay journal. Neither mode keeps an older game engine.

## Verification

`tests/expedition-retirement.test.ts` covers versions 1–3, one-time compensation, camp-only saves, checkpoint extraction, malformed journals, current replay, normal settlement and storage-write failures. `tests/browser/retirement.mjs` checks the return notice, retained purchases, refresh behavior and new departures in English, Chinese and Japanese at 320, 1280 and 3840 pixels. Existing battle, reward, settlement and scroll browser regressions run against current journals.

Both compiler test routes remove their own generated test directory before compiling. Deleted historical test files therefore cannot survive as stale JavaScript and execute after their source has been removed.
