// GameState.js
// This file defines the shared state for all Vue components of the game
import { reactive } from 'vue'
import { io } from 'socket.io-client'

// Track multi-step actions by the player
export const Actions = Object.freeze({
  // No active action
  none: '',
  // Select a card to discard after selecting a card to play
  selectMatchingTool: 'selectMatchingTool',
  // Select where to move a die to after selecting the die to move
  selectDieTarget: 'selectDieTarget',
})

export const gamestate = reactive({
  socket: null,
  playerID: 'null',
  state: {},
  activeAction: Actions.none, // Current step of a multi-step action
  activeActionTarget: null, // This will track the dice or card being used in the multi-step action
  hand: new Map(), // Initialize hand as an empty Map

  //  Methods
  openSocket() {
    // Open a connection to the server
    this.socket = io('http://localhost:3000')
    this.socket.on('game-state', (state) => {
      this.state = state
      if (state.players[this.socket.id]) {
        // Convert hand to Map object for ease of use later on. We cannot directly send and receive Maps
        this.hand = new Map(Object.entries(state.players[this.socket.id].hand))
      }
      this.playerID = this.socket.id
    })
  },

  // Get the list of cards in the compound for the specified player
  getPlayerCompound(playerID) {
    if (this.state.players == null) {
      return []
    }
    return this.state.players[playerID]?.compound || []
  },

  // Fill marketplace with cards
  fillMarketplace() {
    this.socket.emit('fill-marketplace')
  },

  // Add the specified card to this player's hand
  pickUpFromMarketplace(cardID) {
    console.log('pickup', cardID)
    this.socket.emit('pickup-from-marketplace', cardID)
  },

  // Move a card from the player's hand into their compound
  addToCompound(cardID) {
    console.log('play card', cardID)
    this.socket.emit('add-to-compound', cardID)
  },

  // Roll all available dice
  rollDice() {
    console.log('Rolling Dice')
    this.socket.emit('roll-dice')
  },

  // Move one die from the player's dice pool to the specified floor of the headquarters
  // floor should be one of 'research', 'generate', or 'mine'
  placeDieInHeadquarters(dieIndex, floor) {
    console.log('Placing die', dieIndex, 'in', floor)
    this.socket.emit('place-die-in-headquarters', dieIndex, floor)
  },

  // Move a card from the player's hand into their compound
  addToCompoundWithDiscard(cardIDToMove, cardIDToDiscard) {
    console.log('play card', cardIDToMove, 'by discarding', cardIDToDiscard)
    this.socket.emit('add-to-compound-wtih-discard', cardIDToMove, cardIDToDiscard)
  },
})
