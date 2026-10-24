# Stars Align — local playtest

Stars Align is a local party game for 2–8 players, with a solo test option. One player hosts as Bluezi; everyone joins the same room from their own browser. This build follows the crew through seven Lagos stops before they try to get back to London.

## Start on your computer

1. Install Node.js 18 or newer if you do not already have it.
2. Extract this ZIP and open a terminal inside the `stars-align` folder.
3. Run `npm install` once to install the pinned Babylon.js and build dependencies.
4. Run `npm start`. The prestart step builds the local engine bundle, then the server starts.
5. On the computer, open **http://localhost:4173**.
6. Create a room. Other players on the **same Wi-Fi** open `http://YOUR-COMPUTER-LAN-IP:4173` on their phones and enter the five-character code. The server listens on all local network interfaces. Allow the connection through your computer's firewall if prompted.

The host can click **Test solo** to play all seven challenges alone. For multiplayer, at least two connected players are needed. Use separate browser tabs or a private window to test two players on one computer. Music is enabled by default: the game tries to play it on opening, and browsers that block audible autoplay start it with the first tap or key press. The music button lets each player turn it off.

## Babylon.js engine slice

The story now opens with a synchronized flight descending into Lagos before the road scene begins. Playable scenes mount a locally bundled Babylon.js world with a fixed elevated camera, low-poly geometry, provisional billboard avatars, road traffic, pedestrians, venue crowds and authoritative movement. Tap/click the ground or use arrow/WASD keys during exploration. The server validates bounds, simple collision zones and discovery range. Active decisions use small thought bubbles with responses underneath; movement pauses while a response is open.

Each stop has three inspectable markers. A discovery gives that player 30 points and 2 Fame once per stable scene/discovery ID. The club power-cell discovery gives a bounded later Star Gate preparation benefit. Crowd/road audio remains synthesized. See `ENGINE_DECISION.md` and `MIGRATION_STATUS.md` for the selection rationale, current proof and remaining device gates.

## Game rules

Each answer or vote has a 60-second limit and resolves early when every connected player answers. The dance rhythm round lasts 12 seconds. At least half the crew must succeed in a challenge to pass the round: Mission rises by 8 on a pass and falls by 12 on a miss. Keep Mission above zero and get at least half the crew to press Launch to win together. Each player's own Fame increases when they succeed, and points rank players individually. Each player's screen displays their name and Fame. The route vote counts the most chosen route as successful (ties favour the first listed route). Bluezi hosts; for now characters identify players but have no unique abilities. The rival encounter is still a decision challenge. Room and score data stay in server memory and reset when it stops.

To stop the game, press Ctrl+C in the terminal.
