# Stars Align — Game Engine Migration Brief

Date: 23 October 2026  
Companion document: [Project Upgrade Brief](PROJECT_UPGRADE_BRIEF.md)  
Existing local build: http://localhost:4173/  
Status: Proposed implementation specification; no engine selected or migration performed.

## 1. Objective

Turn the existing layered multiplayer browser game into a compact playable world. Players should move through a Lagos-inspired district, enter rooms, interact with characters and objects, and complete cooperative tasks before escaping to London in their spaceship.

Preserve the existing identity, room-code access, story sequence, separate Mission and personal scoring, discoveries and explicit ending rules. Introduce an engine to support meaningful physical interaction, not simply to add walking between question panels.

## 2. Baseline and evidence

The prior inspection covered the landing page, a solo lobby and the opening traffic scene. It observed the Stars Align branding, eight-character roster, room creation and joining, solo testing, a 60% opening Mission display, personal Fame and points, discovery buttons and a timed decision challenge. The owner reports that solo and two-player tests passed, including discoveries.

The existing game uses layered scene art. Characters are currently described in the lobby as scoreboard identities. The rival encounter is a decision challenge and crowd audio is synthesized. Those are valid baseline choices.

The source, complete session, network implementation and ending were not inspected for this brief. Locate the actual project serving port 4173 before implementation. Do not assume the current framework, transport or storage system.

## 3. Product and delivery decisions

### Recommended defaults

- Preserve browser link access and room-code joining as the first delivery target.
- Use a fixed elevated three-quarter camera.
- Combine low-poly 3D environments with animated 2.5D sprite characters.
- Build a small district and separate interior scenes rather than a continuous city.
- Keep the crew in one shared active scene during the first release.
- Support 2–8 players, with solo mode retained for testing.
- Keep readable interface panels for dialogue, voting, timers and results.
- Use touch-to-move and a clear interaction action on phones; add click-to-move and keyboard support on desktop.

These are proposed implementation defaults. A native app, free camera, fully 3D characters or independently exploring separate rooms would be a separate scope change.

### Out of scope initially

Driving, combat, jumping, a large open world, complex civilian simulation, persistent economies, public matchmaking and character-specific progression trees. Recorded crowd audio is optional; synthesized audio can remain.

## 4. Engine selection gate

Do not select an engine purely for visual quality or familiarity. Evaluate its current capabilities against the actual target devices and delivery requirements using official documentation and a runnable export. This document makes no engine-specific compatibility claims.

| Criterion               | Required evidence                                                                |
| ----------------------- | -------------------------------------------------------------------------------- |
| Browser delivery        | A playable exported build on the intended phone/browser combinations             |
| Mobile performance      | Measured loading, rendering and memory behaviour in a representative scene       |
| 2.5D presentation       | Sprites, transparency, depth, shadows and fixed-camera perspective work together |
| Multiplayer integration | A demonstrated path to authoritative room state and synchronized movement        |
| Team workflow           | The developer can edit scenes, debug networking and reproduce builds             |
| Asset workflow          | Environment models, sprite atlases and metadata import reliably                  |
| Deployment              | Hosting, transport and any server requirements are understood and costed         |
| Licensing               | Current terms fit the project and intended distribution                          |

Compare a full editor-based engine with a lighter browser-focused rendering/game framework if appropriate. Reusing the existing web shell may be more valuable than replacing every component.

Record the selected engine, version, reasons, export targets, constraints and rejected alternatives in a short decision note. No major asset production should depend on an untested export path.

## 5. What changes in play

