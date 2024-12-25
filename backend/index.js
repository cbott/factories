// node modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// custom modules
const cards = require('./modules/cards.js');

// Set up server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//////////////////////////////////
let gameState = {
  deck: cards.buildDeck(),
  marketplace: [],
  // TODO: maybe create a player class to store cards, username, etc
  players: {},
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  gameState.players[socket.id] = { hand: [], compound: [] };

  // Move a card from the deck into the player's hand
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

  // Move a card from the marketplace to a player's hand
  socket.on('pickup-from-marketplace', (cardID) => {
    console.log('Drawing card', cardID);
    gameState.players[socket.id].hand.push(...cards.removeCardByID(gameState.marketplace, cardID));
    io.emit('game-state', gameState);
  });

  // Move a card from the player's hand to their compound
  socket.on('add-to-compound', (cardID) => {
    console.log('Playing card', cardID);
    gameState.players[socket.id].compound.push(...cards.removeCardByID(gameState.players[socket.id].hand, cardID));
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
