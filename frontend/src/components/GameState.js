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
  // Select the inputs or outputs required to activate a card in the compound
  activateCard: 'activateCard',
})

export const gamestate = reactive({
  socket: null,
  playerID: 'uninitialized',
  state: {},
  hand: new Map(), // Initialize hand as an empty Map
  activeAction: Actions.none, // Current step of a multi-step action
  activeActionTarget: null, // This will track the dice or card being used in the multi-step action

  //  Methods
  openSocket(username) {
    // Open a connection to the server
    // TODO: update to handle different server IPs
    this.socket = io('http://localhost:3000')
    this.socket.emit('join-game', username)
    this.playerID = username

    this.socket.on('game-state', (state) => {
      this.state = state
      console.log('New State:', state)
      if (state.players[this.playerID]) {
        // Convert hand to Map object for ease of use later on. We cannot directly send and receive Maps
        this.hand = new Map(Object.entries(state.players[this.playerID].hand))
      }
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
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

  // Request the server to switch between Market Phase and Work Phase
  requestChangePhase() {
    console.log('Requesting phase change')
    this.socket.emit('change-phase')
  },

  // Add the specified card to this player's hand
  pickUpFromMarketplace(cardID) {
    console.log('pickup', cardID)
    this.socket.emit('pickup-from-marketplace', cardID)
  },

  // Roll all available dice
  rollDice() {
    console.log('Rolling Dice')
    this.socket.emit('roll-dice')
  },

  /**
   * Replace all blueprint cards in the marketplace with new ones
   *
   * @param {string} resource - 'metal' or 'energy' to determine which resource to spend
   */
  refreshMarketplaceBlueprints(resource) {
    console.log('Refreshing Blueprint cards in Marketplace')
    this.socket.emit('refresh-marketplace-blueprints', resource)
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
    this.socket.emit('add-to-compound-with-discard', cardIDToMove, cardIDToDiscard)
  },

  // Activate a card from the player's compound
  // diceSelection: Array<int> with indices into the player's dice array
  // cardSelection: Array<int> list of cardIDs, which should be in the player's hand
  // energySelection: int - number of energy to use for activation (applies to Golem only)
  activateCard(cardIDToActivate, diceSelection, cardSelection, energySelection) {
    console.log(
      'Activate card',
      cardIDToActivate,
      'with dice selection',
      diceSelection,
      'card selection',
      cardSelection,
      'energy selection',
      energySelection,
    )
    this.socket.emit('activate-card', cardIDToActivate, diceSelection, cardSelection, energySelection)
  },
})