| Existing pattern                 | Engine implementation                                   | Gameplay purpose                                      |
| -------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| Illustrated scene                | Walkable street or room with collision                  | Gives objects and destinations spatial relationships  |
| Character identity on scoreboard | Animated player avatar with facing and name label       | Makes each participant visible and identifiable       |
| Discovery button                 | Inspectable world object or NPC                         | Encourages exploration and reveals useful information |
| Scene change                     | Shared doorway or mission transition                    | Connects the story locations coherently               |
| Rival choice panel               | Approach, conversation and decision encounter           | Lets preparation and player roles affect the choice   |
| Chase decisions                  | Short authored obstacle route with cooperative actions  | Provides an action-based change of pace               |
| Launch button                    | Preparation tasks followed by the existing confirmation | Makes the finale use the crew's earlier discoveries   |

Movement alone is not a successful migration. At least one interaction must require or meaningfully benefit from another player's contribution.

## 6. First vertical slice

Build **street → lounge → spaceship area** before completing the whole district. Start with two players on separate phones, then extend the same slice to eight clients.

Required content:

1. Existing-style create/join lobby and persistent player identity for reconnects.
2. Two distinct player avatars with idle, walk and interact animations.
3. One short walkable street with collision and a stationary or patrolling NPC.
4. One discovery that gives personal points once and a bounded shared preparation benefit once per room.
5. One synchronized doorway into a lounge.
6. One complementary-information encounter with in-game clue sharing.
7. One spaceship-preparation task involving two useful player contributions.
8. Shared result resolution, personal scoreboard and original Launch conditions.

Use provisional assets where necessary. The prototype must prove the movement, cooperation, networking and phone experience before expanding the art library.

## 7. Player actions and encounter design

### Core actions

Start with move, interact and carry/use one item. Define legal interaction range, item ownership, inventory capacity and drop behaviour. Show useful feedback when an action is unavailable.

Examples include carrying a power cell, inspecting a route clue, opening access for a teammate and using a discovered pass during a conversation. These are proposed encounter patterns, not additional requirements to implement all at once.

### Decision encounters

Preserve decision panels where they work. Present choices with understandable tradeoffs, not repeated obvious-answer quizzes. Distinguish selecting a collective plan from determining whether that plan succeeds. Document voting ties, missing submissions and timeouts.

### Cooperation

Give players complementary information or actions. Combine roles for two players; distribute useful responsibilities for larger groups. Provide an in-game way to share clues. Do not require external voice chat or eight sequential speeches.

Avoid tasks that can be completed entirely by the fastest player while the others watch. Conversely, a disconnected player must not permanently trap the crew in an unresolved interaction.

### Chase

After the slice succeeds, prototype a short authored route with obstacles, a shortcut and a helping action. Define what individual completion means and apply the existing crew threshold. Finished players should have a useful support action or a short, explicit wait.

Do not make a chase mandatory for the first engine proof. It adds movement, collision and latency requirements beyond a simple room interaction.

### Spaceship preparation

Possible tasks include power restoration, route plotting and boarding access. Scale roles to crew size. Discoveries may simplify tasks but must not guarantee the ending.

Define the preparation result and any Mission change before implementation. If it adds a scored round, include that round in balance calculations. Resolve preparation exactly once, then begin the separate Launch confirmation stage.

## 8. Architecture

Keep three responsibilities separate:

| System       | Owns                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| World        | Movement, collision, interactable objects, doors, NPCs and spatial presentation        |
| Mission      | Stage state, eligibility, deadlines, decisions, outcomes, scores and launch conditions |
| Presentation | Camera, animations, effects, sound, labels and panels                                  |

The authoritative mission state decides outcomes. Animation completion, local frame rate and a client's displayed countdown must not decide the winner.

### Suggested mission lifecycle

`Lobby → Scene loading → Exploration/preparation → Active challenge → Resolution → Next scene or final preparation → Launch → Results`

Not every encounter needs a separate exploration interval. Define each transition and its authority. World movement can pause during blocking panels without changing the mission deadline.

### Minimum shared state

- Room ID, host identity, connected players and selected characters.
- Current scene, stage, phase and round ID.
- Eligible player set fixed at round start.
- Authoritative deadlines, submissions and resolved result.
- Mission value, personal Fame/points and discovery records.
- Item ownership, availability and persistent object state.
- Launch eligibility and confirmations.
- Player positions, facing and movement/animation state.

