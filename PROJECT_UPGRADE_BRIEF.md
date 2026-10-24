# Stars Align — 2.5D City and Character Upgrade Brief

Date: 23 October 2026  
Current build: http://localhost:4173/  
Original concept: **LAGOS OUTSIDE: Alien in the City**  
Current visible title: **Stars Align · Lagos after dark**

## 1. Purpose

Evolve the existing multiplayer browser game into a small, explorable Lagos-inspired experience with animated 2.5D character sprites, low-poly city environments and connected interior rooms. Preserve the working multiplayer mission, decisions, discoveries, personal scoring and escape ending while upgrading how players inhabit the scenes.

This is an implementation handoff, not a claim that the upgrade has already been built. Keep the current Stars Align branding unless the project owner requests a rename. Carry the alien-celebrity identity through the character art and spaceship finale.

The scope also includes a game-logic review and proposed gameplay improvements in sections 13–16. Those proposals distinguish preserved rules from mechanics that need prototyping and balance validation. Updating this document does not mean those mechanics are already implemented or tested.

## 2. Evidence and current baseline

### Observed in the running build

The landing page, a newly created solo lobby and the opening playable scene were inspected on 23 October 2026. No full-session or multiplayer regression test was performed for this document.

- The landing page introduces Bluezi arriving in Lagos and trying to return to London through traffic, a party, a rival crew and a final gate.
- Players can enter a name, create a room as Bluezi or join using a room code.
- The lobby offers a copyable join link, supports a displayed capacity of eight, and provides a solo test option.
- The character roster is Bluezi, Boyd, South Boy, Pluto, Government, Dino, On D and Edna.
- The lobby explicitly describes characters as scoreboard identities. Character abilities and different routes are described as future work.
- The first scene is “Traffic outside the airport,” labelled stage 1/7.
- The opening Mission display is 60%; the test player's Fame and points start at zero.
- Visible rules state crew pass +8 and crew miss −12, with Fame and points tracked separately from Mission.
- The scene has “Check the car,” “Talk to the hawker” and “Look at the crowd” discoveries.
- A short preparation countdown leads to a timed answer challenge about buying something from the hawker.
- The interface includes a Music on/off control, a shared Mission display and live crew scores. The music label alone does not prove audio playback.
- The narrow preview shows discovery controls occupying substantial vertical space. Recheck the layout on actual phones before choosing final dimensions.

### Reported by the project owner

- Solo and two-player tests passed, including the new discoveries.
- The current experience uses layered scene art rather than an independently simulated city.
- People within scene artwork do not yet walk independently.
- The rival encounter is a decision challenge.
- Crowd sounds are synthesized rather than recorded shouting.

These are valid baseline characteristics, not automatic defects. Recorded video, recorded crowds, driving and a large open world are not required for this upgrade.

### Not yet verified

The complete seven-stage flow, final launch behaviour, three-to-eight-player reliability, reconnect behaviour, audio playback and real-device performance still need implementation-level inspection. The current workspace contained no discoverable project source files during this review; do not infer an engine, networking framework or source-file structure from this brief.

## 3. Target experience

Players join the existing room flow, select a character and then see that character represented in the world. They move around a compact city district, approach people and discoveries, enter venues and take part in the shared mission. Important encounters retain clear challenge panels and measurable outcomes.

Recommended first implementation:

- A fixed, elevated three-quarter camera.
- Actual low-poly 3D environments with transparent animated sprite characters placed in them.
- One compact exterior district and two enterable interiors.
- Touch-to-move on mobile, click-to-move on desktop, and keyboard movement as an additional desktop option.
- Existing HTML interface elements for readable instructions, voting, scores and countdowns.

This rendering approach is a proposed default, not an observed property of the current build. Validate it against the actual source and target phones before committing. If live 3D proves unsuitable, prerendered low-poly backgrounds with walkable regions and depth masks are a fallback; document that choice explicitly because they do not provide the same camera freedom or geometry.

## 4. Scope and environment plan

### First playable upgrade

Build one exterior block containing an arrival area, a short street, venue entrances, a rival meeting point and a gated route toward the spaceship. Build two separate interiors: a social lounge for meeting the Vibe Girls and a club for the party challenge.

