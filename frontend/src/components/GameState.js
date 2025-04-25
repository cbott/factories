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
  playerID: 'uninitialized',
  initialized: false,
  state: {
    marketplace: {
      blueprints: [],
      contractors: {},
    },
  },
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
      this.initialized = true
    })

    this.socket.on('disconnect', () => {
      this.initialized = false
      alert('Disconnected from server')
    })
  },

  // Tell the server we are leaving the game :(
  quit() {
    console.log('Quitting the game')
    this.socket.emit('quit')
  },

  // Get the list of cards in the compound for the specified player
  getPlayerCompound(playerID) {
    if (!this.state.players) {
      return []
    }
    return this.state.players[playerID]?.compound || []
  },

  playerEnergy() {
    if (!this.initialized) {
      return 0
    }
    return this.state.players[this.playerID].energy
  },

  playerMetal() {
    if (!this.initialized) {
      return 0
    }
    return this.state.players[this.playerID].metal
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

  /**
   * Request the server to mark player's work phase as complete
   *
   * @param {Array<int>} cards - The list of cards to discard to end the turn.
   * @param {int} energy - The amount of energy to discard to end the turn.
   * @param {int} metal - The amount of metal to discard to end the turn.
   */
  requestEndTurn(cards, energy, metal) {
    console.log('Requesting work phase complete')
    this.socket.emit('end-turn', cards, energy, metal)
  },

  // Add the specified card to this player's hand
  pickUpFromMarketplace(cardID) {
    console.log('pickup', cardID)
    this.socket.emit('pickup-from-marketplace', cardID)
  },

  /**
   * Activate a Contractor card from the marketplace
   *
   * @param {int} cardTool - The tool symbol above the Contractor to hire.
   * @param {int} cardIDToDiscard - The ID of a Blueprint card in the player's hand to discard.
   * @param {string|null} otherPlayerID - Optionally another player to be a target of the contractor action.
   */
  hireContractor(cardTool, cardIDToDiscard, otherPlayerID) {
    console.log(
      'Hiring contractor',
      cardTool,
      'by discarding card',
      cardIDToDiscard,
      'and targeting player',
      otherPlayerID,
    )
    this.socket.emit('hire-contractor', cardTool, cardIDToDiscard, otherPlayerID)
  },

  // Roll all available dice
  rollDice() {
    console.log('Rolling Dice')
    this.socket.emit('roll-dice')
  },

  /**
   * Select specific values for up to 4 dice for a given player at the start of the Work phase.
   * This is the action associated with the "Foreman" contractor card
   *
   * @param {Array<int>} diceSelection - An array of integers representing the selected dice values.
   * @returns {boolean} - True if the dice were set, false otherwise.
   */
  chooseDice(diceSelection) {
    console.log('Choosing dice', diceSelection)
    this.socket.emit('choose-dice', diceSelection)
  },

  /**
   * Gain a die with a specific value
   * This is the actions associated with the "Specialist" contractor card
   *
   * @param {int} value - The value of the die to add.
   * @returns {boolean} - True if the die was added, false otherwise.
   */
  gainDiceValue(value) {
    console.log('Gaining die', value)
    this.socket.emit('gain-dice-value', value)
  },

  /**
   * Replace all blueprint or contractor cards in the marketplace with new ones
   *
   * @param {string} cardType - 'blueprint' or 'contractor' to determine which type of cards to refresh
   * @param {string} resource - 'metal' or 'energy' to determine which resource to spend
   */
  refreshMarketplace(cardType, resource) {
    console.log('Refreshing', cardType, 'cards in Marketplace')
    this.socket.emit('refresh-marketplace', cardType, resource)
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

  /**
   * Activate a card from the player's compound.
   *
   * @param {int} cardID - The ID of the card to be activated.
   * @param {Array<int>} diceSelection - Indices into the player's dice array.
   * @param {Array<int>} cardSelection - List of card IDs, which should be in the player's hand.
   * @param {int} energySelection - Number of energy to use for activation (applies to Golem only).
   * @param {string} rewardSelection - One of 'Card', 'Metal', or 'Energy' to select the reward when there is a choice.
   * @param {int} cardToReplicate - If activating a Replicator, the ID of a Blueprint card in the marketplace.
   *
   */
  activateCard(cardID, diceSelection, cardSelection, energySelection, rewardSelection, cardToReplicate) {
    console.log(
      'Activate card',
      cardID,
      'with dice selection',
      diceSelection,
      'card selection',
      cardSelection,
      'energy selection',
      energySelection,
      'reward selection',
      rewardSelection,
      'replicate card',
      cardToReplicate,
    )
    this.socket.emit(
      'activate-card',
      cardID,
      diceSelection,
      cardSelection,
      energySelection,
      rewardSelection,
      cardToReplicate,
    )
  },
})