Use stable IDs for players, rounds, objects, discoveries and interactions. Do not rely on display names for ownership or reward deduplication.

## 9. Multiplayer authority and recovery

Use one authoritative room simulation/service for mission and gameplay-critical state. The Bluezi host role is a product role; it should not automatically imply that Bluezi's phone is the authority. Inspect the existing backend before deciding whether to reuse or replace it.

- Validate movement bounds, interaction range, item transfers and scoring events.
- Keep local movement responsive; use reconciliation if local prediction is implemented.
- Smooth remote movement between authoritative updates.
- Resolve simultaneous collection attempts atomically so one item has one owner.
- Make repeated submissions and retries harmless through stable event/request IDs.
- Restore the current scene, score, inventory and challenge phase on reconnect.
- Define host reassignment or explicit room termination on host loss.
- Lock round eligibility so disconnections do not lower the threshold mid-round.
- Define recovery for a disconnected carrier: return the item to a safe point or transfer it through an explicit rule after a bounded grace period.
- Use shared deadlines and publish the policy for inputs received at or after expiry.
- Keep ambient cosmetic NPC behaviour local where it cannot affect outcomes; synchronize NPC state when collision or interaction affects play.

Server authority is not optional merely because the game is cooperative: inconsistent item ownership and duplicated results can break an otherwise friendly session.

## 10. Scene transitions

For the first release, doors lead to crew-synchronized transitions. Approaching a door can show the destination and readiness state, but one client cannot silently advance the mission.

Preload the next scene, show a loading status and use a bounded readiness policy. Specify what happens if a client fails to load: defer the start within a limit, remove that client from the next round's eligibility before it is locked, or end the transition with a clear error. Do not leave the room waiting indefinitely.

Once a round starts, a late/reconnecting client receives the current phase and remaining time rather than restarting it. Scene entry must not replay score awards or duplicate discoveries.

## 11. Art and animation pipeline

- Use low-poly exterior and interior geometry with authored collision and interaction markers.
- Use a fixed elevated camera and consistent sprite perspective.
- Anchor sprites at their feet; render readable ground shadows and name labels.
- Start with four appropriate facing directions and expand only when needed.
- Provide idle, walk, interact, dance, celebrate and failure-reaction states as the cast expands.
- Use atlases with metadata for frame rectangles, timing, direction and anchors.
- Preserve editable art sources separately from optimized runtime assets.
- Handle foreground occlusion with cutaways, fading geometry or an equivalent tested approach.
- Remove duplicated painted characters where new independent sprites replace them.
- Keep NPC patrols simple and authored before adding complex navigation behaviour.

The full cast remains Bluezi, Boyd, South Boy, Pluto, Government, Dino, On D and Edna. The two-player slice may use only two validated character assets before extending to the roster.

## 12. Rules and balance preservation

- Shared crew pass: +8 Mission. Shared failure: −12 Mission.
- Required successes: `ceil(eligiblePlayers / 2)`.
- Personal Fame and points remain separate from Mission.
- Decision rounds provide at least 60 seconds of available decision time; early completion can occur once all required inputs are locked.
- Dance rounds last approximately 12 seconds.
- Victory requires Mission strictly above zero and at least half the eligible crew confirming Launch before its deadline.
- Failure of either condition produces defeat with an explicit reason.
- Life of the Party is determined by individual points independently of crew victory.
- Optional discoveries must not override the Mission requirement.

Audit the observed 60% opening display before tuning. Confirm its raw value, caps, display mapping and number of scored encounters. With a raw start of 60 and exactly seven uncapped +8/−12 rounds, two passes and five failures would leave 16 points. This is a conditional calculation, not a verified full-game rule.

New preparation rounds, discovery benefits or encounter penalties require an updated balance model. Do not change the starting score or add hidden penalties as an incidental part of the engine migration.

