# factories

Online multiplayer board game

For a much better game than this, check out _Fantastic Factories_

![Factories Game Screenshot](docs/factories.png 'Screenshot of Factories Game')

## Running the game

The most common commands are contained in the project `justfile`. `just build` and `just run` should allow you to load the game at `localhost:8080`.

## Development

This project utilizes Vue.js for frontend rendering
https://vuejs.org/guide/quick-start

Run game server from backend/ with

> npm start [savefile.json]

Example:

> NODE_ENV=production PORT=3000 npm start saves/my_game.json

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

Potential improvements that are under consideration

- Keep track of player statistics throughout the game and present these (such as in a graph) at the end of the game
- Change dice to have dots rather than numbers
- When activating cards, the frontend should indicate which dice are valid to select (gray out invalid choices)
- Add a "help" button that pulls up the rulebook
- Add a server-side logging framework

## Rejected Ideas

These features are not planned for implementation

- Add an "Undo" button: certain actions provide strategic value (i.e. see next card in deck, trick opponent about strategy, etc.) which would be problematic to allow undo for. Implementing this in a way that is comprehensive and intuitive does not seem feasible.
- Work on "security" type features such as ensuring that players cannot request actions on behalf of others: the intent of this project is not to create a production-ready system, major overhauls to protect from malicious users are not in scope.
