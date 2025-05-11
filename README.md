# factories

Online multiplayer board game

For a much better game than this, check out _Fantastic Factories_

## Development

This project utilizes Vue.js for frontend rendering
https://vuejs.org/guide/quick-start

Run game server from backend/ with

> npm start [savefile.json]

Serve UI from frontend/ with

> npm run dev

Build `dist` folder from frontend/ with

> npm run build

| Environment Variable | Configuration                                  | Default   |
| -------------------- | ---------------------------------------------- | --------- |
| IP                   | The IP address of the server (dev only)        | localhost |
| PORT                 | Port for backend server                        | 3000      |
| NODE_ENV             | Set to 'production' to serve prebuilt frontend | undefined |

## Remaining Work

Scoped

- (dev) Implement server-side logging with consistent formatting
- (feature) Add messages from server to individual clients such as error responses
- (feature) Add a sound effect for rolling dice
- (feature) Add messages to players when they receive resources from Contractor cards
- (bugfix) Card tooltips get cut off if they are too close to the edge of the screen
- (bugfix) Improve unclear wording of instructions in the modal dialogue for ending your turn

Unscoped (possible future work)

- Add an "Undo" button
- Work on "security" type features such as ensuring that players cannot request actions on behalf of others
- Keep track of player statistics throughout the game and present these (such as in a graph) at the end of the game
- Add a "help" button that pulls up the rulebook
- Change dice to have dots rather than numbers
- When activating cards, the frontend should indicate which dice are valid to select (gray out invalid choices)

Fixes from Alpha testing

- The discard pile is now correctly shuffled back into the deck when the deck becomes empty
- The "Final Round" popup message is no longer incorrectly displayed every round
- The Robot blueprint card now correctly uses up 1 metal when activated
- Previously, if a card or die was selected, and then that same card or die was consumed by activating a card, it would get the game into an invalid state. If the selected card was removed it would crash the frontend, if the selected die was removed it would prevent further actions in the player's hand (until a different die gets clicked) and let "undefined" dice get placed in the Headquarters. This situation is now handled gracefully and invalid dice are blocked from being placed.
- Added an indicator of whose turn it is during the Market phase
- Fixed a bug where players were able to refresh cards in the Marketplace when it was not their turn
- You can now hover over cards in the Marketplace even when it is not your turn, to allow you to prepare or strategize
- The Headquarters now uses a different arrow symbol that should display better