The block can compress the fictional journey. It does not need to reproduce real Lagos geography or imply that London is reachable by walking.

| Existing story beat   | Upgraded setting                           | Gameplay to preserve                                  |
| --------------------- | ------------------------------------------ | ----------------------------------------------------- |
| Arrival and traffic   | Airport-edge street, car, hawker and crowd | Opening decisions and discoveries                     |
| Build the crew        | Existing lobby before world entry          | Room code, roster and character selection             |
| Meet the Vibe Girls   | Social lounge interior                     | Social decisions and crew outcome                     |
| Party and Fame        | Club interior                              | Short dance/tapping challenge and individual rewards  |
| Rival encounter       | Street corner or venue courtyard           | Decision challenge with explicit pass/fail            |
| Chase and checkpoints | Short gated route through the district     | Fictional obstacles and mission consequences          |
| Back to London        | Spaceship boarding area                    | Positive Mission plus sufficient launch confirmations |

Do not equate this story mapping with the exact current code's stage list. Inspect and map the seven existing stages before changing transitions.

### Environment art direction

- Use stylized buildings, textured pavement, signage, street stalls, warm lighting and selective neon accents.
- Preserve the current navy, purple and gold visual identity where it supports readability.
- Create Lagos-specific details through coherent art and dialogue; avoid generic skyscrapers with a Lagos label added afterward.
- Use simple collision boundaries and clear walkable space around interaction points.
- Add door markers, destination names and clear locked/unlocked feedback.
- Use cutaway walls or fading foreground geometry so buildings never conceal the player during an interaction.
- Keep the camera fixed for the first release; free rotation would require more sprite directions and additional occlusion work.

## 5. Character sprite specification

Create consistent 2.5D full-body sprites for the existing eight-character roster. Start with Bluezi as the reference character, validate scale and animation in the environment, then expand to the remaining cast.

### Required presentation

- Transparent backgrounds, a consistent foot anchor and coherent body proportions.
- Distinct silhouettes, outfits and readable character colours at phone size.
- Shading and perspective that match the elevated city camera.
- A ground/contact shadow beneath each character.
- Name labels, with an unmistakable local-player indicator.
- Four diagonal facing directions appropriate to the camera; add more only if testing proves necessary.
- Avoid mirrored text or asymmetric costume details when reusing frames.

### Animation set

| State     | Purpose                                      |
| --------- | -------------------------------------------- |
| Idle      | Standing, waiting and listening              |
| Walk      | Local and remote player movement             |
| Interact  | Talking, inspecting and confirming an action |
| Dance     | Party participation                          |
| Celebrate | Successful challenge or crew victory         |
| React     | Failed challenge or crew defeat              |

Frame counts and playback speeds should be chosen after the Bluezi prototype, rather than imposed before performance testing. Provide an atlas and machine-readable metadata identifying animation, direction, frame rectangle, duration and foot anchor. Source assets must be retained separately from optimized runtime exports.

Use independent NPC sprites for the Vibe Girls, rival members, hawker and selected crowd members. Idle loops and short authored patrols are sufficient initially. NPC animation is presentation; it must not silently change challenge outcomes.

Where a background already contains painted people, remove or replace those people in the upgraded scene so animated characters do not appear duplicated.

## 6. Movement, rooms and interactions

- Players move only inside walkable areas and cannot cross buildings, furniture or locked doors.
- Touch-to-move must distinguish walking from tapping an interaction, score panel or answer button.
- Approaching or selecting a person, object or door exposes a clearly labelled interaction.
- Movement pauses while a blocking challenge panel is active; tapping an answer must never also move the character.
- Discoveries become small world markers near their relevant objects, replacing oversized scene controls.
- Each discovery remains readable in a panel and follows the existing personal-point rules.
- Track discovery collection per player and discovery ID; reconnecting or repeatedly tapping must not award it again.

For the first release, use **crew-synchronized scene transitions**. Players may explore within the current scene, but the next mission destination is entered through one shared transition after the current stage resolves. Do not introduce separate mission routes or split crews as part of the visual upgrade.

Show the destination and transition state to everyone, preload the next scene and handle slower clients with a bounded loading state. A client that finishes loading late receives the current authoritative state rather than restarting the round. Do not let one device independently advance the mission by crossing a door.

## 7. Rules to preserve

