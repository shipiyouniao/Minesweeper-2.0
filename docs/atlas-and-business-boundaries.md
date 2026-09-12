# Atlas detail and business-code boundaries

The atlas has three navigation levels: **World**, **Region**, and **Local area**, selected by one cycling button. The former world chart is the Chapter One woodland region. The world overview gives authored regions stable, small footprints within a larger unsurveyed extent. Chapter Two has its own river-region chart; its current camp and return pass are real destinations, while later chapter sites remain absent until authored. Selecting a discovered world region opens its regional chart; selecting a place opens its scene map through the existing discovery gate. Map navigation cannot move the traveler, grant a task, unlock an entrance or modify either attempt.

World footprints live in `game/atlas-regions.ts`, separately from regional place coordinates. Adding chapter content must not rescale or renumber existing geography. Unknown regions have no clickable placeholders, names or quest spoilers. Fog represents unsurveyed space, not promised finished content; a larger overview alone does not provide a 40–50 hour campaign. Region-sized narrative arcs, stage variety, side stories and persistent consequences remain content work tracked in Roadmap II.

Geographic zoom lays out vector terrain at its actual enlarged width and height and pans with pixel offsets. It does not magnify a composited `scale()` surface. Marker images and text retain their native screen dimensions without nested inverse scaling. Regional quadtree tiles still cull offscreen terrain. Local board zoom remains independent. Each region has its own remembered camera during the current UI session.

![The continuous world map with connected routes](images/atlas-world.png)

## Geographic data and presentation

- `game/atlas-catalog.ts` owns named world positions, district membership, artwork choices and the route graph. Its 12 connections cover all 11 current places; authored bends separate through roads and shortcuts. A new catalog entry does not renumber unrelated geographic connections.
- `game/atlas-connections.ts` resolves named local-map connections and shares northwest portal requirements with physical travel. `game/story-task-location.ts` resolves task locations from permanent outcomes.
- `game/atlas-routes.ts` resolves open, closed and uncharted routes. `game/story-world-access.ts` supplies the same guide, quarry, lift and haul-track conditions to the atlas and physical travel. Northwest routes use the existing portal requirements. The haul-track return is explicitly one-way.
- `ui/atlas-camera.ts` contains pure camera clamping, anchored zoom, semantic detail selection and visible quadtree address calculations. All three levels use one 100–500% range. The slider, buttons, wheel, keyboard, pinch and district focus share its bounds; the slider's entire track is usable, with no inherited text-field padding.
- `ui/atlas-world-terrain.ts` owns the original vector terrain. Tiles select source rectangles from it, preserving sharp edges at every level; no third-party tile service or network API is involved. `ui/atlas-route-layer.ts` draws continuous roads and location dots from the graph above the terrain, so paths and destinations cannot drift into separate coordinate systems.
- `ui/atlas-tiles.ts` retains intersecting tile elements and removes addresses outside the viewport. It switches accessible regional marker layers with the same zoom state. Hidden layers are inert and cannot receive keyboard focus.
- `ui/atlas-chart.ts` renders named geographic markers; `ui/atlas-local.ts` renders local boards; `ui/story-map.ts` composes the map shell. Neither camera input nor templates own campaign progress.

The transparent, icon-only legend control lives in the zoom bar outside the drawing. Its accessible name, expanded state and localized legend remain available. Labels and destination icons retain a readable screen size while geography zooms. Each map remembers its camera during the current UI session, including when returning from a submap.

Mouse wheel, range controls, zoom buttons, keyboard navigation, dragging and two-finger pinch all use the same camera math. A gesture is explicitly idle, panning, pinching or waiting for remaining fingers to lift. Finishing a pinch cannot activate a location underneath it; a fresh pointer gesture immediately restores deliberate clicking. World destinations use one click or tap; local landmark descriptions retain their inspect-and-open interaction. District focus uses discovered members so an unexplored location cannot pull the known destination off screen.

## Shared presentation ownership

`SceneTransition` owns one cancelable incoming-scene animation. The router, atlas and physical story travel each hold their own instance of this shared owner. Replacing a view cancels its outgoing effect; disposal and language changes release it; reduced-motion preference skips it. Gameplay remains committed before visual travel or arrival effects run.

`story-assets.ts` owns camp-facility artwork shared by the live scene and its map. Existing rail, power and dungeon sprite helpers continue to own their corresponding assets. Sharing imagery does not require importing an entire page template into another renderer.

Task details now compose the same description fragment into compact and expanded containers. They no longer locate and cut HTML strings to reuse a subsection.

The journal owns task steps, chapter completion and unlock outcomes. The atlas communicates access through its places and route states, without a permanent story-progress paragraph. Quarry mechanism objectives appear inside the repair task's expandable detail. Camp navigation uses destination names and claimable reward badges; item effects and loadout limits stay in their editing screens. Immediate action feedback and the existing interactive tutorials remain tied to the operation they explain.

The opening eyelid animation pauses when its page is hidden, including when a host browser mounts the page in the background. It resumes when visible; explicit skip, reduced-motion preferences and restored dialogue keep their existing behavior. The prologue recognizes marking and safe opening performed before the suggested clue inspection, so its teaching target and dialogue advance with the player's demonstrated actions. Standing at the exit with both actions completed no longer requires a return trip to inspect one specific numeral.

The prologue's floating practice card reuses the campaign and battle guide's anchor positioning. Its four prompts follow actual inspection, marking, safe opening and departure; touch instructions use long presses. The game owns the next step and highlighted tile, while `story-lesson.ts` owns localized presentation. Dialogue and journal views hide the card, and leaving the clearing ends it. No separate tutorial save or completion button is needed.

## Repository-wide review and maintenance

The review traversed the TypeScript source tree for named behavior documentation, declaration placement, dependency direction and dense procedural blocks. Missing purpose comments were completed and validation, calculation, effects and return phases were separated. Existing functional rules and object-owned sessions remain the architecture; no parallel game engine or compatibility implementation was added.

`check:contracts` now also rejects undocumented named functions, methods and lifecycle callbacks, game-layer imports of outer adapters, and application imports of UI modules. Short anonymous collection callbacks inherit their containing function's explanation. Explicit module-scoped `.d.ts` contracts and the existing restrictions on wide/dynamic types remain enforced.

`check:i18n` detects duplicate catalog keys and recursively inspects nested UI modules in addition to checking three-language key parity, interpolation names and localized UI calls. Formatting, types, both behavior suites and Pages declaration verification remain separate gates. These automated checks support code review; they do not prove that every future design is sound.

## Subsequent chapter direction

Each chapter can have its own explorable regional camp with local residents, story tasks, artwork and changes caused by the player's actions. Supplies, ownership, professions, loadouts, ordinary tasks, achievements and Recollection belong to the shared party progression. Existing camps remain available for unfinished side stories.

The formal Recollection facility is planned for the beginning of Chapter Two, initially drawing on experienced Chapter One mechanics and bosses. It remains optional, and later campaign discoveries expand its selectable pools. The temporary roguelite entrance remains until the integrated facility is ready. This atlas change does not claim to implement Chapter Two or additional camps.

## Verification

Camera tests cover anchored zoom, edge bounds, tile coverage across viewport sizes, catalog completeness, discovery gates and task destinations. Route tests verify that every location is connected through actual scene doorways, the haul return remains one-way, and route states respect repair and dialogue checkpoints. Browser checks cover narrow and 4K layouts, three languages, actual slider drags and endpoint clicks/taps, native touch pinch with delayed release, direct location activation, camera restoration, transparent controls, keyboard use and unchanged serialized saves. Chapter-finale checks exercise the discovered northwest maps and physical route independently.
