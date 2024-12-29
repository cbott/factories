// node modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// custom modules
const cards = require('./modules/cards.js');
const player = require('./modules/player.js');

// Set up server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//////////////////////////////////
// TODO: should probably move the gamestate to a separate Game file/object, keep all socketio
// calls in this file but those will just wrap core game functions from the other file
let gameState = {
  deck: cards.buildDeck(),
  marketplace: [],
  // `players` object maps session IDs to instances of the Player class
  players: {},
};

// Move a card from the player's hand to the player's compound, and recompute prestige
function moveToCompound(playerID, cardID) {
  console.log('Moving card', cardID, 'to compound', playerID);
  gameState.players[playerID].compound.push(gameState.players[playerID].hand[cardID]);
  // Card is moved to compound, now remove it from hand
  delete gameState.players[playerID].hand[cardID];
  gameState.players[playerID].prestige = cards.calculatePrestige(gameState.players[playerID].compound);
};

// Remove a card from the player's hand
function removeFromHand(playerID, cardID) {
  delete gameState.players[playerID].hand[cardID];
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  gameState.players[socket.id] = new player.Player();

  // Move a card from the deck into the player's hand
  socket.on('draw-card', () => {
    if (gameState.deck.length) {
      console.log("Drawing card")
      const card = gameState.deck.pop();
      gameState.players[socket.id].hand[card.id] = card;
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

  // Move a card from the marketplace to a player's hand
  socket.on('pickup-from-marketplace', (cardID) => {
    console.log('Picking up from marketplace', cardID);
    const card = cards.removeCardByID(gameState.marketplace, cardID)[0];
    gameState.players[socket.id].hand[cardID] = card;
    console.log('Player hand is now', gameState.players[socket.id].hand);
    io.emit('game-state', gameState);
  });

  // Move a card from the player's hand to their compound
  socket.on('add-to-compound', (cardID) => {
    moveToCompound(socket.id, cardID);
    io.emit('game-state', gameState);
  });

  // Move a card from the player's hand to their compound, discarding an approprate tool card
  socket.on('add-to-compound-wtih-discard', (cardIDToMove, cardIDToDiscard) => {
    console.log('Playing card', cardIDToMove, 'by discarding card', cardIDToDiscard);
    // TODO: this will need a lot more validation
    // Client can send anything they want here so need to check cards are actually in the hand
    if(cardIDToMove != cardIDToDiscard && gameState.players[socket.id].hand[cardIDToMove].tool === gameState.players[socket.id].hand[cardIDToDiscard].tool) {
      moveToCompound(socket.id, cardIDToMove);
      // TODO: implement discard pile
      removeFromHand(socket.id, cardIDToDiscard);
      io.emit('game-state', gameState);
      console.log('Moved Card');
    }
    // TODO: handle else case, return error to client
  });

  // Roll all of the player's available dice
  socket.on('roll-dice', () => {
    const numDice = gameState.players[socket.id].numDice;
    for(let i=0; i<numDice; i++){
      // Pick a random number from 1-6
      const value = Math.ceil(Math.random() * 6);
      gameState.players[socket.id].dice.push(value)
    }
    gameState.players[socket.id].numDice = 0;
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