- Support 2–8 players in a shared room; preserve solo mode for testing.
- Bluezi hosts and other players join by room code.
- Everyone sees the same mission, current challenge and crew progress.
- Keep shared Mission separate from personal Fame and points.
- A crew pass adds 8; a crew failure subtracts 12.
- At least half the participating players must succeed: `required = ceil(eligiblePlayers / 2)`.
- Decision rounds offer at least 60 seconds and display a countdown. Preserve existing early completion behaviour if implemented; do not shorten the available window silently.
- Dance rounds last approximately 12 seconds.
- Each challenge defines individual success, crew success, timeout behaviour, score effects and result explanation.
- Victory requires Mission strictly above zero and launch confirmations from at least half the eligible crew before the launch deadline.
- Failure to meet either requirement produces crew defeat with a specific reason.
- Highest individual points earns Life of the Party, independently of crew victory.
- Optional discoveries award individual points without overriding Mission.
- Music attempts playback where permitted, with a first-interaction fallback and accessible mute control.

### Balance and rule audit before implementation

The observed opening Mission is **60%**, not zero. Preserve that baseline pending an explicit balance decision. Inspect whether the underlying score is capped, whether percentages reflect raw points, how many encounters are scored and whether other adjustments exist.

For an uncapped score using only the specified deltas, `finalMission = startingMission + 8 * passes - 12 * failures`. Do not use this formula to claim actual win probabilities until the implementation is inspected.

Record the current definitions of Fame versus points, tie handling, eligible participants, reconnects and launch duration. Where absent, proposed defaults are: lock eligibility at round start, treat an unsubmitted attempt as unsuccessful at timeout, restore a reconnecting player's identity, and share the title on a points tie. These are proposed additions, not claims about the existing rules.

## 8. Multiplayer implementation requirements

Inspect and reuse the existing networking and state architecture before introducing a renderer or replacing components. Keep mission logic independent from visual animation.

- Maintain one authoritative room state for stage, challenge, deadlines, eligibility, Mission, personal scores, discoveries and launch confirmations.
- Synchronize player scene, position, facing and animation separately from scoring events.
- Validate movement boundaries and interaction eligibility; clients cannot award their own points.
- Interpolate remote movement so other players do not visibly jump between position updates.
- Apply each round result once and make repeated interaction/launch requests harmless.
- Use a shared deadline; the countdown displayed on a phone is a view of that deadline.
- Define and test host disconnection, backgrounded tabs and reconnect behaviour.
- Restore scores, collected discoveries, current stage and player identity on reconnect.
- Do not let a disconnect reduce the success threshold mid-round.

## 9. Mobile interface, accessibility and audio

- Keep the world visible with a compact top bar for Mission, personal score and time.
- Put challenge instructions and actions in a readable bottom panel that does not require scrolling past decorative controls.
- Provide a collapsible crew scoreboard and clear room-code access.
- Use touch targets of at least 44 × 44 CSS pixels, readable contrast and labels alongside important icons.
- Support a 360 CSS-pixel-wide portrait viewport without horizontal scrolling; also test landscape and larger phones.
- Ensure on-screen controls respect device safe areas.
- Avoid covering the active character or interaction target with fixed panels.
- Offer reduced motion and a dance interaction alternative if rapid tapping is inaccessible.
- Keep synthesized crowd audio unless a separate sound upgrade is requested. Licensed recordings may be added later.
- Do not use audio as the only indicator of timers, results or mission events.

Proposed performance target: sustain approximately 30 FPS or better during ordinary play on an agreed representative mid-range phone. Record the actual device and browser used. Test the club and eight-player scenes, not just an empty street. Use texture atlases, modest geometry, limited dynamic lights and scene-specific loading; set final asset budgets after measuring the first scene.

## 10. Delivery sequence

### Phase 0 — Establish the regression baseline

Locate the source serving port 4173. Record the existing run instructions, state flow, stage definitions, assets and scoring. Reproduce the reported solo and two-player checks. Capture baseline screenshots and confirm the finale before modifying the visual layer.

### Phase 1 — Prove the visual direction

Implement Bluezi's idle/walk sprites in a small low-poly street with movement, a contact shadow, one NPC, one discovery and one door. Validate camera angle, occlusion, phone controls and performance. Keep the current challenge system functional.

