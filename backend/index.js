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
  {name: "Beacon", tool: "shovel", copies: 4},
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
  marketplace: [],
  players: {}
};

console.log(gameState)

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  gameState.players[socket.id] = { hand: [] };

  socket.on('draw-card', () => {
    if (gameState.deck.length) {
      console.log("Drawing card")
      const card = gameState.deck.pop();
      gameState.players[socket.id].hand.push(card);
      io.emit('game-state', gameState);
    }
  });

  // Update the marketplace to have 4 cards
  socket.on('fill-marketplace', () => {
    console.log("Filling marketplace")
    while (gameState.deck.length > 0 && gameState.marketplace.length < 4) {
      const card = gameState.deck.pop();
      gameState.marketplace.push(card);
      io.emit('game-state', gameState);
    }
  });


  socket.on('pickup-from-marketplace', (cardID) => {
    console.log("Drawing card", cardID);
    for(let i=0; i<gameState.marketplace.length; i++){
      if (gameState.marketplace[i].id = cardID) {
        gameState.players[socket.id].hand.push(...gameState.marketplace.splice(i, 1));
        break;
      }
    }
    io.emit('game-state', gameState);
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
