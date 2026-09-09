# Story save contract

The existing `minesweeper.variants.v1.expedition` storage key and outer version 4 remain unchanged. Story schema 2 is an additive envelope alongside the independent roguelite attempt and shared camp. This is a foundation increment, not completion of Roadmap II R2-01.

## Ownership

- `travel`: camp arrival, camp position, active authored-action journal, archived return-route journal and the explicit legacy survey origin.
- `quests`: durable outcome facts plus accepted, pinned, completed and claimed stable task IDs. Objective completion and payout remain distinct records, committed with the shared wallet in one write.
- `inventory`: permanent map ownership.
- `dialogue`: completed event IDs and the active event/sentence index. Text and portraits remain localized content, never copied into saves.

Rendering and audio do not award rewards. Dialogue acceptance and narrative completion are saved together. Reopening a scene or facility is not a new narrative event. Current scene changes preserve its revealed cells, flags and picked-up objects through replay; map browsing never changes the player's location.

## Recovery

The decoder reads older flat story records and infers already completed narrative events from their durable quest outcomes. Old camp records that discarded their route cannot recover unknown original marks: they explicitly reopen the completed prologue as surveyed ground, without paying again.

Before replacing a supported save, the repository retains one previous complete envelope. The first legacy migration also retains one original copy. Backups replace fixed keys; they do not accumulate by playtime. Unsupported story schema versions are write-protected. A malformed envelope may recover from the supported backup. Storage failures remain visible rather than reporting a successful save.

## Quest contracts

`src/game/story-quests.ts` now owns the prologue task definitions, main/side category, introduction event, typed all/any prerequisites, objective conditions and authored supplies. `recordStoryFacts` consumes physical outcomes from the application session. Securing the satchel and delivering it are separate facts; revealing or flagging its cell cannot complete delivery. Completed objectives unlock prerequisites independently of reward claims. The content validator rejects duplicate task IDs, missing task references and circular dependencies.

Old completed/claimed tasks seed their corresponding durable facts during decoding. This preserves progression without accepting another quest or paying again. The full future chapter graph must additionally validate stage, item and mechanism reachability; task-cycle validation alone does not prove a puzzle is solvable.

## Remaining foundation work

Current travel still uses bounded accepted-action journals (3,000 actions), including the legacy restart fallback at the limit. It is **not yet** the compact persistent-world format. Do not extend that mechanism into an unlimited world or claim storage growth is solved. The next travel format must store validated per-scene differences against versioned authored definitions, preserve permanent outcomes on retirement and be tested against long repeated journeys.

Shared campaign/Recollection attempt ownership, frozen campaign departures, typed stage/floor identities and full chapter graph validation remain required before R2-01 can be marked complete.
