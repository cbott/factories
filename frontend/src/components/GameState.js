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

  // Get this list of cards in the compound for the specified player
  getPlayerCompound(playerID) {
    if (this.state.players == null) {
      return [];
    }
    return this.state.players[playerID]?.compound || [];
  },

  // Fill marketplace with cards
  fillMarketplace() {
    this.socket.emit('fill-marketplace');
  },

  // Add the specified card to this player's hand
  pickUpFromMarketplace(cardID) {
    console.log('pickup', cardID);
    this.socket.emit('pickup-from-marketplace', cardID);
  },

  // Move a card from the player's hand into their compound
  addToCompound(cardID) {
    console.log('play card', cardID);
    this.socket.emit('add-to-compound', cardID);
  }
})

