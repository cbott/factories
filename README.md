# factories

Online multiplayer board game

For a much better game than this, check out _Fantastic Factories_

## Development

This project utilizes Vue.js for frontend rendering
https://vuejs.org/guide/quick-start

Run game server from backend/ with

> npm start

Serve UI from frontend/ with

> npm run dev

## Remaining Work

Scoped

- (feature) Implement contractor cards
- (feature) Implement replicator and black market blueprints
- (dev) Resolve remaining TODO items in code
- (dev) Implement server-side logging with consistent formatting
- (dev) Save game state to persistent storage to allow for resuming a game after a crash or a server reset
- (feature) Implement end and win condition (12 goods or 10 cards in compound)
- (feature) Add messages from server to individual clients such as error responses
- (feature) Add a sound effect for rolling dice
- (bugfix) Card tooltips get cut off if they are too close to the edge of the screen
- (feature) Indicate headquarters requirements/rewards on UI
- (feature) Add color to blueprint card header based on card type to help distinguish them

Unscoped (possible future work)

- Add an "Undo" button.
- Work on "security" type features such as ensuring that players request actions on behalf of others
