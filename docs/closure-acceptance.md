# Expedition closure audit — September 7, 2026

Historical snapshot: the subsequent [milestone balance pass](milestone-balance.md) supersedes the payout values below, and [title builds](title-builds.md) use rules revision 9. The audit's original calculations are retained for comparison.

This acceptance pass covers the six deliveries after Magnetic Knight through achievement titles: PRs #26–#31, ending at `44de01cc5b3abf703c74bec46d1ca344db634483`. It checks the existing game before starting Sonar. No new mode, price change or additional gameplay compatibility engine is included.

## Correctness and interaction

Dedicated Codex review found a magnetic forecast mismatch: a square on both the charge route and the anchor blast received two separate 5-damage hits, while its label advertised only 5. The forecast now reports 10 base damage for overlap, 5 for a single hit, and 5 at an occupied anchor because that position blocks the blast. Wind-up turns report no immediate charge damage. Defense, bracing and shields still resolve per hit; actual combat damage is unchanged.

The regression compares advertised raw damage with real end-turn resolution, including the lethal unshielded overlap, one shield and bracing. Browser acceptance restores a legal charge journal and checks tooltip/accessibility labels in English, Chinese and Japanese at 390 and 2560 pixels. This presentation correction does not change accepted intents or settlement, so rules revision 8 remains current.

Pointer acceptance also exposed a Classic mode-switch bug. The cycle button carries both its operation command and a displayed `data-mode`; the input adapter interpreted that display value as a difficulty before reaching the command. Explicit commands now take precedence, and the browser regression selects Safe note and Quick open through real mouse clicks and touch taps.

The mobility regression exercises both exclusive careers in all five boss families at Standard and Abyss dimensions: anchor placement/return, targeted rifts, AP costs, rejection at zero AP, a bidirectional return path and room boundaries. These focused fixtures reveal terrain to isolate interaction rules; they are not evidence of player clear rates.

Existing browser suites cover the three guided lessons, arrival scenes, titles and notices, skill selection, quick opening, secondary marking, touch holds and scrolling. Older suites now use the visible mode cycle and rift chooser, dismiss arrival scenes before board input, and inspect the actual scroll host. Their assertions continue to inspect real accepted actions and saved journals.

The title picker now uses a styled, scrollable dropdown with selected-state marks, keyboard navigation and outside dismissal. It closes after selection and returns focus to its trigger. Three stacked label/value rows keep long run statistics on one line per value. The redundant introductory paragraph above missions and achievements has been removed in all three languages. The menu follows the familiar [select viewport and selection-indicator structure](https://www.radix-ui.com/primitives/docs/components/select), implemented using the game's existing DOM architecture.

All 679 named business functions have documentation comments. Repository text checkouts use LF through `.gitattributes`, preventing Windows `core.autocrlf` from making an otherwise formatted checkout fail CI. Current-facing docs now describe five bosses, eight professions, 42 goals, 37 possible relics and the current save policy.

## Encounter sample

The existing bounded public-state drivers completed each of the following encounters with both Waymarker and Riftwalker, seed 43, Standard difficulty, floor 3. Each started with no probes, scans, shields, equipment, training or relics. The drivers use accepted movement, deductions and combat actions; they do not use career skills. Skill-specific coverage is the separate matrix above.

| Boss             | Waymarker turn ends | Riftwalker turn ends |
| ---------------- | ------------------: | -------------------: |
| Bastion Guardian |                  48 |                   48 |
| Brood Queen      |                  57 |                   57 |
| Mirror Twins     |                  58 |                   58 |
| Magnetic Knight  |                  43 |                   43 |
| Clock Mage       |                  11 |                   11 |

All ten samples reached the relic-reward phase. A greedy automated route is not an optimal strategy or measured human playtime. The much shorter Clock Mage sample is a pacing signal for later playtesting, not proof that its health should be multiplied by the ratio.

## Economy

The authoritative tables are `UPGRADES`/`upgradeCost` and `MILESTONES`. Current prices and rewards are retained during this audit.

| Currency category       |      Supplies | Repeatable? |
| ----------------------- | ------------: | ----------- |
| All 26 shop purchases   |   39,800 cost | No          |
| 20 mission rewards      | 15,820 income | No          |
| 22 achievement rewards  | 73,400 income | No          |
| All 42 goal rewards     | 89,220 income | No          |
| Reference Relaxed clear |    204 income | Yes         |
| Reference Abyss clear   |  1,431 income | Yes         |

The reference routes collect two chests per floor without Treasure pouch. The [difficulty reward table](expedition-rewards.md) gives the other explicit income scenarios. Goal claims are separate from settlement, so an old estimate based only on roughly 200 supplies per run no longer describes a new camp's total income.

A fresh Relaxed clear banks at least 132 from exits and victory. The first-boss goal adds 800, that boss family's hunt adds 1,000, and the first-victory goal adds 1,000: **at least 2,932** once these rewards are claimed. Optional chests, travel, skill goals and challenge achievements add more.

For example, three Relaxed clears against three different boss families yield `3 × 132 + 800 + 3 × 1,000 + 1,000 + 600 + 1,200 + 1,200 = 8,196`: settlement, first boss, three hunts, first victory, five floors, three bosses and three wins. This deliberately excludes optional chests and other goals. With all those claims collected and savings reserved, it already exceeds the archive's 7,500 price. Different seeds do not guarantee different boss families, and spending on other purchases delays that purchase.

The existing goal payouts therefore substantially accelerate early and middle purchases. Total one-time income exceeding total shop cost does not establish when every item becomes affordable: some goals require 150 floors, 200 skills or five Abyss wins. It does invalidate treating the old settlement-only clear counts as a current collection-time forecast. A later balance decision should choose the intended milestone contribution before changing this authored reward table. No twenty-run collection target is claimed as validated here.

## Reproduction

Use the pinned Node and compiler versions documented in the repository. Run the complete CI gate on the candidate commit:

```sh
npm ci --no-audit
npm audit
npm run check
node scripts/verify-build.mjs
npm run test:legacy
npm run bench:build -- --runs 6
```

Browser suites use Playwright with `BROWSER_CHANNEL=msedge` and `GAME_URL` pointing to the game. After native compilation, start Vite's module server for `achievement-titles.mjs`, which imports the notice presenter to isolate its queue. The remaining acceptance can use the production preview. Run `guidance.mjs`, `tutorial-movement.mjs`, `achievement-titles.mjs`, `reward-professions.mjs`, `pointer-actions.mjs`, `touch.mjs`, `magnetic-threat.mjs` and `expedition-layout.mjs` from `tests/browser/`. Review and CI results belong to the final PR head; historical compiler measurements are not relabeled as new results.
