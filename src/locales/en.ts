import type { MessageCatalog } from '../types/message-catalog.js'

/** en interface messages. Keep keys aligned across locales. */
export const enMessages: MessageCatalog = {
  'story.haul-load': 'Load the intact shaft onto the trolley first.',
  'story.go-together':
    'Then we look for her first. If there is a way home in those records, she can help me read it.',
  'story.lift-answer': 'Two rings. Nia heard us. Hold the rail—we are going up.',
  'story.brake': 'Loading brake',
  'story.winch': 'Haul winch',
  'story.haul-track': 'Haul track · lift',
  'story.gate-closed': 'Closed machinery barrier',
  'story.mechanism-done': 'Released',
  'story.mechanism-operate': 'Operate',
  'story.mechanism-locked': 'Isolate nearby knots',
  'story.mechanism-help':
    'Flag the knots around the {name}, uncover its other neighboring tiles, then operate it.',
  'story.mechanism-ready': 'The {name} is ready. Approach and operate it.',
  'story.brake-scene-1':
    'That load is hanging right over the passage. Is the rope supposed to sound like that?',
  'story.brake-scene-2':
    'No. I will brace it. Clear the brake’s neighbors before touching the lever; a knot pulse could drop the load.',
  'story.release-scene-1': 'It held. You can let go now.',
  'story.release-scene-2': 'Gladly. Next time I say “I know this machine”, remind me of this rope.',
  'story.winch-scene-1':
    'An intact shaft, behind the guard. The winch can lift it clear and run the trolley back to the lift.',
  'story.winch-scene-2': 'And I check the ground before you touch the machinery. I am learning.',
  'signal.title': 'An Answer in the Tower',
  'signal.floor-1': 'A Broken Call',
  'signal.floor-2': 'A Name Without a Home',
  'signal.floor-3': 'Prisoner of an Old Order',
  'signal.relay': 'Power relay',
  'signal.gate': 'Sealed gate',
  'signal.released': 'Power disconnected',
  'signal.ready': 'Click the relay to release the gate',
  'signal.solve':
    'Use the relay’s number to flag mines and uncover its safe neighbors. Walk onto the relay and click it to cut the power.',
  'signal.record': 'Outsider arrival record',
  'signal.optional': 'Side passage · optional',
  'signal.continue': 'Continue',
  'signal.nia': 'Nia',
  'signal.player': 'You',
  'signal.lumi': 'Lumi',
  'signal.guardian': 'Tower guardian',
  'signal.complete': 'The route is open. Head onward.',
  'signal.entry-1':
    '…Third time knocking on this pipe. If you can hear me, don’t knock back. It will count you too.',
  'signal.entry-2': 'Someone’s inside? Lumi, I thought this tower was abandoned.',
  'signal.entry-3': 'The light on the gate is still on. Let’s disconnect the relay and find her.',
  'signal.connected-1':
    'Finally, a voice that isn’t my own echo. I’m Nia. I repair wiring. Currently being held captive by my wiring.',
  'signal.connected-2':
    'Evacuation procedure. Return to your registered home. Unregistered persons may not leave the tower.',
  'signal.connected-3': 'I don’t even have an address in this world. It won’t let me out either.',
  'signal.connected-4':
    'Then let’s leave the paperwork for later. Keep climbing. I’ll watch the circuits from here.',
  'signal.archive-1':
    'The old registry is up to the left. That blue record says “arrival from another world.” No local address. Just like you.',
  'signal.archive-2': 'Did they ever get home?',
  'signal.archive-3':
    'I got as far as “homeward beacon.” The side door has its own relay. You can reach the record, but don’t step on a mine for it. I remember where the beacon is.',
  'signal.record-1':
    '“Homeward trial, attempt seven. Beacon lit. No return confirmed.” …There’s a star chart on the back.',
  'signal.record-2':
    'Don’t fold that corner! All right, lecture later. That chart is a lot more useful than the address I memorized.',
  'signal.prison-1':
    'I can see you! Two circuits left. Don’t throw rocks at the guardian. I tried. It issued the rock a registration form.',
  'signal.prison-2':
    'It’s following an order nobody ever cancelled. First we get you out. Then we figure out how to wake up the rest of this tower.',
  'signal.rescued-1': 'Registered home… not found. Evacuation route… released.',
  'signal.rescued-2':
    'Next time I’m writing “beside the campfire.” Thank you, both of you terrible rule-followers.',
  'signal.rescued-3-saved':
    'I’ll spread the chart out at camp. First we work out which sky it points to. Then we find that homeward beacon.',
  'signal.rescued-3-skipped':
    'It’s all right that the record stayed here. I’ll draw the route I remember at camp. We’ll find the homeward beacon together.',
  'signal.camp-1':
    'I’ve registered an address. Three paces right of the fire. If the guardian comes after me, you’re my witness.',
  'signal.camp-2-saved':
    'The chart is missing a corner, but I can read two observation points. When the road opens, we can compare them with the sky.',
  'signal.camp-2-skipped':
    'The beacon was north. Which fork in the road… give me a little longer. Perhaps someday we can recover the chart from the tower.',
  'story.north-road': 'Old North Road',
  'story.lift': 'Watchtower Lift',
  'story.world-road': 'Lanternwood · Scouting',
  'story.road-task': 'Main · The Watchtower Road',
  'story.road-detail': 'Reach the watchtower lift and inspect the damage. Reward: 20 supplies.',
  'story.north-start-1':
    'The tower flashed once last night. Nia always tests a lamp twice. I cannot stop thinking about that.',
  'story.north-start-2': 'One flash still means someone is there. Let us get closer.',
  'story.north-found-1': 'The shaft has snapped. The break is still bright—this happened recently.',
  'story.north-found-2':
    'So she could get up, but not down. There are wheel tracks toward the quarry. Those machines used the same shafts.',
  'story.north-report-1':
    'The lift broke after Nia went up. We found tracks leading to the quarry.',
  'story.north-report-2':
    'Then we have a route. Take a breath here; the quarry will still be there when we are ready.',
  'story.atlas-watchtower': 'Old Watchtower',
  'story.atlas-uncharted': 'This area has not been mapped yet.',
  'story.atlas-zoom': 'Map zoom',
  'story.atlas-zoom-in': 'Zoom in',
  'story.atlas-zoom-out': 'Zoom out',
  'story.atlas-fit': 'Fit map',
  'story.atlas-tree': 'Trees',
  'story.atlas-world': 'World',
  'story.atlas-legend': 'Legend',
  'story.atlas-region': 'Region',
  'story.atlas-local': 'Local area',
  'story.atlas-woodland': 'Lanternrest woodlands',
  'story.atlas-here': 'You are here',
  'story.atlas-route': 'Trail',
  'story.atlas-enter': 'Explore region →',
  'story.quest-accepted': 'Quest accepted',
  'story.no-quests': 'No pinned quests',
  'story.no-accepted': 'No quests accepted yet.',
  'story.pin': 'Pin quest',
  'story.unpin': 'Unpin quest',
  'story.map': 'Map',
  'story.no-map': 'You do not have a map yet. Ask the guide at camp.',
  'story.map-received': 'Map received',
  'story.quest-main-detail': 'Follow the lanterns through the forest trail to reach camp.',
  'story.quest-side-detail': 'Find the lost satchel on the forest trail and bring it to camp.',
  'story.quest-guide-detail': 'Speak with the guide at camp to learn about this place.',
  'story.quest-location': 'Location: {place}',
  'story.flag-mouse': 'Right-click the highlighted covered tile to mark it.',
  'story.quarry-yard': 'Old quarry · Loading yard',
  'story.quarry-passage': 'Old quarry · Passage',
  'story.quarry-machine': 'Old quarry · Machinery room',
  'story.tower-landing': 'Watchtower · Upper landing',
  'story.spindle': 'Lift spindle',
  'story.repair-task': 'Main · Restore the lift',
  'story.repair-detail':
    'Release the loading brake, reach the machine room and recover an intact shaft.',
  'story.repair-return':
    'Use the machine-room haul track to bring the shaft to the lift, then install it.',
  'story.climb-task': 'Main · A light above',
  'story.climb-detail': 'Ride the repaired lift and read the notice at the watchtower door.',
  'story.quarry-lead':
    'Follow the tracks into the quarry. I will handle the old machinery; watch the ground for me.',
  'story.spindle-found':
    'It fits. Onto the trolley! The winch is running, and this track comes out behind the lift.',
  'story.lift-fixed': 'Hold it there… Yes! It is turning. Was that a bell above us?',
  'story.tower-arrival':
    '“Evacuation order: residents without a registered address must remain inside.” Nia only ever writes “beside the campfire”…',
  'campaign.lesson-move': 'Move to the highlighted revealed tile, then use your skill.',
  'campaign.lesson-title': 'Stage practice · {step}/4',
  'campaign.lesson-enter':
    'Inside a stage you have HP instead of hearts: 10 base HP, and a mine deals 5 damage. Your tools and profession skill are below. Let us try them.',
  'campaign.lesson-probe':
    'Select the probe below, then the highlighted tile, or drag the probe onto it. It confirms a nearby area: gold flags are mines; dotted tiles are confirmed safe.',
  'campaign.lesson-scan':
    'Select the scanner, then a tile in the row you want to check, or drag it there. It confirms mines and safe tiles across that row.',
  'campaign.lesson-skill':
    'Now try your profession skill below. If it is grey, tap it to see why it is unavailable.',
  'campaign.lesson-open':
    'Walk to and open the highlighted safe tile. Confirmed safe is not yet revealed. Use the new numbers to reason about its neighbors, and save some tools for later.',
  'campaign.lesson-begin': 'Try it',
  'campaign.lesson-skip': 'I know this — hide tips',
  'campaign.enter': 'Enter the outer galleries',
  'campaign.title': 'Watchtower outer galleries',
  'campaign.abandon': 'Abandon exploration',
  'campaign.abandon-note':
    'Abandon this attempt and leave the stage? Your next attempt will start on floor one.',
  'campaign.exit': 'Leave stage',
  'campaign.abandoned': 'Exploration abandoned',
  'campaign.leave': 'Return to the world',
  'campaign.objective':
    'Collect this floor’s supplies {count}/{total}, then reach the exit. Three floors; first clear awards 50 supplies.',
  'story.flag-touch': 'Press and hold the highlighted covered tile to mark it.',
  'story.chord-mouse':
    'Right-click the highlighted 1 to open its unflagged neighbors together. The flag count must match the number; misplaced flags can still cause a mine hit.',
  'story.chord-touch':
    'Press and hold the highlighted 1 to open its unflagged neighbors together. The flag count must match the number; misplaced flags can still cause a mine hit.',
  'story.map-unvisited': 'Not visited',
  'story.return-bag': 'Let us leave her bag by the fire. She will see it when she gets back.',
  'story.open-eyes': 'Open your eyes',
  'story.dialogue-next': 'Continue',
  'story.dialogue-read': 'Show the whole line',
  'story.where-am-i': 'The door was right here. I was still holding the handle.',
  'story.other-world': 'These numbers… I can read them. But none of this place is familiar.',
  'story.found-bag': '“Nia” is scratched into the clasp. The bandages inside are still dry.',
  'story.keep-bag': 'That is hers. She never leaves without it… Would you bring it along?',
  'story.home-question': 'Was Nia looking for a way home too?',
  'story.thanks': 'You keep looking at the northern road.',
  'story.prologue': 'Prologue · A light in the mist',
  'story.camp': 'Lanternrest',
  'story.guide': 'Lumi',
  'story.awakening': 'The unfamiliar clearing',
  'story.trail': 'Along the old trail',
  'story.approach': 'Lights beyond the trees',
  'story.wake-line':
    'A door? Only roots here. Keep your foot up—I just pulled you away from a knot. See that glowing “1”?',
  'story.read-task': 'Select the glowing number to inspect its eight neighboring cells.',
  'story.flag-line':
    '“1” means one knot in these eight cells. Only one is still covered. Leave a warning there.',
  'story.flag-task': 'Flag the covered cell: right-click, hold, or choose Flag below and tap.',
  'story.open-line':
    'Look at the 1 left of the flag. Its danger is marked, so you can open the remaining neighbors together.',
  'story.open-task': 'Choose Explore, then open the lit safe cell.',
  'story.travel-line':
    'You can read the traces… That’s a rare gift. Come along the clear ground. I’ll take you to camp.',
  'story.travel-task': 'Select a clear cell to walk there. Reach the lantern, then continue.',
  'story.trail-line':
    'Good. I know the way; you read the ground. Try the clear patch ahead. The light spreads through empty ground.',
  'story.trail-task':
    'Open the clearing, then reach the lantern. The lost satchel is an optional detour.',
  'story.approach-line':
    'There is our camp. Leave the stool beside the fire free. Nia always says it is the only one that does not wobble.',
  'story.approach-task':
    'Find a safe way to the camp lantern. Flags warn of danger; they do not remove it.',
  'story.arrival-line':
    'Soup is still warm. Eat first. Then meet me by the southern lamp; there is something I should tell you.',
  'story.camp-task': 'Walk to Lumi by the southern lantern.',
  'story.guide-line':
    'No. The watchtower kept records of people from other worlds. She went to find a chart for me. She promised to be back before dark.',
  'story.camp-ready': 'Prepare at the workshop, then take the northern road with Lumi.',
  'story.road-line':
    'The watchtower road is still being charted. This is where the next chapter will begin.',
  'story.temporary': 'Roguelite · temporary entrance',
  'story.temporary-note': 'Play the existing expeditions and bosses.',
  'story.continue': 'Continue along the trail',
  'story.enter-camp': 'Enter Lanternrest',
  'story.explore': 'Explore',
  'story.flag': 'Flag',
  'story.route': 'Reach this cell through revealed ground first.',
  'story.lesson': 'Try the marked interaction before leaving.',
  'story.hurt': 'A knot pulsed! One heart lost; its warning stays.',
  'story.fallen': 'Lumi pulls you back to shelter. Rest, then try this stretch again.',
  'story.restart': 'Restart prologue',
  'story.retry': 'Try this stretch again',
  'story.satchel': 'Lost satchel',
  'story.satchel-found': 'Satchel recovered. Bring it to camp for 30 supplies.',
  'story.all-tasks': 'View all quests',
  'story.tasks': 'Story tasks',
  'story.main-task': 'Main · Reach Lanternrest',
  'story.side-task': 'Side · Return the lost satchel',
  'story.meet-task': 'Main · A place to stay',
  'story.done': 'Completed',
  'story.optional': 'Optional',
  'story.pending': 'In progress',
  'story.missed': 'Not recovered',
  'story.back-camp': 'Back to the camp board',
  'story.facility': 'Walk here to visit',
  'story.lantern': 'Trail lantern',
  'story.road': 'Watchtower road',
  'story.wall': 'Woodland boundary',
  'story.covered': 'Covered ground',
  'story.safe': 'Clear ground',
  'story.marked': 'Warning flag',
  'story.pulse': 'Triggered leyline knot',
  'story.clue': '{count} knots in the eight neighboring cells',
  'story.health': 'Hearts',
  'story.storage': 'Saving is unavailable. Keep this tab open to retain this session.',
  'story.inspect': 'The outlined cells are this number’s eight neighbors.',

  'home.title': 'Choose your next game',
  'home.note': 'Set out on an expedition, or settle into a puzzle.',
  'home.free': 'Free play',
  'home.expedition-note':
    'Follow a light through the forest. Find your footing, and a place to call camp.',
  'home.free-note': 'Classic, Twin boards, Sonar and Survey. A puzzle at your own pace.',
  'home.enter-expedition': 'Enter expedition',
  'home.choose-mode': 'Explore modes',
  'home.back': 'Home',
  'home.settings': 'Settings',
  'home.directory-note': 'Four ways to read the board. Pick a mode to play.',
  'home.saved': 'Your games and progress are saved on this device.',
  'home.classic-note': 'Read the nearby numbers, mark the mines and clear the field.',
  'home.twin-note': 'Two boards, shared coordinates. Clues on one help solve the other.',
  'home.sonar-note': 'Send a pulse and compare its echoes to uncover the hidden field.',
  'home.survey-note': 'Follow the mine runs at each edge and cross the clues to solve the grid.',
  'board.remaining-mines': 'Remaining mines',
  'tide.held': 'The floor resisted this tide. Your routes stay in place.',
  'tide.until': 'Tide in {turns} turns',
  'tide.name': 'Tidekeeper',
  'tide.core': 'Tidal core · reveal this safe floor before anchoring it',
  'tide.anchor': 'Anchor · 1 AP',
  'tide.anchor-hint':
    'Drag the anchor onto your floor or a revealed orthogonal neighbor, or select it and click the target. Its 3×3 area stays fixed for the next tide. Two anchors per tide; each costs 1 AP.',
  'tide.hint':
    'Reveal the tidal core and anchor its floor. The next tide returns through the core and breaks the shield.',
  'tide.deduce':
    'Use ordinary Minesweeper clues to reach the tidal core. Every three turns, the floor rearranges; your footing and anchored areas stay put.',
  'tide.fight':
    'Strike from an adjacent tile for 2 AP. At half health the shield returns: anchor the core again for a second countercurrent.',
  'tide.shuffle-note':
    'Mines, flags, revealed tiles and safety marks travel together. Numbers update; ordinary flags can still be wrong. Old sonar and area reports expire. Red attacks resolve before the tide, followed by the next forecast. Only End turn advances time.',
  'tide.status': 'Tide in {turns} · Anchors {anchors}/2 · Armor {phase}/2',
  'tide.open': 'Shield broken',
  'tide.shield': 'Shield active',
  'tide.anchored': 'Anchor set. The outlined floor stays fixed until the tide.',
  'tide.shuffled': 'Tide passed. Read the new numbers.',
  'tide.broken': 'Countercurrent! Shield broken.',
  'tide.phase': 'End the turn to face the second armor section. Anchor the core again.',
  'tide.scene-0': 'A floor that will not stay still',
  'tide.scene-1':
    'Brass tiles rise and drift past one another. Your boots hold a single square in place.',
  'tide.scene-2': 'Count your steps. The third tide takes every road.',
  'tide.scene-3': 'That core feeds the shield. An anchor might turn the current back.',
  'tide.scene-4':
    'Two anchors settle in your pack. Across the room, a narrow wave marks the next strike.',
  'matrix.quiet': 'Quiet turn',
  'matrix.open-hint': 'Shield broken. Approach the core and strike.',
  'matrix.hunt': 'Break the Matrix',
  'matrix.hunt-note': 'Defeat the Matrix Overseer once.',
  'matrix.precise': 'Perfect Refraction',
  'matrix.precise-note': 'Defeat the Matrix Overseer without an empty attunement.',
  'matrix.precise-effect': 'Attack +1 while the Matrix Overseer’s shield is broken.',
  'matrix.name': 'Matrix Overseer',
  'matrix.deduce':
    'Use floor numbers to clear a safe route. Open Observe and read the crystal runs around its nine cells.',
  'matrix.calibrate':
    'Reveal a safe target and stand on it or an orthogonal neighbor. Attune for 1 AP. Two collected crystals break each shield.',
  'matrix.fight':
    'Strike from beside the core: 2 AP. The shield stays broken. At half health, end the turn to begin the second crystal hunt.',
  'matrix.forecast':
    'Red cells take a 4-damage attack at turn end. Every third turn is quiet; movement, attunement and attacks still work.',
  'matrix.gaps':
    'Observe counts crystals only. 1 1 means two crystals separated by at least one cell. Floor numbers count mines only; digging never uncovers crystals.',
  'matrix.shield': 'Collect two crystals in the active observation region to break the shield.',
  'matrix.phase': 'First health band cleared. End the turn to activate the second region.',
  'matrix.armed': 'Two crystals delivered. Shield shattered.',
  'matrix.shifted': 'Second region active. Collect two more crystals.',
  'matrix.status': 'Phase {phase}/2 · crystals {count}/2',
  'matrix.legend': 'Teal borders: observation region · red cells: attack at turn end',
  'matrix.scene-0': 'Another light beneath the floor',
  'matrix.scene-1':
    'Mines lie below the tiles. A different glow slips past the numbers carved into them.',
  'matrix.scene-2': 'You have found the mines. Have you really seen the room?',
  'matrix.scene-3':
    'The lens reveals the crystal pattern. Two should be enough to pierce its shield.',
  'matrix.scene-4': 'A small patch of floor glows teal. The Overseer gathers its light.',
  'matrix.observe': 'Observe',
  'matrix.attune': 'Attune · 1 AP',
  'matrix.attune-hint':
    'Select Attune, then a target, or drag it onto a cell. Reveal safe ground first and stand on it or an orthogonal neighbor.',
  'matrix.observation-hint':
    'While observing: right-click or hold to mark crystals; click a target to walk over and collect (1 extra AP). Press Observe again to hide clues.',
  'matrix.region': 'Observation region',
  'matrix.ground': 'Reveal the safe target first. Mines and walls cannot be attuned.',
  'matrix.region-only': 'Choose a cell in the active nine-cell region.',
  'matrix.note': 'Crystal guess',
  'matrix.empty-cell': 'Crystal ruled out',
  'matrix.unresolved': 'Crystal unknown',
  'matrix.select': 'Select a cell to locate it on the battlefield.',
  'matrix.collected': 'Crystal collected',
  'matrix.collected-event': 'Crystal collected. One more breaks the shield.',
  'matrix.empty-event': 'No crystal here. 1 AP spent.',

  'survey.mines': 'mines',
  'survey.title': 'Survey',
  'survey.intro': 'Trace mine runs. Cross-check both axes.',
  'survey.opening': 'Start from a full line or overlapping runs.',
  'survey.legend': 'Consecutive mine runs',
  'survey.hint': 'Open safe ground using the edge clues.',
  'survey.bookkeeping':
    '“2 1” means a run of two mines, then one mine. Leave at least one safe square between runs; the gap can be longer.',
  'survey.line-action': 'Click or tap to quick-open this line. Enter or Space also works.',
  'survey.line': '{axis} {number}: runs {runs} · {flags} flags',
  'survey.moves': 'Moves',
  'survey.remaining': 'Safe squares left',
  'survey.zoom': 'Enlarge squares',
  'survey.fit': 'Fit board',
  'survey.win': 'Survey complete',
  'survey.loss': 'A mine interrupted the survey',
  'survey.rank-hint': 'Best wins by fewest moves, separately for each difficulty.',
  'survey.no-records': 'Your first completed survey goes here.',
  'survey.recovered': 'A new survey is ready. Only records from the current rules are retained.',
  'survey.limit': 'This survey has reached its move limit. Start a new board to continue.',
  'survey.chord':
    'Quick-open this row and column after their runs are flagged, or open your safe notes.',
  'survey.lesson-title': 'Survey · mine runs',
  'survey.lesson-overlap-title': 'Find the overlap',
  'survey.lesson-overlap':
    'The first row has a run of 3 in 5 squares. Wherever it starts, it crosses the middle. Flag that square.',
  'survey.lesson-column-title': 'Cross the axes',
  'survey.lesson-column':
    'The second column says 5: every square is a mine. Flag its square in the first row.',
  'survey.lesson-column-right':
    'The fourth column also says 5. Flag the highlighted intersection to complete the first row’s run.',
  'survey.lesson-chord-title': 'Clear a finished line',
  'survey.lesson-chord-mode': 'Cycle the bottom action button to Quick-open.',
  'survey.lesson-chord':
    'Select the highlighted flag. Its row has all three mines marked, so the two remaining squares can open.',
  'survey.lesson-gap-title': 'Leave room between runs',
  'survey.lesson-reveal-mode': 'Cycle the action button back to Open.',
  'survey.lesson-gap':
    'Runs need at least one safe square between them; the gap can be longer. This five-square row says “2 2”, so only one gap fits. Open the middle square.',
  'survey.lesson-ending':
    'Read runs in order, leave at least one safe square between them, then check the crossing line. Open all safe ground to finish.',
  'echo.shifted': 'The core moved. Scan again; old core readings have expired.',
  'echo.phase-break': 'Shell broken. The core moves at the end of this turn.',
  'echo.rhythm': 'A 3-turn opening. Every third turn is quiet: reposition or strike.',

  'echo.hunt': 'Echo hunt',
  'echo.hunt-note': 'Defeat the Echo Warden.',
  'echo.flawless': 'Silent Footsteps',
  'echo.flawless-note': 'Defeat the Echo Warden without losing health.',
  'echo.precise': 'Perfect Pitch',
  'echo.precise-note': 'Defeat the Echo Warden using no more than 6 scans.',
  'echo.flawless-effect': 'Defense +1 while at full health.',
  'echo.precise-effect': 'Attack +1 against an exposed Echo Warden.',

  'echo.scene-0': 'Three voices, one heartbeat',
  'echo.scene-1':
    'Three brass figures stand motionless. Every footstep returns three times, drowning the marks on the floor.',
  'echo.scene-2': 'Choose. My other selves are waiting for your blade.',
  'echo.scene-3':
    'All three sound alike. But something inside one of them keeps beating between the echoes.',
  'echo.scene-4':
    'A small instrument on the landing answers with a clear ping. Thin green seams lead from it into the room.',
  'echo.scene-5':
    'It hears what I cannot. If this side stays silent, I can rule it out and try the other.',
  'echo.scene-6': 'Listen too long, and the next note will go straight through you.',
  'echo.scene-7': 'A red seam flares across the floor. The figures draw one long breath together.',
  'echo.scene-8':
    'Find the beating one, get close, pry it open. And keep a way out before that note lands.',

  'echo.locate': 'Scan the bodies to narrow down the real core.',
  'echo.shell': 'Locate the core, then approach and click it to break its shell.',
  'echo.fight': 'Strike during the opening. Leave the red lane before ending your turn.',
  'echo.loan': 'Loaner Sonar · {charges}/3 · Recharge {progress}/4',
  'echo.body': 'Resonator {body}',
  'echo.candidates': 'Possible cores: {bodies}',
  'echo.obscured': 'Obscured clue',
  'echo.reading': 'R{row} C{column} · {mines} mines',
  'echo.present': 'Core detected',
  'echo.absent': 'No core detected',
  'echo.stale': 'Previous phase',
  'echo.phase-note':
    'At each health band, the core moves and your loaner refills to at least 2 pulses. Old core readings expire.',

  'sonar-equipment.name': 'Sonar',
  'sonar-equipment.note':
    '1 loadout point · Start with 2 pulses; recharge 1 per 12 safe excavations, up to 3. Scan a 3×3 mine total, clarify its clues and uncover only its center.',
  'echo.name': 'Echo Warden',
  'echo.status': 'Phase {phase}/3 · {window} turns exposed',

  'battle-guide.approach-a-revealed-hourglass-and-return-a':
    'Approach a revealed hourglass and return a spell to break the barrier.',
  'battle-guide.approach-the-core-and-activate-it-to':
    'Approach the core and activate it to open an attack window.',
  'battle-guide.clear-eggs-before-they-hatch-and-avoid':
    'Clear eggs before they hatch, and avoid the marked attacks.',
  'battle-guide.compare-the-boards-a-mine-on-one':
    'Compare the boards: a mine on one side means safety on the other.',
  'battle-guide.disable-a-seal-to-expose-the-twin':
    'Disable a seal to expose the twin in the opposite realm.',
  'battle-guide.fewer-nests-mean-less-armor-and-healing':
    'Fewer nests mean less armor and healing. Approach and strike.',
  'battle-guide.flag-nearby-mines-and-destroy-a-nest':
    'Flag nearby mines and destroy a nest to remove immunity.',
  'battle-guide.flag-the-mines-around-both-pylons-then':
    'Flag the mines around both pylons, then disable them.',
  'battle-guide.full-rules': 'Full rules',
  'battle-guide.leave-the-marked-cells-before-the-countdown':
    'Leave the marked cells before the countdown reaches zero.',
  'battle-guide.move-1-cell-reveal-1-strike-2':
    'Move 1 / cell · Reveal +1 · Strike 2 · Brace 1 · Flag 0 AP',
  'battle-guide.open-a-route-to-an-anchor-then':
    'Open a route to an anchor, then activate it to lure the boss.',
  'battle-guide.strike-switch-realms-strike-the-other-twin':
    'Strike, switch realms, strike the other twin. Check both forecasts.',
  'battle-guide.strike-then-leave-your-echo-it-repeats':
    'Strike, then leave your echo. It repeats the full damage at turn end.',
  'battle-guide.strike-while-exposed-leave-the-red-cells':
    'Strike while exposed; leave the red cells before ending your turn.',
  'battle-guide.the-crash-breaks-its-armor-approach-and':
    'The crash breaks its armor. Approach and strike before it recovers.',
  'battle-guide.three-moves-to-learn-the-fight': 'Three moves to learn the fight',
  'battle-guide.use-the-preparation-turn-to-leave-the':
    'Use the preparation turn to leave the anchor’s 3 × 3 blast area.',
  'battle-presentation.action-points': 'Action points',
  'battle-presentation.approach-and-prime-the-core-1-ap': 'Approach and prime the core · 1 AP',
  'battle-presentation.attack': 'Attack',
  'battle-presentation.base-5-attack-0-defense-3-ap': 'Base: 5 attack · 0 defense · 3 AP',
  'battle-presentation.base-stats-10-health-5-attack-0':
    'Base stats: 10 health, 5 attack, 0 defense and 3 AP. Your equipment and relics change these totals; the battle panel lists their sources. Move for 1 AP per cell, reveal for 1 extra, attack for 2; other actions cost 1 and flags are free.',
  'battle-presentation.bastion-guardian': 'Bastion Guardian',
  'battle-presentation.boss-defeated-full-health-1-shield':
    'Boss defeated · full health, +1 shield',
  'battle-presentation.brace-1-ap': 'Brace · 1 AP',
  'battle-presentation.brace-reduces-this-turn-s-enemy-damage':
    'Brace reduces this turn’s enemy damage by 3. Defense also reduces enemy damage, but a hit still deals at least 1 before shields. Mines and wrong calibrations deal 5 and ignore armor. Each shield charge absorbs up to 5. Victory fully heals and grants one shield.',
  'battle-presentation.brood-queen': 'Brood Queen',
  'battle-presentation.build-effects': 'Build effects',
  'battle-presentation.control-disabled': 'Control disabled',
  'battle-presentation.control-reveal-and-flag-neighboring-mines':
    'Control · reveal and flag neighboring mines',
  'battle-presentation.controls-2': 'Controls {p0}/2',
  'battle-presentation.core-exposed': 'Core exposed',
  'battle-presentation.core-open-turns': 'Core open · {p0} turns',
  'battle-presentation.defense': 'Defense',
  'battle-presentation.defenses': 'Defenses',
  'battle-presentation.each-nest-gives-3-armor-and-heals':
    'Each nest gives 3 armor and heals 3 health per turn. Destroying it stops its egg supply and deals 3 damage to the queen. Three intact nests block direct attacks. With no nests, healing stops and the queen attacks every second turn.',
  'battle-presentation.eggs-hatch-after-two-turns-hatchlings-advance':
    'Eggs hatch after two turns. Hatchlings advance up to two safe cells; ghosts show committed destinations. Each hatchling deals 3 damage and the queen deals 5; overlapping attacks add together. Clear creatures to cancel their forecasts. Eggs and hatchlings total at most three.',
  'battle-presentation.end-turn': 'End turn',
  'battle-presentation.enemy-attack-forecast': 'Enemy attack forecast',
  'battle-presentation.nests-3-armor-regen': 'Nests {p0}/3 · Armor {p1} · Regen {p1}',
  'battle-presentation.reveal-each-control-and-flag-its-neighboring':
    'Reveal each control and flag its neighboring mines. Disable both, then prime the core and strike during its opening.',
  'battle-presentation.reveal-nests-and-flag-their-neighboring-mines':
    'Reveal nests and flag their neighboring mines, then destroy them. Each surviving nest heals and armors the queen.',
  'battle-presentation.row-column-and-cross-attacks-remain-fixed':
    'Row, column and cross attacks remain fixed until End turn. The order in which you disable the controls changes the protection and timing available during the approach.',
  'battle-presentation.scout-the-nearest-active-objective-with-undiscovered':
    'Scout the nearest active objective with undiscovered information.',
  'battle-presentation.strike-2-ap': 'Strike · 2 AP',
  'battle-presentation.the-amber-control-reduces-future-attacks-from':
    'The amber control reduces future attacks from 5 to 3 damage. The blue control extends core openings to four turns. Once both are disabled, click the adjacent closed core to prime it for 1 AP. Expired openings can be primed again.',
  'battle-presentation.turn': 'Turn',
  'battle-presentation.turn-ap': 'Turn AP',
  'board-controls.chord':
    'Select an open cell to dig nearby safe marks; matching flags also open unknown neighbors.',
  'board-controls.flag': 'Select a covered cell to flag it; select it again to clear.',
  'board-controls.gestures': 'Right-click / hold: cycle marks, or quick-open neighbors.',
  'board-controls.label': 'Board actions',
  'board-controls.reveal': 'Select a cell to dig; in Expedition, select open ground to move.',
  'board-controls.safe':
    'Select a covered cell to note suspected safety; select it again to clear.',
  'board-controls.tap-to-cycle': 'Tap to cycle',
  'board-help.chord':
    'Right-click or hold an open cell, or use Quick open. Nearby safe notes and confirmed-safe cells can be dug without matching flags; other neighbors require a matching count. Incorrect player marks can still cause a mine hit.',
  'board-help.edge':
    'Built-in Edge gestures are browser-controlled. If right drags still navigate, search Edge Settings for Mouse gesture and disable it.',
  'board-help.expeditionChord':
    'Quick open follows known paths and retains Boss AP costs. Unreachable cells receive notes; a mine hit stops the batch. After C, keyboard focus follows the character.',
  'board-help.extensions': 'Keyboard and mouse extensions',
  'board-help.gestures':
    'Release the right button to act; dragging cancels. If browser gestures still run, disable them for this site in the browser or extension, or use the board controls.',
  'board-help.keyboard':
    'Arrows / H J K L move focus. Enter / Space use the selected mode; F flags, S toggles a safe note, C opens neighbors.',
  'board-help.known':
    'Gold flags are confirmed mines; solid green dots are confirmed safe cells. Confirmed information cannot be removed manually.',
  'board-help.note':
    'Right-click or hold a covered cell to cycle flag, safe note, clear. You can also choose Note safe and select a cell twice to add and remove a note. A cyan check may still contain a mine.',
  'board-help.triggered':
    'Red mines mark hazards you triggered, including hits absorbed by a shield. The mine remains in place.',
  'board-help.vimium':
    'With Vimium, press i to pass keys to the page, or exclude this site. Esc leaves pass-through mode.',
  'boss-prologue.at-the-threshold': 'At the threshold',
  'boss-prologue.continue': 'Continue',
  'boss-prologue.enter-battle': 'Enter battle',
  'boss-prologue.explorer': 'Explorer',
  'boss-prologue.label': '({p0})',
  'boss-prologue.previous': 'Previous',
  'boss-prologue.skip-arrival': 'Skip arrival',
  'boss-scripts.a-buried-anchor-answers-the-pulse-with':
    'A buried anchor answers the pulse with a low bell note. Its numbered rim is scarred by old collisions.',
  'boss-scripts.a-hunger-with-many-mouths': 'A hunger with many mouths',
  'boss-scripts.a-mark-appears-beneath-your-feet-you':
    'A mark appears beneath your feet. You shift aside; the mark stays where it was, patiently counting.',
  'boss-scripts.a-moment-left-behind': 'A moment left behind',
  'boss-scripts.a-repeated-blow-is-only-an-invitation':
    'A repeated blow is only an invitation to be reflected. We have danced this way for years.',
  'boss-scripts.a-seal-glows-in-the-amber-room':
    'A seal glows in the amber room. Its light travels through the mirror and settles around the blue knight.',
  'boss-scripts.a-thread-catches-your-sleeve-then-another':
    'A thread catches your sleeve. Then another. In the dark beyond them, three nests pulse out of time with your heart.',
  'boss-scripts.an-answer-on-the-other-side': 'An answer on the other side',
  'boss-scripts.an-egg-rolls-from-the-nearest-nest':
    'An egg rolls from the nearest nest. A hairline crack appears in its shell; the queen’s plates draw tighter.',
  'boss-scripts.bastion-guardian': 'Bastion Guardian',
  'boss-scripts.beyond-the-stairs-something-immense-draws-a':
    'Beyond the stairs, something immense draws a slow, metallic breath. Two lights answer from opposite ends of the room.',
  'boss-scripts.borrow-the-enemy-s-strength': 'Borrow the enemy’s strength',
  'boss-scripts.brood-queen': 'Brood Queen',
  'boss-scripts.clock-mage-clepsydra': 'Clock Mage · Clepsydra',
  'boss-scripts.cut-the-silk-if-you-like-my':
    'Cut the silk if you like. My children already know where they will leap.',
  'boss-scripts.do-not-hurry-i-have-already-reserved':
    'Do not hurry. I have already reserved a moment for your defeat.',
  'boss-scripts.even-your-footsteps-belong-to-my-field':
    'Even your footsteps belong to my field. Come closer. Or let me choose where you stand.',
  'boss-scripts.i-can-see-their-shadows-gathering-ahead':
    'I can see their shadows gathering ahead of them. A clear lane, one nest at a time. And no eggs left at my heels.',
  'boss-scripts.i-hear-that-little-anchor-singing-when':
    'I hear that little anchor singing. When I answer, do not be in my way.',
  'boss-scripts.it-has-chosen-a-place-and-a':
    'It has chosen a place and a time. Not me. If I leave before that moment, its certainty becomes an empty promise.',
  'boss-scripts.magnetic-knight': 'Magnetic Knight',
  'boss-scripts.mirror-twins': 'Mirror Twins',
  'boss-scripts.my-blade-rings-against-its-armor-not':
    'My blade rings against its armor. Not even a scratch. But that pulse did not come from its chest.',
  'boss-scripts.my-boots-slide-before-i-lift-them':
    'My boots slide before I lift them. I can brace against the pull, but its armor will outlast my strength.',
  'boss-scripts.no-one-passes-the-walls-remember-every':
    'No one passes. The walls remember every blow.',
  'boss-scripts.one-feeds-the-blows-the-other-keeps':
    'One feeds the blows. The other keeps the shell closed. Those numbered stones might lead me to their controls.',
  'boss-scripts.quiet-feet-warm-blood-you-have-come':
    'Quiet feet. Warm blood. You have come a long way to feed us.',
  'boss-scripts.something-of-each-strike-stays-behind-and':
    'Something of each strike stays behind. And those hourglasses carry the same light as its spells. Perhaps their destination is not fixed forever.',
  'boss-scripts.the-amber-light-brightens-the-guardian-s':
    'The amber light brightens; the guardian’s arm rises. The blue light hums, and the opening in its chest snaps shut.',
  'boss-scripts.the-door-that-learned-to-breathe': 'The door that learned to breathe',
  'boss-scripts.the-guardian-settles-its-weight-both-lights':
    'The guardian settles its weight. Both lights burn steadily now. Somewhere beneath the armor, a smaller heartbeat waits.',
  'boss-scripts.the-knight-closes-its-fists-for-an':
    'The knight closes its fists. For an instant, between two layers of armor, an unsteady light flickers.',
  'boss-scripts.the-last-grain-of-sand-falls-upward':
    'The last grain of sand falls upward. Your shadow arrives at the foot of the stairs a heartbeat after you do.',
  'boss-scripts.the-mirror-clears-two-paths-wait-and':
    'The mirror clears. Two paths wait, and somewhere between them your last footprint is still warm.',
  'boss-scripts.the-needle-in-your-compass-turns-sideways':
    'The needle in your compass turns sideways. Iron dust crawls across the tiles toward a motionless knight.',
  'boss-scripts.the-nests-are-more-than-nurseries-if':
    'The nests are more than nurseries. If one falls silent, perhaps she loses more than a child.',
  'boss-scripts.the-pull-is-gathering-not-striking-yet':
    'The pull is gathering, not striking yet. There is time to withdraw. Far enough from the anchor, too—those cracked stones will not survive the impact.',
  'boss-scripts.the-queen-lifts-herself-from-the-floor':
    'The queen lifts herself from the floor. Behind her, something small taps twice against a shell.',
  'boss-scripts.the-rooms-share-a-shape-but-not':
    'The rooms share a shape, but not their dangers. A mine’s dull hum on this side becomes silence across the glass.',
  'boss-scripts.the-wound-i-made-is-closing-something':
    'The wound I made is closing. Something is flowing into her from those nests.',
  'boss-scripts.their-protection-comes-from-the-other-room':
    'Their protection comes from the other room. I cannot solve everything by staying here.',
  'boss-scripts.then-i-change-partners-remember-where-i':
    'Then I change partners. Remember where I stood, carry each discovery across, and do not chase the same face twice.',
  'boss-scripts.then-i-will-read-the-floor-before':
    'Then I will read the floor before I cross it. And when that seam opens again, I need to be close enough.',
  'boss-scripts.then-send-its-spell-back-to-shatter':
    'Then send its spell back to shatter that barrier. Strike, step away, and let my echo strike again.',
  'boss-scripts.those-scars-it-has-been-drawn-here':
    'Those scars… It has been drawn here before. If I clear the way and wake the anchor, the field might do the heavy work for me.',
  'boss-scripts.touch-my-clocks-if-you-must-borrowed':
    'Touch my clocks if you must. Borrowed time always finds someone to collect from.',
  'boss-scripts.which-of-us-did-you-come-to':
    'Which of us did you come to strike? Think carefully. We remember.',
  'boss-scripts.you-watch-the-lamps-instead-of-the':
    'You watch the lamps instead of the gate? The floor has swallowed wiser trespassers.',
  'boss-scripts.your-hand-drops-but-the-outline-it':
    'Your hand drops, but the outline it left behind finishes the motion. The mage glances at it, displeased.',
  'boss-scripts.your-reflection-takes-one-more-step-after':
    'Your reflection takes one more step after you stop. Amber light fills one chamber; blue moonlight fills another.',
  'brood-board.nest-destroyed': 'Nest destroyed',
  'brood-board.nest-reveal-and-flag-nearby-mines-to':
    'Nest · reveal and flag nearby mines to destroy',
  'brood-board.next-hatchling-position': 'Next hatchling position',
  'brood-copy.egg-hatches-in-turns-clear-adjacent-for':
    'Egg · hatches in {p0} turns · clear adjacent for 1 AP',
  'brood-copy.hatchling-clear-adjacent-for-1-ap': 'Hatchling · clear adjacent for 1 AP',
  'brood-copy.web-clear-adjacent-for-1-ap': 'Web · clear adjacent for 1 AP',
  'camp-copy.achievements': 'Achievements',
  'camp-copy.all': 'All',
  'camp-copy.back-to-camp': 'Back to camp',
  'camp-copy.build-a-three-point-loadout': 'Build a three-point loadout.',
  'camp-copy.choose-board-size-and-expedition-length': 'Choose board size and expedition length.',
  'camp-copy.choose-your-explorer-and-skill': 'Choose your explorer and skill.',
  'camp-copy.count-floors': '{count} floors',
  'camp-copy.count-unlocked': '{count} unlocked',
  'camp-copy.equipment': 'Equipment',
  'camp-copy.loadout': 'Loadout',
  'camp-copy.loadout-points': 'Loadout points',
  'camp-copy.missions': 'Missions',
  'camp-copy.need-count-more-supplies': 'Need {count} more supplies',
  'camp-copy.no-equipment-selected': 'No equipment selected',
  'camp-copy.purchase': 'Purchase',
  'camp-copy.ready-for-departure': 'Ready for departure',
  'camp-copy.relics': 'Relics',
  'camp-copy.select-an-item-to-see-its-effect': 'Select an item to see its effect.',
  'camp-copy.shop': 'Shop',
  'camp-copy.unlock-careers-equipment-and-relics': 'Unlock careers, equipment and relics.',
  'camp-copy.unlock-the-workshop-before-buying-and-equipping':
    'Unlock the Workshop before buying and equipping departure gear.',
  'camp-template.explore-complete-goals-claim-exclusive-gear':
    'Explore, complete goals, claim exclusive gear.',
  'camp-template.long-term-milestones-with-lasting-rewards':
    'Long-term milestones with lasting rewards.',
  'camp-template.ready': 'ready',
  'clock-board.echo': 'Echo: {p0} · {p1}',
  'clock-board.echo-move': 'Move away to activate',
  'clock-board.echo-pending-damage': 'Echo · pending damage {p0}',
  'clock-board.echo-ready': 'Ready to strike',
  'clock-board.hourglass-reveal-approach-return-earliest-spell-1':
    'Hourglass · reveal, approach, return earliest spell · 1 AP',
  'clock-board.last-turn-echo-returned-spell': 'Last turn: echo {p0}, returned spell {p1}',
  'clock-board.spent-hourglass-walkable': 'Spent hourglass · walkable',
  'clock-copy.an-adjacent-or-occupied-revealed-hourglass-returns':
    'An adjacent or occupied revealed hourglass returns the earliest hostile spell for 1 AP, once per glass. It deals 6 boss damage and prevents new casting during the following turn. Already announced spells keep their deadlines. The first return permanently breaks the barrier; attacks are blocked until then. Mines and clues never rewind.',
  'clock-copy.barrier-return-a-spell-first': 'Barrier · return a spell first',
  'clock-copy.clock-hand-damage-3': 'Clock hand · damage 3',
  'clock-copy.clock-mage-clepsydra': 'Clock Mage · Clepsydra',
  'clock-copy.delayed-casting': 'Delayed casting',
  'clock-copy.dual-countdown': 'Dual countdown',
  'clock-copy.each-turn-starts-with-a-walkable-echo':
    'Each turn starts with a walkable echo at your feet. Move away from it to repeat the full first successful strike damage at turn end; no extra item or skill triggers. Incoming spells resolve first: a fatal hit prevents your follow-up.',
  'clock-copy.hourglasses-3': 'Hourglasses {p0}/3',
  'clock-copy.in-turn-ends': 'In {p0} turn ends',
  'clock-copy.marks-deal-3-damage-after-two-turn':
    'Marks deal 3 damage after two turn ends. At half health, a line also resolves after three. Overlaps add; forecasts never chase movement. A new pattern is reduced or skipped if known walking routes cannot escape it.',
  'clock-copy.recovery-no-new-spell': 'Recovery · no new spell',
  'clock-copy.return-a-spell-with-an-hourglass-to':
    'Return a spell with an hourglass to break the barrier. Then strike, retreat and let your echo follow up.',
  'clock-copy.returned-spell-boss-damage-6': 'Returned spell · boss damage 6',
  'clock-copy.spell-returned-deadline-unchanged': 'Spell returned · deadline unchanged',
  'clock-copy.this-turn-end': 'This turn end',
  'clock-copy.time-mark-damage-3': 'Time mark · damage 3',
  'combat-build-copy.1-ap-every-combat-turn-up-to': '+1 AP every combat turn, up to 5.',
  'combat-build-copy.1-loadout-point-starting-and-maximum-health':
    '1 loadout point. Starting and maximum health +2.',
  'combat-build-copy.1-loadout-point-the-first-control-or':
    '1 loadout point. The first control or seal disabled, nest destroyed, anchor calibrated, or crystal shield broken each turn refunds 1 AP.',
  'combat-build-copy.1-loadout-point-the-first-web-egg':
    '1 loadout point. The first web, egg or hatchling cleared each turn refunds 1 AP.',
  'combat-build-copy.2-loadout-points-1-ap-on-even':
    '2 loadout points. +1 AP on even turns, up to 5.',
  'combat-build-copy.2-loadout-points-attack-2': '2 loadout points. Attack +2.',
  'combat-build-copy.2-loadout-points-defense-1-against-enemy':
    '2 loadout points. Defense +1 against enemy attacks; does not reduce mine damage.',
  'combat-build-copy.add-attack-defense-and-action-point-relics':
    'Add attack, defense and action-point relics to future expedition rewards.',
  'combat-build-copy.attack-3-for-this-expedition': 'Attack +3 for this expedition.',
  'combat-build-copy.battle-manual': 'Battle manual',
  'combat-build-copy.clearing-hook': 'Clearing hook',
  'combat-build-copy.defense-1-against-enemy-attacks-for-this':
    'Defense +1 against enemy attacks for this expedition.',
  'combat-build-copy.endurance-training': 'Endurance training',
  'combat-build-copy.field-boots': 'Field boots',
  'combat-build-copy.focus-lens': 'Focus lens',
  'combat-build-copy.layered-armor': 'Layered armor',
  'combat-build-copy.medical-kit': 'Medical kit',
  'combat-build-copy.mines-deal-5-damage-each-shield-absorbs':
    'Mines deal 5 damage. Each shield absorbs up to 5; floor exits restore 5 health. Armor reduces enemy attacks only.',
  'combat-build-copy.one-purchase-only-base-attack-1-on':
    'One purchase only. Base attack +1 on future departures.',
  'combat-build-copy.one-purchase-only-starting-and-maximum-health':
    'One purchase only. Starting and maximum health +1 on future departures.',
  'combat-build-copy.plated-vest': 'Plated vest',
  'combat-build-copy.steel-blade': 'Steel blade',
  'combat-build-copy.tactics-hourglass': 'Tactics hourglass',
  'combat-build-copy.tempered-edge': 'Tempered edge',
  'combat-build-copy.weapon-training': 'Weapon training',
  'journey-relic-copy.a-row-scan-confirming-at-least-2':
    'A row scan confirming at least 2 new mines grants 1 probe. Once per floor; cap 4.',
  'journey-relic-copy.add-breach-sigil-and-duelist-edge-recover':
    'Add Breach sigil and Duelist edge: recover AP when breaking defenses and strengthen the opening strike.',
  'journey-relic-copy.add-marching-boots-and-shelter-cloak-cheaper':
    'Add Marching boots and Shelter cloak: cheaper combat movement and protection for avoiding warnings.',
  'journey-relic-copy.add-probe-recycler-and-spare-coil-recover':
    'Add Probe recycler and Spare coil: recover probes from careful surveying and productive row scans.',
  'journey-relic-copy.add-reserve-watch-and-second-hand-bank':
    'Add Reserve watch and Second hand: bank a turn of spare effort and recover tools during longer battles.',
  'journey-relic-copy.add-skill-capacitor-and-emergency-gears-link':
    'Add Skill capacitor and Emergency gears: link career skills with scans and rebuild empty probe stocks.',
  'journey-relic-copy.add-trail-thread-and-landmark-lens-earn':
    'Add Trail thread and Landmark lens: earn scans by travelling and survey around collected chests.',
  'journey-relic-copy.after-surviving-the-third-combat-turn-gain':
    'After surviving the third combat turn, gain 1 probe and 1 scan. Once per floor; cap 4 each.',
  'journey-relic-copy.breach-sigil': 'Breach sigil',
  'journey-relic-copy.cartographer-charts': 'Cartographer charts',
  'journey-relic-copy.chronologist-dials': 'Chronologist dials',
  'journey-relic-copy.duelist-edge': 'Duelist edge',
  'journey-relic-copy.duelist-marks': 'Duelist marks',
  'journey-relic-copy.emergency-gears': 'Emergency gears',
  'journey-relic-copy.end-a-combat-turn-outside-the-warning':
    'End a combat turn outside the warning area to gain 1 shield. Once per floor; cap 2.',
  'journey-relic-copy.first-control-or-seal-disabled-or-anchor':
    'First control or seal disabled, anchor calibrated, or crystal shield broken each floor refunds 1 AP, up to 5.',
  'journey-relic-copy.first-strike-each-floor-4-damage': 'First strike each floor: +4 damage.',
  'journey-relic-copy.in-combat-your-first-walk-of-2':
    'In combat, your first walk of 2 or more steps each turn costs 1 less AP. Minimum cost 1; reveals excluded.',
  'journey-relic-copy.landmark-lens': 'Landmark lens',
  'journey-relic-copy.marching-boots': 'Marching boots',
  'journey-relic-copy.mechanist-gears': 'Mechanist gears',
  'journey-relic-copy.once-per-floor-end-a-turn-with':
    'Once per floor, end a turn with at least 1 AP left to add 1 AP next turn, up to 5.',
  'journey-relic-copy.probe-recycler': 'Probe recycler',
  'journey-relic-copy.refund-the-first-probe-each-floor-that':
    'Refund the first probe each floor that reveals new information but confirms no new mines.',
  'journey-relic-copy.reserve-watch': 'Reserve watch',
  'journey-relic-copy.salvager-kit': 'Salvager kit',
  'journey-relic-copy.second-hand': 'Second hand',
  'journey-relic-copy.shelter-cloak': 'Shelter cloak',
  'journey-relic-copy.skill-capacitor': 'Skill capacitor',
  'journey-relic-copy.spare-coil': 'Spare coil',
  'journey-relic-copy.the-first-chest-collected-each-floor-surveys':
    'The first chest collected each floor surveys the 3×3 area around that chest.',
  'journey-relic-copy.trail-thread': 'Trail thread',
  'journey-relic-copy.use-a-row-scan-while-out-of':
    'Use a row scan while out of probes to gain 2 probes. Once per floor; cap 4.',
  'journey-relic-copy.using-your-profession-skill-grants-1-scan':
    'Using your profession skill grants 1 scan. Once per floor; cap 4.',
  'journey-relic-copy.visit-12-new-safe-squares-to-gain':
    'Visit 12 new safe squares to gain 1 scan. Once per floor; cap 4. Backtracking does not count.',
  'journey-relic-copy.wayfarer-tokens': 'Wayfarer tokens',
  'magnetic-board.anchor-reveal-and-flag-surrounding-mines':
    'Anchor · reveal and flag surrounding mines',
  'magnetic-board.calibrated-anchor-enter-to-ground-click-again':
    'Calibrated anchor · enter to ground, click again to lure',
  'magnetic-board.detonated-mine-walkable-crater': 'Detonated mine · walkable crater',
  'magnetic-copy.a-crash-opens-the-entire-3-3':
    'A crash opens the entire 3×3 zone, destroys its mines and blocking terrain, and leaves walkable craters. Numbers update to count remaining mines. The knight takes 6 damage plus 1 per detonated mine (at most 3 extra), always retaining 1 HP, then exposes its core for three turns. Anyone in the zone takes 5 base blast damage, separately from charge damage. Defense and bracing reduce each hit to a minimum of 1. Ordinary player mine hits still leave impassable mines.',
  'magnetic-copy.activation-cancels-the-pulse-the-first-end':
    'Activation cancels the pulse. The first End turn only charges up; you then have a full escape turn before the next End turn launches the knight. Clear the gold route and the outlined 3×3 blast zone. Blocking the anchor cancels the crash. Passing through you deals 5 base damage.',
  'magnetic-copy.anchor-calibrated-lure-committed': 'Anchor calibrated · lure committed',
  'magnetic-copy.arrows-show-the-next-magnetic-pulse-blue':
    'Arrows show the next magnetic pulse. Blue pulls toward the knight’s axis; coral pushes away, up to two cells. The outlined ghost shows your projected landing. A dashed amber path crosses unverified terrain; it does not reveal hidden mines.',
  'magnetic-copy.attract': 'Attract · {p0}',
  'magnetic-copy.brace-for-1-ap-to-reduce-forced':
    'Brace for 1 AP to reduce forced movement by one cell. Calibrated anchors also ground you. A mine stops you before it and deals 5 damage ignoring defense. Wall or edge collisions deal 3 base damage, reduced by defense to a minimum of 1. Every third turn has no pulse.',
  'magnetic-copy.charge-at-end-turn-leave-the-route':
    'Charge at End turn · leave the route and 3×3 blast zone',
  'magnetic-copy.charging-one-full-escape-turn-after-end':
    'Charging · one full escape turn after End turn',
  'magnetic-copy.clear-a-route-to-an-anchor-calibrate':
    'Clear a route to an anchor. Calibrate it, lure the knight, then strike its exposed core.',
  'magnetic-copy.collision-base-3-damage-reduced-by-defense':
    'Collision · base 3 damage, reduced by defense',
  'magnetic-copy.core-exposed-turns': 'Core exposed · {p0} turns',
  'magnetic-copy.defeated': 'Defeated',
  'magnetic-copy.grounded-resist-displacement': 'Grounded · resist displacement',
  'magnetic-copy.horizontal': 'horizontal',
  'magnetic-copy.known-mine-on-the-route': 'Known mine on the route',
  'magnetic-copy.magnetic-knight': 'Magnetic Knight',
  'magnetic-copy.projected-landing': 'Projected landing',
  'magnetic-copy.projected-route-unverified-cells': 'Projected route · unverified cells',
  'magnetic-copy.recharge-no-pulse': 'Recharge · no pulse',
  'magnetic-copy.repel': 'Repel · {p0}',
  'magnetic-copy.reveal-an-anchor-and-flag-its-surrounding':
    'Reveal an anchor and flag its surrounding mines. From it or an adjacent cell, click it for 1 AP. A known open route at least two cells long must connect it to the knight. Wrong calibration deals 5 damage. Later lures reuse the calibration.',
  'magnetic-copy.vertical': 'vertical',
  'milestone-copy.abyss-veteran': 'Abyss veteran',
  'milestone-copy.acquire-8-different-relics-across-expeditions-offers':
    'Acquire 8 different relics across expeditions. Offers alone do not count.',
  'milestone-copy.against-the-clock': 'Against the clock',
  'milestone-copy.beyond-the-entrance': 'Beyond the entrance',
  'milestone-copy.beyond-the-mirror': 'Beyond the mirror',
  'milestone-copy.boss-challenger': 'Boss challenger',
  'milestone-copy.boss-hunter': 'Boss hunter',
  'milestone-copy.break-the-bastion': 'Break the bastion',
  'milestone-copy.cache-runner': 'Cache runner',
  'milestone-copy.cache-seeker': 'Cache seeker',
  'milestone-copy.clear-5-floors-across-expeditions': 'Clear 5 floors across expeditions.',
  'milestone-copy.clock-hunt': 'Clock hunt',
  'milestone-copy.collect-3-treasure-chests-across-expeditions':
    'Collect 3 treasure chests across expeditions.',
  'milestone-copy.deep-descent': 'Deep descent',
  'milestone-copy.defeat-10-bosses-across-expeditions': 'Defeat 10 bosses across expeditions.',
  'milestone-copy.defeat-both-twins-without-losing-health-revival':
    'Defeat both twins without losing health. Revival counts as damage.',
  'milestone-copy.defeat-four-different-boss-families': 'Defeat four different boss families.',
  'milestone-copy.defeat-the-bastion-without-losing-health-revival':
    'Defeat the bastion without losing health. Revival counts as damage.',
  'milestone-copy.defeat-the-brood-queen-without-clearing-any':
    'Defeat the Brood Queen without clearing any webs during the fight.',
  'milestone-copy.defeat-the-clock-boss-using-exactly-one':
    'Defeat the clock boss using exactly one arena hourglass.',
  'milestone-copy.defeat-the-magnetic-boss-without-being-pushed':
    'Defeat the magnetic boss without being pushed or pulled onto a mine. Shields do not excuse mine contact.',
  'milestone-copy.defeat-the-queen-while-leaving-at-least':
    'Defeat the queen while leaving at least one nest intact.',
  'milestone-copy.defeat-this-boss-once': 'Defeat this boss once.',
  'milestone-copy.defeat-your-first-boss': 'Defeat your first boss.',
  'milestone-copy.demolition-expert': 'Demolition expert',
  'milestone-copy.depth-legend': 'Depth legend',
  'milestone-copy.field-practice': 'Field practice',
  'milestone-copy.first-challenger': 'First challenger',
  'milestone-copy.first-footsteps': 'First footsteps',
  'milestone-copy.four-legends': 'Four legends',
  'milestone-copy.homeward-bound': 'Homeward bound',
  'milestone-copy.into-the-abyss': 'Into the abyss',
  'milestone-copy.into-the-nest': 'Into the nest',
  'milestone-copy.long-road': 'Long road',
  'milestone-copy.lure-a-charge-into-at-least-one':
    'Lure a charge into at least one mine, then defeat the magnetic boss.',
  'milestone-copy.magnet-hunt': 'Magnet hunt',
  'milestone-copy.master-of-magnetism': 'Master of magnetism',
  'milestone-copy.queen-hunt': 'Queen hunt',
  'milestone-copy.relic-curator': 'Relic curator',
  'milestone-copy.relic-museum': 'Relic museum',
  'milestone-copy.return-route': 'Return route',
  'milestone-copy.rift-pioneer': 'Rift pioneer',
  'milestone-copy.seasoned-explorer': 'Seasoned explorer',
  'milestone-copy.skill-adept': 'Skill adept',
  'milestone-copy.skill-legend': 'Skill legend',
  'milestone-copy.skill-master': 'Skill master',
  'milestone-copy.skill-student': 'Skill student',
  'milestone-copy.successfully-use-a-profession-skill-3-times':
    'Successfully use a profession skill 3 times.',
  'milestone-copy.total-1-expedition-victory': 'Total: 1 expedition victory.',
  'milestone-copy.total-10-chests-collected': 'Total: 10 chests collected.',
  'milestone-copy.total-10-successful-profession-skills': 'Total: 10 successful profession skills.',
  'milestone-copy.total-12-floors-cleared': 'Total: 12 floors cleared.',
  'milestone-copy.total-150-floors-cleared': 'Total: 150 floors cleared.',
  'milestone-copy.total-150-new-safe-squares-visited': 'Total: 150 new safe squares visited.',
  'milestone-copy.total-1500-new-safe-squares-visited': 'Total: 1500 new safe squares visited.',
  'milestone-copy.total-20-different-relics-acquired': 'Total: 20 different relics acquired.',
  'milestone-copy.total-200-chests-collected': 'Total: 200 chests collected.',
  'milestone-copy.total-200-successful-profession-skills':
    'Total: 200 successful profession skills.',
  'milestone-copy.total-25-chests-collected': 'Total: 25 chests collected.',
  'milestone-copy.total-25-floors-cleared': 'Total: 25 floors cleared.',
  'milestone-copy.total-25-successful-profession-skills': 'Total: 25 successful profession skills.',
  'milestone-copy.total-3-bosses-defeated': 'Total: 3 bosses defeated.',
  'milestone-copy.total-5-abyss-victories': 'Total: 5 Abyss victories.',
  'milestone-copy.total-50-floors-cleared': 'Total: 50 floors cleared.',
  'milestone-copy.total-500-new-safe-squares-visited': 'Total: 500 new safe squares visited.',
  'milestone-copy.total-60-new-safe-squares-visited': 'Total: 60 new safe squares visited.',
  'milestone-copy.total-75-chests-collected': 'Total: 75 chests collected.',
  'milestone-copy.total-75-successful-profession-skills': 'Total: 75 successful profession skills.',
  'milestone-copy.trail-apprentice': 'Trail apprentice',
  'milestone-copy.trail-guide': 'Trail guide',
  'milestone-copy.treasure-legend': 'Treasure legend',
  'milestone-copy.treasure-scout': 'Treasure scout',
  'milestone-copy.treasure-vault': 'Treasure vault',
  'milestone-copy.twin-hunt': 'Twin hunt',
  'milestone-copy.untouched-bulwark': 'Untouched bulwark',
  'milestone-copy.visit-20-new-safe-squares-across-expeditions':
    'Visit 20 new safe squares across expeditions. Backtracking does not count.',
  'milestone-copy.web-walker': 'Web walker',
  'milestone-copy.win-3-expeditions-existing-camp-victories-count':
    'Win 3 expeditions. Existing camp victories count.',
  'milestone-copy.win-an-expedition-on-abyss-difficulty': 'Win an expedition on Abyss difficulty.',
  'milestone-copy.world-walker': 'World walker',
  'milestone-notices.achievement': 'Achievement',
  'milestone-notices.completed': 'Completed',
  'milestone-notices.dismiss': 'Dismiss',
  'milestone-notices.halfway-there': 'Halfway there',
  'milestone-notices.mission': 'Mission',
  'milestone-template.claim-reward': 'Claim reward',
  'milestone-template.claimed': 'Claimed',
  'milestone-template.completed': 'Completed',
  'milestone-template.in-progress': 'In progress',
  'milestone-template.keep-exploring': 'Keep exploring',
  'milestone-template.ready-to-claim': 'Ready to claim',
  'milestone-template.title': 'Title',
  'mirror-board.compare-shift-to-play': 'Compare · shift to play',
  'mirror-board.explore-here': 'Explore here',
  'mirror-board.seal-disabled': 'Seal disabled',
  'mirror-board.seal-protects-the-opposite-twin': 'Seal · protects the opposite twin',
  'mirror-copy.compare-both-realms-disable-each-seal-to':
    'Compare both realms. Disable each seal to expose the opposite twin, then alternate your strikes.',
  'mirror-copy.dawn': 'Dawn',
  'mirror-copy.dawn-alternates-rows-and-columns-dusk-alternates':
    'Dawn alternates rows and columns; Dusk alternates diagonals. Every third turn both recharge without attacking. Forecasts stay fixed until End turn; only your active realm can hurt you. Shifting does not end the turn.',
  'mirror-copy.defeated': 'Defeated',
  'mirror-copy.dusk': 'Dusk',
  'mirror-copy.exposed': 'Exposed',
  'mirror-copy.mirror-seal-protects-the-opposite-twin': 'Mirror seal · protects the opposite twin',
  'mirror-copy.mirror-twins': 'Mirror Twins',
  'mirror-copy.protected-by-seal': 'Protected by {p0} seal',
  'mirror-copy.reflecting-strike-the-other-twin': 'Reflecting · strike the other twin',
  'mirror-copy.reveal-a-seal-correctly-flag-every-neighboring':
    'Reveal a seal, correctly flag every neighboring mine, then approach and disable it for 1 AP. Each seal protects the other realm’s twin. Incorrect calibration deals 5 damage.',
  'mirror-copy.seal-disabled-opposite-twin-exposed': 'Seal disabled · opposite twin exposed',
  'mirror-copy.shift-costs-1-ap-and-resumes-your':
    'Shift costs 1 AP and resumes your last position in the other realm. The comparison board is read-only. Both positions are remembered; health, tools, skills and relic limits are shared.',
  'mirror-copy.the-same-coordinate-cannot-contain-a-mine':
    'The same coordinate cannot contain a mine in both realms. Compare clues and flags; gold confirmed mines automatically mark their counterparts safe. Ordinary flags remain your own hypotheses.',
  'mirror-copy.while-both-twins-live-striking-one-activates':
    'While both twins live, striking one activates its reflection until you strike the other. Defeating one cancels its forecast; the survivor loses reflection and its future attacks increase from 5 to 7 damage.',
  'mirror-template.attacks-resolve-at-end-turn-both-recharge':
    'Attacks resolve at End turn · both recharge every third turn',
  'mirror-template.mirror-twins': 'Mirror Twins',
  'mirror-template.recharging-no-enemy-attacks-this-turn':
    'Recharging · no enemy attacks this turn',
  'profession-skill-copy.available-during-exploration': 'Available during exploration',
  'profession-skill-copy.check-the-cost-and-resource-caps': 'Check the cost and resource caps',
  'profession-skill-copy.choose-a-revealed-safe-landing-two-squares':
    'Choose a revealed safe landing two squares away across one confirmed mine or wall. Cross in one action, once per floor. A two-way rift remains in this room for ordinary walking. Mines stay intact; cannot cross boss bodies.',
  'profession-skill-copy.column-survey': 'Column survey',
  'profession-skill-copy.confirm-mines-and-safe-cells-in-the':
    'Confirm mines and safe cells in the 3×3 area around your character.',
  'profession-skill-copy.confirm-mines-and-safe-cells-in-your':
    'Confirm mines and safe cells in your character’s entire column.',
  'profession-skill-copy.excavate': 'Excavate',
  'profession-skill-copy.field-repair': 'Field repair',
  'profession-skill-copy.first-use-places-an-anchor-at-your':
    'First use places an anchor at your position. Use again from elsewhere to return. Each use costs an action; one return per floor. Same room only; occupied anchors cannot be used.',
  'profession-skill-copy.move-away-from-the-anchor-its-landing':
    'Move away from the anchor; its landing must be unoccupied',
  'profession-skill-copy.no-new-information-here-reposition-or-explore':
    'No new information here · reposition or explore',
  'profession-skill-copy.open-rift': 'Open rift',
  'profession-skill-copy.return-anchor': 'Return anchor',
  'profession-skill-copy.reveal-a-safe-landing-across-a-confirmed':
    'Reveal a safe landing across a confirmed mine or wall, two squares away',
  'profession-skill-copy.scout-the-nearest-uncollected-chest-s-3':
    'Scout the nearest uncollected chest’s 3×3 area: open safe clues and mark mines. Walk there to collect it. Relic rewards offer up to 4 choices.',
  'profession-skill-copy.spend-1-scan-to-gain-1-shield':
    'Spend 1 scan to gain 1 shield. Shield cap: 2.',
  'profession-skill-copy.spend-1-shield-to-confirm-mines-and':
    'Spend 1 shield to confirm mines and safe cells in the 5×5 area around your character.',
  'profession-skill-copy.spend-1-shield-to-gain-1-probe':
    'Spend 1 shield to gain 1 probe and 1 scan. Both tools need room below their cap of 4.',
  'profession-skill-copy.trail-light': 'Trail light',
  'profession-skill-copy.transmute': 'Transmute',
  'profession-skill-copy.use-once-per-floor': 'Use · once per floor',
  'profession-skill-copy.used-refreshes-next-floor': 'Used · refreshes next floor',
  'profession-skill-copy.watchtower': 'Watchtower',
  'profession-skill-template.cross-to': 'Cross to',
  'profession-skill-template.next-use-place-anchor': 'Next use: place anchor',
  'profession-skill-template.not-enough-action-points-end-your-turn':
    'Not enough action points · end your turn first',
  'profession-skill-template.return-anchor-row-column': 'Return anchor (row, column)',
  'relic-expansion-copy.a-probe-confirming-2-new-mines-grants':
    'A probe confirming 2 new mines grants 1 scan. Once per floor; cap 4.',
  'relic-expansion-copy.add-field-dressing-and-second-wind-chest':
    'Add Field dressing and Second wind: chest healing and one lethal-hit recovery.',
  'relic-expansion-copy.add-field-notes-and-rangefinder-to-future':
    'Add Field notes and Rangefinder to future offers: turn new discoveries into tools.',
  'relic-expansion-copy.add-reactive-shell-and-rescue-ribbon-shield':
    'Add Reactive shell and Rescue ribbon: shield reconnaissance and emergency protection.',
  'relic-expansion-copy.add-supply-cache-and-cache-guard-recover':
    'Add Supply cache and Cache guard: recover scans and earn protection by collecting chests.',
  'relic-expansion-copy.cache-guard': 'Cache guard',
  'relic-expansion-copy.collect-all-3-chests-on-a-floor':
    'Collect all 3 chests on a floor to gain 1 shield. Once per floor; cap 2.',
  'relic-expansion-copy.confirm-3-mines-on-a-floor-to':
    'Confirm 3 mines on a floor to gain 1 probe. Once per floor; cap 4.',
  'relic-expansion-copy.field-dressing': 'Field dressing',
  'relic-expansion-copy.field-notes': 'Field notes',
  'relic-expansion-copy.first-chest-each-floor-restores-5-health':
    'First chest each floor restores 5 health.',
  'relic-expansion-copy.guardian-crests': 'Guardian crests',
  'relic-expansion-copy.once-per-expedition-survive-lethal-damage-with':
    'Once per expedition, survive lethal damage with 5 health.',
  'relic-expansion-copy.prospector-seals': 'Prospector seals',
  'relic-expansion-copy.rangefinder': 'Rangefinder',
  'relic-expansion-copy.reactive-shell': 'Reactive shell',
  'relic-expansion-copy.rescue-ribbon': 'Rescue ribbon',
  'relic-expansion-copy.second-wind': 'Second wind',
  'relic-expansion-copy.supply-cache': 'Supply cache',
  'relic-expansion-copy.surveyor-notes': 'Surveyor notes',
  'relic-expansion-copy.survival-charms': 'Survival charms',
  'relic-expansion-copy.survive-health-damage-to-gain-1-shield':
    'Survive health damage to gain 1 shield. Once per expedition; cap 2.',
  'relic-expansion-copy.the-first-chest-collected-each-floor-grants':
    'The first chest collected each floor grants 1 scan, up to 4.',
  'relic-expansion-copy.the-first-shielded-mine-hit-each-floor':
    'The first shielded mine hit each floor surveys its surrounding 3×3 area.',
  'sonar-copy.already-scanned-reading-selected': 'Already scanned · reading selected',
  'sonar-copy.choose-send-pulse-then-a-center-square':
    'Choose Send pulse, then a center square. The clipped 3 × 3 region reports its total mines, including flags. Mines stay fixed; their individual locations remain hidden.',
  'sonar-copy.choose-the-center-of-a-3-3': 'Choose the center of a 3 × 3 region. Esc cancels.',
  'sonar-copy.compare-echoes': 'Compare echoes',
  'sonar-copy.compare-two-echoes': 'Compare two echoes',
  'sonar-copy.echo': 'Echo',
  'sonar-copy.echo-log': 'Echo log',
  'sonar-copy.enlarge-squares': 'Enlarge squares',
  'sonar-copy.every-echo-accounted-for': 'Every echo, accounted for.',
  'sonar-copy.exclusive-region': 'Exclusive region',
  'sonar-copy.fewest-moves-first-fewer-pulses-break-ties':
    'Fewest moves first; fewer pulses break ties.',
  'sonar-copy.fit-board': 'Fit board',
  'sonar-copy.make-each-pulse-count': 'Make each pulse count',
  'sonar-copy.mine-difference-outside-the-overlap': 'Mine difference outside the overlap',
  'sonar-copy.mines': 'mines',
  'sonar-copy.moves': 'Moves',
  'sonar-copy.no-pulses-left-four-safe-excavations-recharge':
    'No pulses left. Four safe excavations recharge one.',
  'sonar-copy.one-echo-left-unanswered': 'One echo left unanswered.',
  'sonar-copy.open-a-square-to-start': 'Open a square to start.',
  'sonar-copy.open-the-board': 'Open the board',
  'sonar-copy.pulses-left': 'Pulses left',
  'sonar-copy.pulses-used': 'Pulses used',
  'sonar-copy.scan-target': 'Scan target',
  'sonar-copy.scan-to-open-the-center-mines-become':
    'Scan to open the center; mines become gold flags. Every 4 safe excavations recharge a pulse.',
  'sonar-copy.select-a-square-to-open-it': 'Select a square to open it.',
  'sonar-copy.select-two-log-entries-their-shared-squares':
    'Select two log entries. Their shared squares cancel: the difference between totals equals the difference between their exclusive regions. Flags remain your own guesses.',
  'sonar-copy.select-two-readings-to-compare-their-regions':
    'Select two readings to compare their regions.',
  'sonar-copy.send-pulse': 'Send pulse',
  'sonar-copy.shared-squares': 'Shared squares',
  'sonar-copy.sonar': 'Sonar',
  'sonar-copy.spend-a-pulse': 'Spend a pulse',
  'sonar-copy.start-with-three-pulses-four-safe-excavation':
    'Start with three pulses; four safe excavation actions recharge one. Click to target or drag Sonar onto a square. The scanned 3×3 region stays clear of obscured clues, including squares you uncover later. Only the center opens; a mine becomes a locked gold flag. Selecting a previous center recalls its reading for free. Q aims; Enter/Space scans; Esc cancels. F flags, S notes safety, C quick-opens; right-click or hold cycles marks. A scan counts separately from board moves.',
  'sonar-copy.the-first-opening-and-its-neighbors-are':
    'The first opening and its neighbors are safe. Reveal every safe square to win.',
  'sonar-copy.the-saved-puzzle-could-not-be-restored':
    'The saved puzzle could not be restored. Your valid records were kept.',
  'sonar-copy.this-puzzle-reached-its-move-limit-start':
    'This puzzle reached its move limit. Start a new board.',
  'sonar-copy.tutorial': 'Tutorial',
  'sonar-copy.your-first-clear-belongs-here': 'Your first clear belongs here.',
  'sonar-copy.your-readings-will-appear-here': 'Your readings will appear here.',
  'sonar-view.confirmed-mine': 'Confirmed mine',
  'sonar-view.obscured-clue-scan-to-clarify': 'Obscured clue · scan to clarify',
  'sonar-view.recharge': 'Recharge',
  'sonar-view.recharge-progress-label': 'Recharge',
  'tactical-copy.already-used-or-the-target-is-cleared': 'Already used, or the target is cleared',
  'tactical-copy.anchors-recharge-after-the-lure-and-exposure':
    'Anchors recharge after the lure and exposure window',
  'tactical-copy.approach-and-click-the-core-to-prime':
    'Approach and click the core to prime it for 1 AP',
  'tactical-copy.attack-avoided-or-blocked': 'Attack avoided or blocked',
  'tactical-copy.battle-in-progress-watch-the-attack-forecast':
    'Battle in progress · watch the attack forecast',
  'tactical-copy.braced-reduce-enemy-damage-by-3-this':
    'Braced · reduce enemy damage by 3 this turn',
  'tactical-copy.calibration-failed-5-damage': 'Calibration failed · 5 damage',
  'tactical-copy.choose-a-reachable-cell': 'Choose a reachable cell',
  'tactical-copy.core-overloaded-three-turn-strike-window':
    'Core overloaded · three-turn strike window',
  'tactical-copy.core-primed-strike-window-open': 'Core primed · strike window open',
  'tactical-copy.cost-ap': 'Cost: {p0} AP',
  'tactical-copy.deduce-and-destroy-nests-to-weaken-the':
    'Deduce and destroy nests to weaken the queen first',
  'tactical-copy.disable-both-shield-pylons-first': 'Disable both shield pylons first',
  'tactical-copy.disable-the-seal-in-the-opposite-realm':
    'Disable the seal in the opposite realm first',
  'tactical-copy.egg-destroyed-hatching-prevented': 'Egg destroyed · hatching prevented',
  'tactical-copy.enemy-attack-hit': 'Enemy attack hit',
  'tactical-copy.flag-all-mines-around-the-target-first': 'Flag all mines around the target first',
  'tactical-copy.grounded-resist-the-pulse-and-reduce-enemy':
    'Grounded · resist the pulse and reduce enemy damage by 3',
  'tactical-copy.hatchling-intercepted-attack-cancelled':
    'Hatchling intercepted · attack cancelled',
  'tactical-copy.lure-locked-clear-the-gold-route': 'Lure locked · clear the gold route',
  'tactical-copy.lure-the-knight-into-an-anchor-to':
    'Lure the knight into an anchor to break its armor',
  'tactical-copy.magnetic-displacement-resisted': 'Magnetic displacement resisted',
  'tactical-copy.move-next-to-the-target-first': 'Move next to the target first',
  'tactical-copy.needs-ap-shorten-the-route-or-end':
    'Needs {p0} AP · shorten the route or end your turn',
  'tactical-copy.nest-destroyed-supply-stopped-queen-armor-and':
    'Nest destroyed · supply stopped, queen armor and regeneration reduced',
  'tactical-copy.one-twin-defeated-the-survivor-s-future':
    'One twin defeated · the survivor’s future attacks intensify',
  'tactical-copy.open-a-route-of-at-least-two':
    'Open a route of at least two cells from the knight to the anchor',
  'tactical-copy.realm-shifted-the-turn-continues': 'Realm shifted · the turn continues',
  'tactical-copy.reflection-active-shift-and-strike-the-other':
    'Reflection active · shift and strike the other twin',
  'tactical-copy.return-a-spell-with-an-hourglass-to':
    'Return a spell with an hourglass to break the barrier',
  'tactical-copy.strike-landed-damage': 'Strike landed · {p0} damage',
  'tactical-copy.web-cleared-lane-open': 'Web cleared · lane open',
  'tactical-template.ap-left': '{p0} AP left',
  'tactical-template.battle-reference': 'Battle reference',
  'tactical-template.prime-core-1-ap': 'Prime core · 1 AP',
  'tactical-template.replay-arrival': 'Replay arrival',
  'tactical-template.shift-realm-1-ap': 'Shift realm · 1 AP',
  'templates.learn-to-play': 'Learn to play',
  'title-copy.attack-1-against-a-boss-at-half': 'Attack +1 against a boss at half health or less.',
  'title-copy.attack-1-while-your-health-is-at': 'Attack +1 while your health is at half or less.',
  'title-copy.attack-2-against-the-brood-queen-while':
    'Attack +2 against the Brood Queen while a nest remains.',
  'title-copy.attack-2-while-the-magnetic-knight-is':
    'Attack +2 while the Magnetic Knight is exposed.',
  'title-copy.completing-your-profession-skill-in-battle-refunds':
    'Completing your profession skill in battle refunds 1 AP, up to 5; once per floor.',
  'title-copy.completing-your-profession-skill-restores-1-health':
    'Completing your profession skill restores 1 health, once per floor.',
  'title-copy.defense-1-in-the-brood-queen-battle': 'Defense +1 in the Brood Queen battle.',
  'title-copy.defense-1-while-braced': 'Defense +1 while braced.',
  'title-copy.defense-1-while-your-health-is-at':
    'Defense +1 while your health is at one third or less.',
  'title-copy.depart-with-1-extra-probe-up-to': 'Depart with 1 extra probe, up to 4.',
  'title-copy.depart-with-1-extra-scanner-up-to': 'Depart with 1 extra scanner, up to 4.',
  'title-copy.entering-floors-4-and-7-each-adds':
    'Entering floors 4 and 7 each adds 1 maximum health and restores 1 health.',
  'title-copy.every-third-boss-turn-starts-with-1':
    'Every third boss turn starts with +1 AP, up to 5.',
  'title-copy.gain-1-shield-when-entering-a-boss':
    'Gain 1 shield when entering a boss room, up to 2.',
  'title-copy.maximum-health-1-for-this-expedition': 'Maximum health +1 for this expedition.',
  'title-copy.recover-2-health-when-entering-a-boss': 'Recover 2 health when entering a boss room.',
  'title-copy.the-first-chest-each-floor-restores-1':
    'The first chest each floor restores 1 health.',
  'title-copy.the-first-turn-of-each-boss-battle':
    'The first turn of each boss battle starts with +1 AP, up to 5.',
  'title-copy.the-first-two-chests-of-the-expedition':
    'The first two chests of the expedition each grant 1 probe, up to 4.',
  'title-copy.the-third-chest-of-the-expedition-grants':
    'The third chest of the expedition grants 1 scanner, up to 4.',
  'title-copy.with-3-or-more-relics-reward-offers':
    'With 3 or more relics, reward offers have 1 extra choice, up to 5.',
  'title-copy.with-fewer-than-3-relics-reward-offers':
    'With fewer than 3 relics, reward offers have 1 extra choice, up to 5.',
  'title-template.choose-a-title': 'Choose a title',
  'title-template.earn-titles-through-achievements': 'Earn titles through achievements.',
  'title-template.expedition-title': 'Expedition title',
  'title-template.no-title': 'No title',
  'title-template.no-titles-earned-yet': 'No titles earned yet',
  'tutorial-lessons.a-probe-looks-ahead': 'A probe looks ahead',
  'tutorial-lessons.a-quiet-first-step': 'A quiet first step',
  'tutorial-lessons.alternate-between-local-clues-and-proven-mines':
    'Alternate between local clues and proven mines on the other board. Flags are still hypotheses until the visible clues justify them.',
  'tutorial-lessons.bring-the-discovery-across': 'Bring the discovery across',
  'tutorial-lessons.choose-when-to-descend': 'Choose when to descend',
  'tutorial-lessons.classic-first-field': 'Classic · first field',
  'tutorial-lessons.clear-the-blur': 'Clear the blur',
  'tutorial-lessons.cycle-to-quick-open-you-will-pass':
    'Cycle to Quick open. You will pass Safe note: that marks a guess about safety, not a guarantee. Quick open uses a number with matching flags to open its other neighbors.',
  'tutorial-lessons.expedition-leave-camp': 'Expedition · leave camp',
  'tutorial-lessons.explore-from-your-route': 'Explore from your route',
  'tutorial-lessons.finish-with-confidence': 'Finish with confidence',
  'tutorial-lessons.flag-the-glowing-covered-square-a-flag':
    'Flag the glowing covered square. A flag is your note, not a mine detector: place it because the number proves it.',
  'tutorial-lessons.keep-both-boards-in-view': 'Keep both boards in view',
  'tutorial-lessons.leave-a-reliable-mark': 'Leave a reliable mark',
  'tutorial-lessons.make-a-second-deduction': 'Make a second deduction',
  'tutorial-lessons.most-numbered-squares-are-obscured-select-sonar':
    'Most numbered squares are obscured. Select Sonar, then the glowing square: only its center opens (mines become gold flags); the echo counts every mine in the 3 × 3 area and makes its clues permanently readable.',
  'tutorial-lessons.move-to-the-glowing-open-square-your':
    'Move to the glowing open square. Your explorer walks along known safe ground. Ordinary floors have no turn timer or action-point cost.',
  'tutorial-lessons.one-button-four-actions': 'One button, four actions',
  'tutorial-lessons.open-a-safe-neighborhood': 'Open a safe neighborhood',
  'tutorial-lessons.open-the-glowing-square-empty-ground-opens':
    'Open the glowing square. Empty ground opens its connected blank area; numbers stop the expansion.',
  'tutorial-lessons.open-the-matching-glowing-square-on-b':
    'Open the matching glowing square on B. The link transfers a deduction, not the numbers: each board still counts only its own mines.',
  'tutorial-lessons.open-the-route': 'Open the route',
  'tutorial-lessons.press-the-action-button-once-to-select':
    'Press the action button once to select Flag. Mouse users can also right-click a square; touch users can hold it. Keyboard users can focus a square and press F.',
  'tutorial-lessons.quick-open-this-1-its-flagged-neighbor':
    'Quick open this 1. Its flagged neighbor accounts for the mine, so the covered square below can be opened safely.',
  'tutorial-lessons.reach-the-treasure': 'Reach the treasure',
  'tutorial-lessons.read-the-neighborhood': 'Read the neighborhood',
  'tutorial-lessons.reveal-this-frontier-square-your-explorer-first':
    'Reveal this frontier square. Your explorer first approaches it by a safe route, then digs. Distant covered cells need a reachable neighboring square.',
  'tutorial-lessons.select-the-matching-flag-on-a-once':
    'Select the matching flag on A once more. The coordinate highlight links the two sides. Clear all safe squares on both boards to win; a mine hit on either ends the pair.',
  'tutorial-lessons.select-the-probe-then-the-glowing-square':
    'Select the probe, then the glowing square. It surveys a chosen 3×3 area without moving you. A rejected or redundant target does not spend a charge.',
  'tutorial-lessons.select-the-scanner-then-any-glowing-square':
    'Select the scanner, then any glowing square on the last row. It identifies the row’s mines and safe ground. Both tools show their remaining charges in the dock.',
  'tutorial-lessons.select-the-stairs-deliberately-to-leave-the':
    'Select the stairs deliberately to leave the floor. Health carries between floors: a mine deals 5 damage, a shield absorbs up to 5. Boss floors use action points; their arrivals offer clues to their character.',
  'tutorial-lessons.select-this-1-to-inspect-its-eight':
    'Select this 1 to inspect its eight neighbors. Only the covered square to the right remains unknown, so that square must contain the one mine.',
  'tutorial-lessons.sonar-read-the-echoes': 'Sonar · read the echoes',
  'tutorial-lessons.start-with-3-pulses-four-successful-safe':
    'Start with 3 pulses. Four successful safe excavation actions earn another; opening a blank area counts once. Repeat clicks and flags earn nothing. Revisit scans freely.',
  'tutorial-lessons.survey-a-whole-row': 'Survey a whole row',
  'tutorial-lessons.test-the-other-side': 'Test the other side',
  'tutorial-lessons.the-revealed-1-diagonally-above-right-of':
    'The revealed 1 diagonally above-right of this square has only this covered neighbor. Flag it too. You can take as long as you need; speed comes after certainty.',
  'tutorial-lessons.the-two-boards-never-have-mines-at':
    'The two boards never have mines at the same coordinate. The mine you proved on A makes that coordinate safe on B. Cycle back to Reveal.',
  'tutorial-lessons.twin-two-sides-of-a-clue': 'Twin · two sides of a clue',
  'tutorial-lessons.use-explorer-s-light-it-surveys-the':
    'Use Explorer’s light. It surveys the nearby 3×3 area once per floor. Confirmed mines stay locked; confirmed safe squares still need to be opened. Your skill lives in the bottom dock.',
  'tutorial-lessons.use-quick-open-on-this-1-its':
    'Use Quick open on this 1. Its mine is flagged, so the remaining covered neighbors are safe. Winning means opening every safe square; flagging every mine is not required.',
  'tutorial-lessons.walk-to-the-glowing-chest-to-collect':
    'Walk to the glowing chest to collect it. Revealing a chest is not the same as picking it up. Relics you later acquire are kept in the expandable collection menu.',
  'tutorial-lessons.you-are-on-the-board': 'You are on the board',
  'tutorial-lessons.you-can-move-scout-collect-and-descend':
    'You can move, scout, collect and descend. In real expeditions, choose a relic after cleared floors, watch your health and return to camp when you need to.',
  'tutorial-lessons.you-read-clues-marked-mines-and-opened':
    'You read clues, marked mines and opened a whole neighborhood. In a real game a wrong flag can make quick opening dangerous. Pause and inspect the numbers whenever you are unsure.',
  'tutorial-lessons.your-profession-has-a-skill': 'Your profession has a skill',
  'tutorial-player.back-to-game': 'Back to game',
  'tutorial-player.chests': 'Chests',
  'tutorial-player.click-tap-arrows-enter': 'Click / tap · arrows + Enter',
  'tutorial-player.column': 'column',
  'tutorial-player.continue': 'Continue',
  'tutorial-player.covered': 'covered',
  'tutorial-player.exit-practice': 'Exit practice',
  'tutorial-player.flag': 'flag',
  'tutorial-player.good-continue-when-you-are-ready': 'Good. Continue when you are ready.',
  'tutorial-player.learn-by-doing': 'LEARN BY DOING',
  'tutorial-player.light': 'Light',
  'tutorial-player.practice-field': 'Practice field',
  'tutorial-player.probe': 'Probe',
  'tutorial-player.ready-for-the-field': 'Ready for the field',
  'tutorial-player.row': 'Row',
  'tutorial-player.scan': 'Scan',
  'tutorial-player.sonar': 'Sonar',
  'tutorial-player.start-again': 'Start again',
  'tutorial-player.try-here': 'Try here',
  'tutorial-player.try-the-highlighted-action-first-nothing-was':
    'Try the highlighted action first. Nothing was spent.',
  'variant-app.battle-reference': 'Battle reference',
  'variant-copy.1-loadout-point-starting-probes-1': '1 loadout point. Starting probes +1.',
  'variant-copy.1-loadout-point-starting-scans-1': '1 loadout point. Starting scans +1.',
  'variant-copy.1-probe-1-scan-1-shield': '1 probe · 1 scan · 1 shield',
  'variant-copy.1-probe-1-shield-each-floor-1':
    '1 probe · 1 shield · each floor: 1 shield → 5×5 scouting',
  'variant-copy.1-probe-2-scans': '1 probe · 2 scans',
  'variant-copy.1-probe-on-each-new-floor-up': '+1 probe on each new floor, up to 4.',
  'variant-copy.1-probe-scout-a-chest-each-floor':
    '1 probe · scout a chest each floor · up to 4 relic choices',
  'variant-copy.1-scan-on-each-new-floor-up': '+1 scan on each new floor, up to 4.',
  'variant-copy.2-loadout-points-starting-shields-1': '2 loadout points. Starting shields +1.',
  'variant-copy.2-probes-1-scan': '2 probes · 1 scan',
  'variant-copy.2-shields-each-floor-1-shield-1':
    '2 shields · each floor: 1 shield → 1 probe + 1 scan',
  'variant-copy.abyss': 'Abyss',
  'variant-copy.abyss-hourglass': 'Abyss hourglass',
  'variant-copy.achievement-exclusive-clear-50-floors-and-claim':
    'Achievement exclusive: clear 50 floors and claim Rift pioneer. Starts with 2 probes.',
  'variant-copy.achievement-exclusive-confirm-5-unique-mines-in':
    'Achievement exclusive. Confirm 5 unique mines in a floor to gain 1 probe and 1 scan, once per floor; each cap 4.',
  'variant-copy.achievement-exclusive-the-first-chest-collected-each':
    'Achievement exclusive. The first chest collected each floor grants 1 shield, cap 2.',
  'variant-copy.add-exit-compass-and-salvage-seal-to':
    'Add Exit compass and Salvage seal to future relic offers.',
  'variant-copy.advanced': 'Advanced',
  'variant-copy.aegis': 'Aegis',
  'variant-copy.alchemist': 'Alchemist',
  'variant-copy.an-incompatible-or-damaged-save-was-ignored':
    'An incompatible or damaged save was ignored. Valid camp history is kept when recoverable.',
  'variant-copy.archaeologist': 'Archaeologist',
  'variant-copy.arrows-home-end-move-focus-enter-space':
    'Arrows / Home / End: move focus. Enter / Space: reveal. F, right-click or touch-and-hold: flag. You can also choose Flag before tapping a cell.',
  'variant-copy.at-each-coordinate-at-most-one-board':
    'At each coordinate, at most one board has a mine. A mine you deduce on A guarantees safety on B, but two safe cells are also possible. Flags never prove safety. Clear every safe cell on both boards; hitting a mine on either ends the pair. The first reveal opens a safe neighborhood on both.',
  'variant-copy.banked-supplies': 'Banked supplies',
  'variant-copy.base-camp': 'Base camp',
  'variant-copy.base-settlement': 'Base settlement',
  'variant-copy.begin-expedition': 'Begin expedition',
  'variant-copy.camp-and-results-preserved-the-previous-dungeon':
    'Camp and results preserved. The previous dungeon run was retired after the map update.',
  'variant-copy.camp-facilities': 'Camp facilities',
  'variant-copy.chest-beacon': 'Chest beacon',
  'variant-copy.choose-a-relic': 'Choose a relic',
  'variant-copy.choose-one-relic-for-the-next-floor': 'Choose one relic for the next floor',
  'variant-copy.choose-the-first-opening-on-either-board':
    'Choose the first opening on either board.',
  'variant-copy.choose-your-difficulty-and-expedition-length-build':
    'Choose your difficulty and expedition length. Build a relic collection along the way. Bank all loot on extraction, half on defeat, and a completion bonus on victory. Unlock careers and a three-point equipment loadout with supplies. Growth opens choices; mines remain dangerous.',
  'variant-copy.classic': 'Classic',
  'variant-copy.click-revealed-floor-to-walk-there-along':
    'Click revealed floor to walk there along the shortest known safe route. Click a highlighted frontier cell to approach and reveal it. Visit treasure chests to collect them. Click the stairs to walk to the next floor entrance; reaching them opens the relic choice. All safe floor is connected; unreachable pockets become walls. Movement uses four directions, while clues count eight neighbors. Blue flags are guesses. Gold flags are confirmed mines and cannot be removed. Each floor chooses an interior entrance, with a small irregular opening and useful clues.',
  'variant-copy.collect-a-chest-to-scout-the-next':
    'Collect a chest to scout the next uncollected chest’s 3×3 area, once per floor. Does not collect it.',
  'variant-copy.collected': 'Collected',
  'variant-copy.completed-expeditions': 'Completed expeditions',
  'variant-copy.completing-a-profession-skill-scouts-your-landing':
    'Completing a profession skill scouts your landing row, once per floor. Placing a return anchor does not trigger it.',
  'variant-copy.confirm-4-distinct-mines-in-a-floor':
    'Confirm 4 distinct mines in a floor to scout the exit’s 3×3 area, once per floor. It does not open the exit or defeat its guardian.',
  'variant-copy.confirm-8-distinct-mines-in-a-floor':
    'Confirm 8 distinct mines in a floor to heal 2 HP, up to maximum health, once per floor.',
  'variant-copy.confirmed-mine-locked-flag': 'Confirmed mine · locked flag',
  'variant-copy.confirmed-safe': 'Confirmed safe',
  'variant-copy.continue-to-next-floor': 'Continue to next floor',
  'variant-copy.difficulty': 'Difficulty',
  'variant-copy.difficulty-bonus': 'Difficulty bonus',
  'variant-copy.difficulty-reward': 'Difficulty reward',
  'variant-copy.drag-a-tool-onto-the-board-or':
    'Drag a tool onto the board, or select one and click a target.',
  'variant-copy.end-this-expedition-and-bank-all-collected':
    'End this expedition and bank all collected loot?',
  'variant-copy.engineer': 'Engineer',
  'variant-copy.entrance': 'Entrance',
  'variant-copy.exit': 'Exit',
  'variant-copy.exit-compass': 'Exit compass',
  'variant-copy.expedition': 'Expedition',
  'variant-copy.expedition-complete': 'Expedition complete',
  'variant-copy.expedition-ended': 'Expedition ended',
  'variant-copy.expert': 'Expert',
  'variant-copy.explorer': 'Explorer',
  'variant-copy.explorer-2': 'Explorer',
  'variant-copy.extract-to-camp': 'Extract to camp',
  'variant-copy.fault-map': 'Fault map',
  'variant-copy.field-radio': 'Field radio',
  'variant-copy.find-a-safe-route-to-the-exit': 'Find a safe route to the exit.',
  'variant-copy.find-your-first-relic-after-floor-one': 'Find your first relic after floor one.',
  'variant-copy.fit-board': 'Fit board',
  'variant-copy.floor': 'Floor',
  'variant-copy.floor-cleared': 'Floor cleared',
  'variant-copy.future-treasures-give-9-supplies-instead-of':
    'Future treasures give 9 supplies instead of 6.',
  'variant-copy.gain-1-shield-up-to-2-absorbs':
    'Gain 1 shield, up to 2. Absorbs up to 5 damage; a mine hit leaves a locked red mine marker.',
  'variant-copy.game-mode': 'Game mode',
  'variant-copy.game-updated-your-expedition-returned-to-camp':
    'Game updated. Your expedition returned to camp with {p0} supplies. Camp progress is preserved.',
  'variant-copy.guard': 'Guard',
  'variant-copy.health': 'Health',
  'variant-copy.hunter-seal': 'Hunter seal',
  'variant-copy.inspect-a-3-3-area-gold-flags':
    'Inspect a 3×3 area: gold flags mark mines, green dots mark safe cells.',
  'variant-copy.inspect-a-whole-row-gold-flags-mark':
    'Inspect a whole row: gold flags mark mines, green dots mark safe cells.',
  'variant-copy.keep-75-of-collected-loot-on-defeat':
    'Keep 75% of collected loot on defeat instead of 50%.',
  'variant-copy.lantern': 'Lantern',
  'variant-copy.larger-cells': 'Larger cells',
  'variant-copy.last-bastion': 'Last bastion',
  'variant-copy.loadout-3-points': 'Loadout · 3 points',
  'variant-copy.matching-coordinate': 'Matching coordinate',
  'variant-copy.mines-total': 'mines total',
  'variant-copy.mission-exclusive-1-loadout-point-a-successful':
    'Mission exclusive · 1 loadout point. A successful profession skill restores 1 probe, cap 4; once per floor.',
  'variant-copy.mission-exclusive-clear-12-floors-and-claim':
    'Mission exclusive: clear 12 floors and claim Return route. Starts with 1 probe and 1 scan.',
  'variant-copy.moves': 'Moves',
  'variant-copy.original-rules': 'Original rules',
  'variant-copy.partner-cleared-flagged-mines-there-are-now':
    'Partner cleared: flagged mines there are now confirmed.',
  'variant-copy.probe-3-3-area': 'Probe 3×3 area',
  'variant-copy.probe-found-count-mines': 'Probe found {count} mines.',
  'variant-copy.probe-kit': 'Probe kit',
  'variant-copy.probes': 'Probes',
  'variant-copy.profession': 'Profession',
  'variant-copy.pulse-coil': 'Pulse coil',
  'variant-copy.reachable-frontier': 'Reachable frontier',
  'variant-copy.recent-results-this-mode': 'Recent results · this mode',
  'variant-copy.relaxed': 'Relaxed',
  'variant-copy.relic-archive': 'Relic archive',
  'variant-copy.relic-build': 'Relic build',
  'variant-copy.revive-at-3-hp-and-scout-your':
    'Revive at 3 HP and scout your surrounding 3×3, once per expedition. Second wind takes priority and preserves this charge.',
  'variant-copy.riftwalker': 'Riftwalker',
  'variant-copy.run-loot': 'Run loot',
  'variant-copy.safely-extracted': 'Safely extracted',
  'variant-copy.salvage-seal': 'Salvage seal',
  'variant-copy.scan-a-row': 'Scan a row',
  'variant-copy.scanner': 'Scanner',
  'variant-copy.scans': 'Scans',
  'variant-copy.scout-the-exit-s-3-3-area':
    'Scout the exit’s 3×3 area each floor, revealing safe cells and marking mines.',
  'variant-copy.scroll-or-swipe-to-explore-the-enlarged':
    'Scroll or swipe to explore the enlarged board.',
  'variant-copy.sentinel': 'Sentinel',
  'variant-copy.shields': 'Shields',
  'variant-copy.stairs-reachable-click-them-when-ready-to':
    'Stairs reachable · click them when ready to leave.',
  'variant-copy.standard': 'Standard',
  'variant-copy.supplies': 'Supplies',
  'variant-copy.survey-lens': 'Survey lens',
  'variant-copy.survey-token': 'Survey token',
  'variant-copy.surveyor': 'Surveyor',
  'variant-copy.survive-health-damage-with-2-hp-or':
    'Survive health damage with 2 HP or less to set shields to 2, once per expedition. Does not revive.',
  'variant-copy.this-run-reached-the-move-limit-extract':
    'This run reached the move limit. Extract or start a new pair.',
  'variant-copy.trail-heart': 'Trail heart',
  'variant-copy.treasure-pouch': 'Treasure pouch',
  'variant-copy.treasure-safe': 'Treasure · safe',
  'variant-copy.triggered-mine': 'Triggered mine',
  'variant-copy.twin-boards': 'Twin boards',
  'variant-copy.unlock-at-camp': 'Unlock at camp',
  'variant-copy.unlock-departure-equipment-choose-up-to-3':
    'Unlock departure equipment. Choose up to 3 points each run.',
  'variant-copy.unlocked': 'Unlocked',
  'variant-copy.used-this-expedition': 'Used this expedition',
  'variant-copy.used-this-floor': 'Used this floor',
  'variant-copy.used-this-turn': 'Used this turn',
  'variant-copy.view-results': 'View results',
  'variant-copy.wall-impassable': 'Wall · impassable',
  'variant-copy.waymarker': 'Waymarker',
  'variant-copy.workshop': 'Workshop',
  'variant-copy.your-story-starts-here': 'Your story starts here.',
  'variant-view.resonator-four-turn-core-windows': 'Resonator · four-turn core windows',
  'variant-view.return-anchor': 'Return anchor',
  'variant-view.rift-landing': 'Rift landing',
  'variant-view.suppressor-lowers-future-attacks-to-3': 'Suppressor · lowers future attacks to 3',
  'variant-view.two-way-rift': 'Two-way rift',
}
