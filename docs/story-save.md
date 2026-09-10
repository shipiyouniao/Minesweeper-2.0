# Story save contract

The existing `minesweeper.variants.v1.expedition` storage key and outer version 4 remain unchanged. Story schema 4 retains the compact world envelope and protects the multi-stage campaign collection from older clients. Older schemas remain readable; their terrain follows the content-revision retirement rule. World revision 2 adds the quarry controls and haul route described in [Opening route](opening-route.md). This is a foundation increment, not completion of Roadmap II R2-01.

## Ownership

- `travel`: camp arrival, camp position and a versioned world checkpoint. The checkpoint stores an active scene ID and one bounded delta per visited scene: position, revealed/flagged cells, triggered hazards, operated controls, health, teaching and pickup state. Mine positions, clue numbers, artwork and dialogue text are rebuilt from authored resources. Operated controls restore their open gates; unknown controls and closed-gate player positions are rejected.
- `quests`: durable outcome facts plus accepted, pinned, completed and claimed stable task IDs. Objective completion and payout remain distinct records, committed with the shared wallet in one write.
- `inventory`: permanent map ownership.
- `dialogue`: completed event IDs and the active event/sentence index. Text and portraits remain localized content, never copied into saves.

Rendering and audio do not award rewards. Dialogue acceptance and narrative completion are saved together. Reopening a scene or facility is not a new narrative event. Current scene changes preserve its revealed cells, flags and picked-up objects through scene checkpoints; map browsing never changes the player's location.

## Recovery

The decoder reads older flat and schema-2 story records and infers already completed narrative events from their durable quest outcomes. Old camp records that discarded their route cannot recover unknown original marks: they explicitly reopen the completed prologue as surveyed ground, without paying again.

A current-revision legacy journal is replayed once into scene deltas, then removed together with its archived route and legacy origin. Invalid accepted intents retain their valid prefix. No subsequent move appends an action journal. Incompatible active content retires to camp with 200 supplies once; an inactive or already retired world is not compensated. Retirement establishes camp access and consumes the arrival claim without paying it again. Shared purchases, other quest claims, campaign entries and the roguelite journal survive. No previous terrain engine is kept.

Before replacing a supported save, the repository retains one previous complete envelope. The first legacy migration also retains one original copy. Backups replace fixed keys; they do not accumulate by playtime. Unsupported story schema versions and newer world content revisions are write-protected; an older client cannot retire or overwrite a newer world. A malformed envelope may recover from the supported backup. Storage failures remain visible rather than reporting a successful save.

## Quest contracts

`src/game/story-quests.ts` now owns the prologue task definitions, main/side category, introduction event, typed all/any prerequisites, objective conditions and authored supplies. `recordStoryFacts` consumes physical outcomes from the application session. Securing the satchel and delivering it are separate facts; revealing or flagging its cell cannot complete delivery. Completed objectives unlock prerequisites independently of reward claims. The content validator rejects duplicate task IDs, missing task references and circular dependencies.

Old completed/claimed tasks seed their corresponding durable facts during decoding. This preserves progression without accepting another quest or paying again. The full future chapter graph must additionally validate stage, item and mechanism reachability; task-cycle validation alone does not prove a puzzle is solvable.

## Remaining foundation work

Travel is no longer bounded by a 3,000-action journal. A 10,000-move reload test checks that serialized size remains unchanged when revisiting the same ground. Storage scales with visited cells/scenes, not elapsed playtime. The current catalog contains the three prologue scenes, northern road, three quarry spaces and tower landing. Future scenes must add stable content IDs and validation, not bypass the checkpoint decoder.

The three playable campaign stages now freeze their prepared departures independently of each other and roguelite. Configurable Recollection and complete chapter dependency validation remain required before R2-01 can be marked complete.

## Prepared campaign attempt

The third slot, `ridge-observatory`, uses content revision `ridge-observatory-v1` and a once-only 100-supply clear reward. Its `ridge-route` fact comes from Nia's completed camp conversation; `ridge-surveyed` settles with the clear bit. These facts survive replay and complete the route task without a second currency payment. The catalog now also declares the maximum authored width/height for journal decoding; exact replay still rejects actions outside the current floor. Power selection and recorded readings rebuild from the journal, while completed dialogue remains in the stage ledger.

The shared envelope contains `campaign: { schemaVersion: 1, stages: [...] }`. Every stable stage ID owns its journal, records, clear bit, lesson, completed performances and optional narrative outcomes. The catalog maps `tower-galleries` to `tower-road-v4` and `tower-relay` to `tower-relay-v1`. Departures freeze the owned profession, equipment, title and training and replay shared expedition actions against the selected authored terrain. The ordinary `journal` and records continue to belong to roguelite. A repository projection merges only the selected stage with the newest shared envelope; lifecycle saves preserve the other stages. The former single slot migrates once into the galleries entry.

World return suspends the attempt; it does not heal, refill tools or rebuild the departure. Explicit retreat or defeat retires the attempt without a payout, so retry cannot farm room loot. First victory settles the catalog reward and clear bit atomically: 50 supplies for galleries, 80 for signal rescue. The rescued resident and optional record settle with that same outcome. Completed stages currently cannot be replayed. Unknown campaign content or newer engine revisions are write-protected. Three-heart world exploration and the campaign HP pool remain independent.

The campaign lesson stores a bounded step separately from its journal. Actual tool and skill intents advance the lesson; invalid clicks do not. A world return cannot reset it or grant practice resources.

Campaign accepted actions now advance shared missions and achievements. Story quests persist bounded campaign-only travel, chests, floors, bosses, skills and wins counters under quests.campaignActivity; campaign conditions can consume those counters. These deltas commit with the action journal and are never applied by replay or lifecycle saves. Existing quest content has no campaign-count objective yet.

The fourth slot, `old-waterway`, uses `old-waterway-v1` and awards 140 supplies once. Its catalog entrance is the North Road pump; the prerequisite is a cleared Ridge Observatory and the `ridge-surveyed` fact. Returning to the world accepts `find-beacon` without another camp visit, also for existing completed-survey saves. Victory atomically records `beacon-recovered`, completes the task and settles the stage. Drainage uses the shared power journal; the attempt and ending ledger remain separate from all earlier stages. Adding this stage does not retire any current attempt or change the envelope version.

## First chapter conclusion

The fifth and sixth slots are `tower-control` (`tower-control-v1`) and `northwest-bastion` (`northwest-bastion-v1`). They settle 180 and 240 supplies once. Their `west-line-restored` and `chapter-one-cleared` facts complete the separately accepted story tasks in the same settlement write. Endings have individual replay ledgers and can resume after interrupted settlement.

The additive `northwest-bridge` and `blockade-pass` scenes preserve the existing world content revision: no old scene or mine map changes. Named portal records define physical source and arrival coordinates. Crossing the bridge records `west-shortcut`; both directions of the camp shortcut preserve the entire world checkpoint. A shortcut return explicitly restores camp arrival state so equipment changes, services and a subsequent departure work normally. Map inspection alone never records travel or unlocks the shortcut.

The guardian is a fixed third-floor Bastion encounter and replays from the stage journal. Equipment, title, training and two inter-floor relics remain active. Campaign attempts and endings do not replace a paused roguelite or earlier stage ledger. See [Chapter One finale](chapter-one-finale.md) for layout and behavior acceptance.
