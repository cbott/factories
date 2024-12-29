// GameState.js
// This file defines the shared state for all Vue components of the game
import { reactive } from 'vue'
import { io } from "socket.io-client";

export const gamestate = reactive({
  socket: null,
  playerID: "null",
  state: {},
  activeAction: "", // This will track what actions are allowed by the player right now
  activeCardID: null, // This will track what card the player is currently trying to play
  hand: new Map(), // Initialize hand as an empty Map

  //  Methods
  openSocket() {
    // Open a connection to the server
    this.socket = io("http://localhost:3000");
    this.socket.on('game-state', (state) => {
      this.state = state;
      if (state.players[this.socket.id]) {
        // Convert hand to Map object for ease of use later on. We cannot directly send and receive Maps
        this.hand = new Map(Object.entries(state.players[this.socket.id].hand));
      }
      this.playerID = this.socket.id;
    });
  },

  // Get the list of cards in the compound for the specified player
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
  },

  // Roll all available dice
  rollDice() {
    console.log('Rolling Dice');
    this.socket.emit('roll-dice');
  },

  // Move a card from the player's hand into their compound
  addToCompoundWithDiscard(cardIDToMove, cardIDToDiscard) {
    console.log('play card', cardIDToMove, 'by discarding', cardIDToDiscard);
    this.socket.emit('add-to-compound-wtih-discard', cardIDToMove, cardIDToDiscard);
  }
})

