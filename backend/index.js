const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/**
 * Class representing a blueprint card
 *
 * There are 74 of these in the deck
 * Attributes
 * - Name
 * - Build Cost
 * -- Tool
 * -- Metal
 * -- Energy
 * - Card Type (production | utility | training | monument | special)
 * - Prestige Value
 * - Recipe
 * - # of Card Copies
 */
class BlueprintCard {
  constructor(id, name, tool, copies) {
      this.id = id; // a unique identifier for us to keep track of it in code
      this.name = name;
      this.tool = tool;
      this.copies = copies;
  }
}

const card_setup = [
  {name: "Aluminum Factory", tool: "shovel", copies: 2},
  {name: "Obelisk", tool: "hammer", copies: 5},
]

function buildDeck() {
  deck = []
  id = 0

  for(let i=0; i<card_setup.length; i++){
    card_type = card_setup[i]
    for(let copy=0; copy<card_type.copies; copy++){
      deck.push(new BlueprintCard(id, card_type.name, card_type.tool, card_type.copies))
      id++
    }
  }

  return deck
}
//////////////////////////////////

app.use(express.static(path.join(__dirname, '../frontend/dist')));

let gameState = {
  deck: buildDeck(),
  players: {}
};

console.log(gameState)

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  gameState.players[socket.id] = { hand: [] };

  socket.on('draw-card', () => {
    if (gameState.deck.length) {
      const card = gameState.deck.pop();
      gameState.players[socket.id].hand.push(card);
      io.emit('game-state', gameState);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete gameState.players[socket.id];
    io.emit('game-state', gameState);
  });

  socket.emit('game-state', gameState);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
