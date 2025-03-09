# factories

Web version of the board game Fantastic Factories

Development notes:
https://vuejs.org/guide/quick-start

frontend

> npm run dev

backend

> npm start

To Do list

- Move a lot of game logic into the gamestate class
- Create a button to switch between market phase and work phase
- Implement server-side logging
- Consistent style/formatting
  - add proper documentation for each function
  - single vs double quotes
  - apply a linter
- Implement contractor cards (delay for now, can do most of the game without it)
- Switch to work phase automatically once all players have picked up card (delay for now, enforce manually)
- Switch to market phase once every player clicks a complete button
- Add a button to refresh the marketplace for 1 metal or 1 energy
