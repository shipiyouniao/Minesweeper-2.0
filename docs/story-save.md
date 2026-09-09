# Story save contract

The existing `minesweeper.variants.v1.expedition` storage key and outer version 4 remain unchanged. Story schema 3 is an additive envelope alongside the independent roguelite attempt and shared camp. This is a foundation increment, not completion of Roadmap II R2-01.

## Ownership

- `travel`: camp arrival, camp position and a versioned world checkpoint. The checkpoint stores an active scene ID and one bounded delta per visited scene: position, revealed/flagged cells, triggered hazards, health, teaching and pickup state. Mine positions, clue numbers, artwork and dialogue text are rebuilt from authored resources.
- `quests`: durable outcome facts plus accepted, pinned, completed and claimed stable task IDs. Objective completion and payout remain distinct records, committed with the shared wallet in one write.
- `inventory`: permanent map ownership.
- `dialogue`: completed event IDs and the active event/sentence index. Text and portraits remain localized content, never copied into saves.

Rendering and audio do not award rewards. Dialogue acceptance and narrative completion are saved together. Reopening a scene or facility is not a new narrative event. Current scene changes preserve its revealed cells, flags and picked-up objects through scene checkpoints; map browsing never changes the player's location.

## Recovery

The decoder reads older flat and schema-2 story records and infers already completed narrative events from their durable quest outcomes. Old camp records that discarded their route cannot recover unknown original marks: they explicitly reopen the completed prologue as surveyed ground, without paying again.

A current-revision legacy journal is replayed once into scene deltas, then removed together with its archived route and legacy origin. Invalid accepted intents retain their valid prefix. No subsequent move appends an action journal. Incompatible active content retires to camp with one compensation; an already retired camp is not paid again.

Before replacing a supported save, the repository retains one previous complete envelope. The first legacy migration also retains one original copy. Backups replace fixed keys; they do not accumulate by playtime. Unsupported story schema versions and newer world content revisions are write-protected; an older client cannot retire or overwrite a newer world. A malformed envelope may recover from the supported backup. Storage failures remain visible rather than reporting a successful save.

## Quest contracts

`src/game/story-quests.ts` now owns the prologue task definitions, main/side category, introduction event, typed all/any prerequisites, objective conditions and authored supplies. `recordStoryFacts` consumes physical outcomes from the application session. Securing the satchel and delivering it are separate facts; revealing or flagging its cell cannot complete delivery. Completed objectives unlock prerequisites independently of reward claims. The content validator rejects duplicate task IDs, missing task references and circular dependencies.

Old completed/claimed tasks seed their corresponding durable facts during decoding. This preserves progression without accepting another quest or paying again. The full future chapter graph must additionally validate stage, item and mechanism reachability; task-cycle validation alone does not prove a puzzle is solvable.

## Remaining foundation work

Travel is no longer bounded by a 3,000-action journal. A 10,000-move reload test checks that serialized size remains unchanged when revisiting the same ground. Storage scales with visited cells/scenes, not elapsed playtime. The current catalog contains the three prologue scenes, northern road, three quarry spaces and tower landing. Future scenes must add stable content IDs and validation, not bypass the checkpoint decoder.

The first campaign attempt now freezes its prepared departure independently of roguelite. Configurable Recollection, the full stage catalog and chapter dependency validation remain required before R2-01 can be marked complete.

## Prepared campaign attempt

The shared envelope now has an independent `campaign` field with its own journal, records and first-clear bit. Its departure identifies `tower-road-v4`, freezes the owned profession, equipment, title and training, and replays the same expedition action rules against authored terrain. The ordinary `journal` and records continue to belong to roguelite. A repository projection merges campaign writes with the latest shared envelope; ordinary session checkpoints also retain the latest campaign slot.

World return suspends the attempt; it does not heal, refill tools or rebuild the departure. Explicit retreat or defeat retires the attempt without a payout, so retry cannot farm room loot. First victory settles 50 supplies and the clear bit atomically; this first delivery does not offer replay after clearance. Unknown campaign content or newer engine revisions are write-protected. Three-heart world exploration and the campaign HP pool remain independent.

The campaign lesson stores a bounded step separately from its journal. Actual tool and skill intents advance the lesson; invalid clicks do not. A world return cannot reset it or grant practice resources.

Campaign accepted actions now advance shared missions and achievements. Story quests persist bounded campaign-only travel, chests, floors, bosses, skills and wins counters under quests.campaignActivity; campaign conditions can consume those counters. These deltas commit with the action journal and are never applied by replay or lifecycle saves. Existing quest content has no campaign-count objective yet.
