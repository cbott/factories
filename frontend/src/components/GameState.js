// GameState.js
// This file defines the shared state for all Vue components of the game
import { reactive } from 'vue'
import { io } from "socket.io-client";

export const gamestate = reactive({
  socket: null,
  playerID: "null",
  state: {},
  //  Methods
  openSocket() {
    // Open a connection to the server
    this.socket = io("http://localhost:3000");
    this.socket.on('game-state', (state) => {
      this.state = state;
      this.marketplace = state.marketplace;
      this.hand = state.players[this.socket.id]?.hand || [];
      this.playerID = this.socket.id;
    });
  },
  fillMarketplace() {
    // Fill marketplace with cards
    this.socket.emit('fill-marketplace');
  },
  pickUpFromMarketplace(cardID) {
    // Add the specified card to this player's hand
    console.log("pickup", cardID);
    this.socket.emit('pickup-from-marketplace', cardID);
  }
})

