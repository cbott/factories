# factories

Online multiplayer board game

For a much better game than this, check out _Fantastic Factories_

![Factories Game Screenshot](docs/factories.png 'Screenshot of Factories Game')

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

- (bugfix) Card tooltips get cut off if they are too close to the edge of the screen

Unscoped (possible future work)

- Add an "Undo" button
- Work on "security" type features such as ensuring that players cannot request actions on behalf of others
- Keep track of player statistics throughout the game and present these (such as in a graph) at the end of the game
- Add a "help" button that pulls up the rulebook
- Change dice to have dots rather than numbers
- When activating cards, the frontend should indicate which dice are valid to select (gray out invalid choices)
- Add a server-side logging framework