### Phase 2 — Connect the spaces

Add the lounge and club interiors, synchronized doors, loading feedback and remote player movement. Retain shared stage progression and existing decision challenges.

### Phase 3 — Complete the cast and mission

Expand to the eight player characters, Vibe Girls, rival group and selected ambient NPCs. Add the remaining animations, checkpoint area and spaceship location. Connect every existing stage and discovery to its upgraded location.

### Phase 4 — Verify and polish

Test 1, 2, 3 and 8 players, including odd-number thresholds. Check real phones, audio fallback, repeated inputs, reconnects and all ending conditions. Record observed results and unresolved limitations rather than marking a feature complete from appearance alone.

## 11. Acceptance checklist

- [ ] Existing room creation, joining, host role and character selection still work.
- [ ] All eight selectable characters have visible in-world representations.
- [ ] Local and remote characters move, face correctly and animate coherently.
- [ ] One compact low-poly district and two interiors are playable.
- [ ] Doors change scenes consistently for the crew without duplicating mission events.
- [ ] Characters respect collision and remain readable behind scenery.
- [ ] Existing story progression, decisions and short dance challenge remain playable end to end.
- [ ] Discoveries are attached to world objects and award personal points once per eligible collection.
- [ ] Mission and personal scoring stay separate and retain the specified +8/−12 changes.
- [ ] Thresholds are correct for 2, 3 and 8 participants: 1, 2 and 4 successes respectively.
- [ ] Positive Mission plus enough timely launch confirmations produces victory.
- [ ] Zero or negative Mission produces defeat even when enough players confirm.
- [ ] Insufficient or late launch confirmations produce defeat even with positive Mission.
- [ ] Life of the Party is shown independently, including when the crew loses.
- [ ] Timers and scores agree across clients; duplicate input does not duplicate rewards.
- [ ] Reconnect and host-disconnect behaviour is explicit and tested.
- [ ] Phone layouts remain usable at 360 CSS pixels wide without horizontal overflow.
- [ ] Music fallback, mute, reduced motion and non-audio feedback work.
- [ ] Performance is measured on the agreed phone and recorded with the test results.

## 12. Required handoff outputs

Deliver the updated source, launch instructions, optimized environment and sprite assets, editable asset sources where available, asset metadata, a short architecture note, a completed test checklist and a list of known limitations. Record ownership or usage rights for imported artwork and audio.

Keep a runnable baseline or reversible checkpoint of the existing game. Complete the Bluezi/street/interior prototype before producing the entire asset library. Prototype the priority gameplay changes in section 15 before expanding the district. Permanent character abilities, independent branching routes, combat, driving and a large open world belong in a separate scope decision. Temporary support actions and authored encounter consequences below are smaller proposed mechanics, not a commitment to those larger systems.

## 13. Game-logic critique and proposed improvements

The central design risk is that a shared score can conceal a set of parallel solo quizzes. The next version should give players reasons to communicate, make tradeoffs and notice the consequences of earlier actions. Better art and walking between rooms will not solve that issue on their own.

This critique is based on the supplied rules and the inspected opening scene, not a full playthrough. Confirm whether later stages already address each concern before replacing working content.

### 13.1 Replace obvious answers with meaningful tradeoffs

The inspected opening challenge offers sachet water, a traffic cone or a spare tyre. The sensible answer is obvious. Humour is welcome, but repeated questions of this kind provide little agency.

Proposed replacement pattern: choose between useful outcomes with understandable costs. In traffic, refreshments could provide a later support benefit, a shortcut could bypass an obstacle, and waiting could preserve a resource. These are design examples; do not introduce three new resource meters just to support one question.

Describe likely consequences before commitment. Avoid an undisclosed correct answer disguised as a choice. A collective vote chooses an action; an encounter-specific resolution rule determines whether that action succeeds. Define ties and timeouts explicitly, and keep collective decisions separate from individually scored attempts.

### 13.2 Introduce selective information-sharing encounters

Give different players complementary clues during at least one encounter. For example, one sees a route restriction, another sees a deadline and another knows which tool is available. The crew combines information to choose a viable plan.

