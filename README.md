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

- (feature) Implement end and win condition (12 goods or 10 cards in compound)
- (dev) Implement server-side logging with consistent formatting
- (feature) Add messages from server to individual clients such as error responses
- (feature) Add a sound effect for rolling dice
- (bugfix) Card tooltips get cut off if they are too close to the edge of the screen

Unscoped (possible future work)

- Add an "Undo" button.
- Work on "security" type features such as ensuring that players cannot request actions on behalf of others
