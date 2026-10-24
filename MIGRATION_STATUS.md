# Engine migration status

## Layered audio — 24 October 2026

- Added one persistent Web Audio mixer around the existing song. Scene transitions change volume, muffling, short room reflections and stereo position without restarting the track.
- Recorded layers: general crowd conversation, short crowd cheers, applause, car horns and children playing. Credits and source licenses are available from Mix → Audio credits and public/audio-credits.html. The field recordings are general ambience, not Lagos field recordings.
- Street: distant music, conversation, occasional horns and quiet playground activity. Lounge: softer venue music and conversation. Club: clearer music, chatter and occasional cheers. Bridge: stronger procedural traffic rumble with horns. Gate/launch: restrained music and background activity. No playground sounds indoors.
- Music ducks during story captions and most decision rounds. Venue music responds approximately to the player's position relative to an authored speaker point. Horn panning and timing vary; they are not synchronized to individual rendered vehicles.
- Mix offers persistent independent music, ambience and effects sliders. Sound toggles all buses. First-interaction playback fallback and hidden-tab suspension are handled independently from mission state.
- Only one project-supplied music track is present: this is a venue-style mix, not a multi-track DJ playlist. Room reflections and road rumble are procedural; the vocal ambience uses recordings.
- Behavioural audio tests cover one-time graph creation, scene-appropriate samples, cleanup between scenes, mute, saved settings and hidden-tab silence. Browser playback status and asset warnings were checked. Final subjective balancing on phone speakers and headphones remains a listening task.

## Story and world presentation — 24 October 2026

- Replaced mannequin-like bodies with more human proportions, faceted faces, eyes, noses, ears, hands, hairstyles, clothing details and articulated elbows/knees. These remain procedural prototype models.
- Added an authoritative 18-second story phase before each exploration/challenge sequence. Three authored dialogue beats accompany an approach animation and camera framing. Captions follow the shared deadline, including reconnects. No generated speech or lip-sync is claimed.
- Kept the decision timer separate: story, then 10-second exploration, then the existing challenge duration. Answers are rejected during story playback.
- Added a world-first layout: compact chapter heading, small Mission/Fame indicators, collapsed crew list, subtitle-only story scenes and corner decision panels. Mobile decision panels have bounded height and internal scrolling.
- Added street markings, paving, building windows, signage and palms; lounge furniture now includes a bar, stools, hanging lights, framed artwork and a rug.
- Kept the renderer mounted across interface changes within a scene, avoiding a blank world when captions become questions or players submit answers.
- Reference inspected: the live environment at https://office.tavus.io/ via Jesse Rowe's linked X post. The video itself could not play in the available browser. The reference informs room scale and restrained UI, not a claim of equivalent asset quality or features.

Run the updated server to load the new story phases. The separate review instance is at http://localhost:4175; an already-running instance at 4173 must be restarted to load server changes. Existing in-memory rooms do not survive a restart.

Remaining: final authored character assets, richer environment composition, physical object interactions, connected walk-through rooms, mobile device measurements and a complete camera/occlusion pass. This remains an elevated-camera adventure rather than the reference's first-person office.

Validation: build and syntax checks passed. The automated two-player and solo runs each completed all seven stages successfully at GAME_SPEED=.2. The two-player test also verified a story phase before every challenge, positive synchronized story durations and rejection of answers during stories. Discovery deduplication and separate personal scores remained covered. Desktop rendering and compact question layout were visually inspected. Actual phone testing remains outstanding.

## Fully 3D direction — first implementation

The earlier billboard-avatar plan below is superseded for character rendering. Player and crowd bodies now use solid low-poly geometry with jointed arm/leg pivots, directional facing, walk cycles and dance animation. Labels remain billboards for readability. These are procedural prototype figures, not final authored character models.

The elevated camera now smoothly follows the local player within bounded scene limits. Movement interpolation is frame-rate independent, and pointer interaction reads the current mission phase rather than the phase captured when mounting the scene.

Validation: local bundle build and syntax checks passed; the opening street was visually checked in the browser with the new 3D characters. Full multiplayer, mobile performance and later-scene animation checks remain pending. The existing panels still cover a substantial part of the world and need a dedicated layout pass. Enterable connected rooms, a free camera and expanded physical mission actions are not implemented by this change.

## Implemented

- Babylon.js world renderer isolated in `src/world-engine.js`.
- Reproducible local bundle generated by `npm run build`.
- Existing Node/SSE service remains authoritative.
- Fixed-camera low-poly environment variants for district, lounge, club and gate.
- Synchronized opening flight with an aircraft descent, runway and airport storytelling.
- Scenario-specific road traffic, pedestrians, vendors and populated interiors.
- Distinct ambient roles and animation loops for walking, working, talking and dancing.
- Scene-authored market stalls, lounge furniture, club lighting, bridge traffic, boats, gate equipment and launch activity.
- All eight player identities have distinct provisional in-world avatars.
- Click/touch ground picking, keyboard movement, facing state and remote interpolation.
- Cosmetic NPC patrol that cannot affect mission results.
- Server-side walk bounds, collision zones and interaction range.
- Stable discovery IDs and per-player deduplication.
- Complementary private clues with an in-game sharing action.
- One discovery payoff at spaceship preparation.
- Locked round eligibility and specific ending reasons.
- Compact thought-bubble prompts with selected responses shown underneath.

## Still required before the engine proof is accepted

- Test two separate physical phones, then three and eight clients.
- Record load time, ordinary-play frame rate, memory behavior and input latency.
- Replace provisional generated avatars with source sprite atlases and metadata.
- Add explicit synchronized doorway readiness/loading rather than timed automatic transitions.
- Add authoritative carry/use/drop item ownership and disconnected-carrier recovery.
- Add request IDs for network-level idempotency, beyond current state guards.
- Define and test host disconnection behavior.
- Test backgrounded tabs and reconnect restoration on real mobile browsers.
- Add a non-rapid-tapping dance alternative.

The old CSS avatar rules remain as a harmless fallback during migration, but the playable world now uses the Babylon canvas.