Combine clue roles for two players; repeat or distribute useful responsibilities for larger crews. Avoid requiring eight sequential speeches. Provide an in-game way to reveal or share a clue so success does not depend on an external voice call. Clues must remain accessible throughout the decision window.

Use this mechanic selectively. Other encounters should offer simultaneous action or quick decisions to vary the pace.

### 13.3 Make contributions above the minimum matter

The current half-success threshold allows one player to carry two, or four to carry eight. Once the threshold is reached, further successes may have no shared value.

Proposed degrees of success:

| Outcome                        | Mission change | Additional effect                                               |
| ------------------------------ | -------------- | --------------------------------------------------------------- |
| Fewer than half succeed        | −12            | Explain the failure and any authored consequence                |
| At least half succeed          | +8             | Standard crew success                                           |
| Every eligible player succeeds | +8             | Small shared preparation benefit, if enabled for this encounter |

The perfect-round benefit must not add an extra Mission award or make ordinary success feel like failure. Prototype one nonessential benefit, such as a tool that simplifies a later task. Keep it bounded, prevent repeat awards and avoid rewards that encourage blaming a single player. Evaluate this mechanic separately at two and eight players because perfect rounds have different likelihoods.

### 13.4 Make Fame a choice without rewarding sabotage

Separate score displays do not create strategic tension if the same action always maximizes both scores. Occasionally let players choose between taking a difficult spotlight role for more Fame and supporting another player's success.

Both options should contribute constructively to the shared mission. Do not award Fame for deliberately causing crew failure. Communicate reward differences before selection and ensure support is worthwhile. Keep the highest scorer's leadership ceremonial in this iteration; personal rank must not grant unilateral control over crew decisions.

### 13.5 Give discoveries later payoffs

Extend selected discoveries beyond free points:

- Story discoveries reveal character or setting details.
- Information discoveries reveal a useful later clue.
- Preparation discoveries provide a small shared benefit.

Preserve existing personal-point rewards and once-per-player collection rules. Shared benefits need a separate once-per-room award rule so eight players finding the same object do not create eight unintended copies. Clearly indicate whether a discovery benefits the finder, the crew or both.

Example: a backstage pass found near the club unlocks an additional option at a later encounter. Required information must have an accessible fallback; do not make a tiny optional marker the sole route to victory.

### 13.6 Vary the rhythm of play

Use a flexible sequence of exploration, discussion, action, consequence and movement. Not every stage needs every step. Preserve the available decision time, but allow early resolution when all required submissions are locked in. Resolve dance rounds using their own short timing rules.

Walking should reveal discoveries, characters or meaningful destinations. Keep travel short when it only connects challenge panels. Never begin a timed challenge while some clients are still in an unbounded loading state.

### 13.7 Give recurring characters memory

The rival crew should react to earlier behaviour, using a small, visible relationship state such as impressed, irritated or willing to bargain. Show which event changed that state and how it affects a later option. The rival encounter can remain a decision challenge.

Give the Vibe Girls distinct goals and useful knowledge. Their interaction should influence the night through a clue, option or preparation benefit. Avoid adding a large dialogue tree before proving one meaningful callback.

### 13.8 Make the spaceship a gameplay climax

Prototype a short preparation encounter before the existing Launch confirmation. Possible tasks include restoring power, plotting the route and clearing the boarding ramp. Scale responsibilities to crew size; do not require three different people in a two-player session.

Earlier discoveries may simplify a task but must not automatically guarantee victory. Define individual task success, the shared result, the timer and any Mission change before implementation. If preparation becomes an additional scored round, include it in the balance model and apply the normal result only once.

After preparation resolves, freeze its result and apply the original ending exactly: Mission above zero, sufficient eligible players confirming Launch, and confirmation before the deadline. The preparation timer and final Launch deadline must be visibly distinct.

### 13.9 Make failure specific and recoverable

Keep the −12 result but, where useful, attach an authored consequence: rivals arrive first, an optional advantage disappears, or a later choice changes. Do not stack hidden penalties or create an unwinnable sequence without telling the crew.

If victory becomes mathematically impossible, explicitly choose a recovery opportunity, an early ending or continued play for Fame. Any recovery mechanic changes the balance model and must be documented. Avoid suggesting that escape remains possible when the rules make it impossible.

### 13.10 Explain the ending through player actions