## 13. Mobile, audio and accessibility

- Keep room-code access simple and minimize steps between opening a link and joining.
- Test on actual target phones early, including the intended iOS and Android browsers.
- Keep controls usable at 360 CSS pixels wide, with at least 44 × 44 CSS-pixel touch targets and safe-area spacing.
- Separate movement input from UI input; tapping a decision must not move the character underneath it.
- Keep the character and active target visible around panels.
- Include accessible labels, readable contrast, visual timer/results feedback, mute and reduced motion.
- Offer an equivalent interaction alternative where rapid tapping would exclude players.
- Attempt audio playback only where permitted; provide an obvious first-interaction fallback.
- Do not require recorded crowds or spatial audio for the prototype.

Proposed rendering target: approximately 30 FPS or better during representative play on an agreed mid-range phone. Record device, browser, build and scene. Measure loading time, memory stability and input responsiveness as well; agree final budgets after the first export instead of inventing untested guarantees.

## 14. Migration sequence

1. **Capture the baseline:** locate source, reproduce launch instructions, document rules and preserve a runnable version. Confirm the reported solo and two-player results.
2. **Select the runtime:** prove phone export, sprite rendering and basic networking. Record the engine decision.
3. **Build the slice:** implement the street, lounge, spaceship task and two-player session with provisional assets.
4. **Validate the gameplay:** observe whether players communicate, understand tradeoffs and contribute through world actions.
5. **Extend multiplayer:** test three and eight players, latency, reconnects, item contention and loading failures.
6. **Expand the game:** add the remaining cast, club, rivals, checkpoint/chase and complete story progression.
7. **Polish and release:** optimize assets, complete mobile/accessibility checks, verify endings and update deployment instructions.

Avoid maintaining two divergent rule sets. Reuse the authoritative mission implementation where practical, or port it against explicit behavioural tests. Preserve the old build until the new one passes the agreed acceptance checks.

## 15. Acceptance checks

### Engine proof

- [ ] The chosen runtime exports and runs on the agreed phones and browsers.
- [ ] Two players join the same room on separate devices.
- [ ] Movement, facing, collision and remote animation are coherent.
- [ ] One independent NPC and one inspectable discovery work.
- [ ] A shared doorway changes scenes without duplicating state.
- [ ] One encounter benefits from complementary information or actions.
- [ ] One discovery has a later preparation payoff.
- [ ] Item ownership stays consistent during simultaneous interaction and reconnects.
- [ ] The spaceship task resolves once, followed by the original Launch rules.
- [ ] Performance and loading measurements are recorded on representative hardware.

### Full migration

- [ ] All eight characters and the full existing narrative progression are represented.
- [ ] Solo testing and 2-, 3- and 8-player sessions complete successfully.
- [ ] Shared Mission, personal points, discovery rewards and result explanations match the documented rules.
- [ ] Half thresholds are correct, including odd crew sizes.
- [ ] Positive Mission plus sufficient timely confirmations wins; zero/negative Mission, insufficient confirmations or expired deadlines lose.
- [ ] Life of the Party is awarded independently, with an explicit tie policy.
- [ ] Duplicate inputs, backgrounded tabs, delayed packets and disconnects do not duplicate rewards or stall indefinitely.
- [ ] Host loss, carried-item recovery and scene-loading failures have tested outcomes.
- [ ] Mobile UI, mute, audio fallback, reduced motion and alternative inputs work.
- [ ] The new world adds meaningful cooperation rather than only travel time.

## 16. Required handoff

Deliver the engine decision note, editable project, reproducible builds, server/hosting configuration, environment and sprite sources, optimized exports, asset-rights record, mission/state documentation, measured test results and known limitations. Document how to run the previous baseline and the engine build separately.

The first milestone is a small cooperative session that works on real phones. Expand the city only after that session proves the engine improves the game.