The result screen should show crew outcome and reason, final Mission, individual scores and Life of the Party. Add a short recap of actual consequential events, for example a route clue used or a preparation item collected. Generate this recap from recorded game events rather than invented story claims.

## 14. Mission balance audit

The visible 60% starting value needs investigation before any difficulty claim. If it means 60 raw points, and there are exactly seven scored challenges with no cap or additional adjustments, the outcome would be:

| Passes | Failures | Final Mission |
| ------ | -------- | ------------- |
| 0      | 7        | −24           |
| 1      | 6        | −4            |
| 2      | 5        | 16            |
| 3      | 4        | 36            |

Under those assumptions, failing five of seven rounds still leaves Mission positive. This is a conditional illustration, not a verified description of the entire game. A seven-stage label does not prove there are seven scored rounds.

Before tuning:

1. Confirm the raw starting value, display mapping, caps and all score-changing events.
2. Count scored encounters separately from narrative stages, including any proposed preparation round.
3. Choose the intended failure tolerance and approximate session duration.
4. Evaluate plausible pass/fail sequences, including early failures and late recoveries. Caps can make order matter.
5. Playtest separately with two, three and eight players; include participation and communication friction.
6. Change the starting score only as an explicit recorded balance revision. Preserve +8/−12 and the strict positive-score ending unless separately revised.

Explain the Mission meter in plain language as the crew's overall escape readiness. It is not a literal probability of victory. Do not rename the underlying score or imply ship-only progress without checking the rest of the story.

## 15. Gameplay implementation priorities

These priorities extend the visual phases in section 10. They should not delay regression checks or require the full city asset library.

### Priority 1 — Prove meaningful cooperation

- Rewrite one obvious-answer encounter as a documented tradeoff.
- Prototype one encounter with complementary information and an in-game sharing action.
- Connect one discovery to a later spaceship-preparation task.
- Complete the Mission balance audit before adding another scored round.

Test these using the existing presentation or the small Bluezi street prototype. Establish that players understand their options and notice one another's contributions before scaling production.

### Priority 2 — Add consequences and replay value

- Add one constructive spotlight-versus-support choice.
- Add one visible rival relationship callback.
- Add a small set of bounded discovery benefits and event-based ending recaps.
- Trial the perfect-round preparation bonus; retain it only if it improves cooperation without excessive pressure.

### Priority 3 — Expand proven content

Extend successful patterns across the remaining scenes and cast. Add variations in clues or encounter circumstances with clear resolution rules. Keep the story sequence recognisable and avoid random outcomes that invalidate sensible decisions without warning.

For each revised encounter, record: objective, eligible players, information available to each player, available actions, input-locking rules, tie/timeout resolution, individual success, crew success, Mission delta, personal rewards, discovery effects, narrative consequences and reconnect behaviour.

## 16. Additional gameplay acceptance checks

Apply these checks to adopted proposals; they do not imply every optional mechanic must ship in the first visual upgrade.

- [ ] At least one revised choice offers multiple useful options with consequences explained before commitment.
- [ ] At least one encounter requires complementary player contributions and works with two as well as eight players.
- [ ] Shared-information encounters provide an in-game sharing mechanism and do not require external voice chat.
- [ ] Collective-vote resolution, ties and timeouts are documented separately from individual success aggregation.
- [ ] Any perfect-round bonus is bounded, awarded once and preserves the +8 Mission result.
- [ ] Spotlight and support actions both help the crew; no reward encourages deliberate sabotage.
- [ ] At least one discovery changes a later available option or preparation task, with a clear player-facing explanation.
- [ ] Personal discovery rewards and shared discovery benefits use separate deduplication rules.
- [ ] Essential clues remain available through an accessible route when optional discoveries are missed.
- [ ] Any rival relationship change has a visible cause and a testable later effect.
- [ ] Spaceship preparation scales to crew size, resolves once and does not replace the original Launch conditions.
- [ ] The chosen starting Mission and total scored rounds have a documented balance rationale.
- [ ] An impossible-to-win state is handled explicitly rather than hidden behind optimistic messages.
- [ ] The final recap references actual recorded actions and keeps crew victory separate from the Fame title.
- [ ] Playtest notes record whether players understood tradeoffs, communicated, experienced idle time and perceived their contributions as useful.
