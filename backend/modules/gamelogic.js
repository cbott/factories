/**
 * Core logic for the game
 */

import * as cards from './cards.js'
import * as player from './player.js'

export class GameState {
  constructor() {
    this.deck = []
    this.discard = []
    this.marketplace = []
    // `players` object maps session IDs to instances of the Player class
    this.players = {}
    this.workPhase = false
  }

  /**
   * Initializes the game state
   */
  async init() {
    this.deck = await cards.buildDeck()
  }

  /**
   * Returns the public state of the game to be sent to clients
   *
   * @returns {Object} The public state of the game.
   */
  get publicState() {
    return {
      marketplace: this.marketplace,
      players: this.players,
      workPhase: this.workPhase,
    }
  }

  /**
   * Adds a player to the game and deals them a starting hand.
   *
   * @param {string} playerID - The ID of the player to add.
   */
  addPlayer(playerID) {
    this.players[playerID] = new player.Player()
    for (let i = 0; i < player.STARTING_HAND_SIZE; i++) {
      this._drawCard(playerID)
    }
    // TEMP FOR TESTING
    for (let i = 0; i < 5; i++) {
      this.players[playerID].compound.push(this._getNextCardFromDeck())
    }
  }

  /**
   * Removes a player from the game and discards all of their cards
   *
   * @param {string} playerID - The ID of the player to remove.
   */
  removePlayer(playerID) {
    for (const cardID of Object.keys(this.players[playerID].hand)) {
      this._removeFromHand(playerID, cardID)
    }
    // TODO: Also discard the player's compound
    delete this.players[playerID]
  }

  /**
   * Moves a card from a player's hand to their compound and updates prestige.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be moved.
   */
  _moveToCompound(playerID, cardID) {
    // TODO: add validation
    console.log('Moving card', cardID, 'to compound', playerID)
    this.players[playerID].compound.push(this.players[playerID].hand[cardID])
    // Card is moved to compound, now remove it from hand
    delete this.players[playerID].hand[cardID]
    this.players[playerID].prestige = cards.calculatePrestige(this.players[playerID].compound)
  }

  /**
   * Builds a card for a player by using resources and discarding a matching tool card.
   *
   * @param {string} playerID - The ID of the player attempting to build the card.
   * @param {int} cardIDToBuild - The ID of the card the player wants to build.
   * @param {int} cardIDToDiscard - The ID of the card the player wants to discard.
   * @returns {boolean} - Returns true if the card was successfully built, otherwise false.
   */
  buildCard(playerID, cardIDToBuild, cardIDToDiscard) {
    if (!this.workPhase) {
      console.log('Cannot build cards outside of Work phase')
      return false
    }

    if (cardIDToBuild === cardIDToDiscard) {
      console.log('Card ID', cardIDToBuild, 'selected to build and discard are the same')
      return false
    }

    let hand = this.players[playerID].hand
    if (!hand[cardIDToBuild]) {
      console.log('Card ID', cardIDToBuild, 'selected to build but is not in player hand')
      return false
    }
    if (!hand[cardIDToDiscard]) {
      console.log('Card ID', cardIDToDiscard, 'selected to discard but is not in player hand')
      return false
    }
    if (hand[cardIDToBuild].tool !== hand[cardIDToDiscard].tool) {
      console.log('Card to build and discard do not have matching tools')
      return false
    }

    let card = hand[cardIDToBuild]
    if (card.cost_metal > this.players[playerID].metal) {
      console.log('Player does not have enough metal to build card')
      return false
    } else if (card.cost_energy > this.players[playerID].energy) {
      console.log('Player does not have enough energy to build card')
      return false
    }
    this.players[playerID].metal -= card.cost_metal
    this.players[playerID].energy -= card.cost_energy
    this._moveToCompound(playerID, cardIDToBuild)
    this._removeFromHand(playerID, cardIDToDiscard)
    return true
  }

  /**
   * Removes a card from a player's hand and adds it to the discard pile.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be removed.
   */
  _removeFromHand(playerID, cardID) {
    this.discard.push(this.players[playerID].hand[cardID])
    delete this.players[playerID].hand[cardID]
  }

  /**
   * Draws a card from the deck and adds it to the player's hand.
   *
   * @param {string} playerID - The ID of the player.
   */
  _drawCard(playerID) {
    const card = this._getNextCardFromDeck()
    if (card === null) {
      console.log('No cards left in deck')
      return
    }
    console.log('Drawing card')
    this.players[playerID].hand[card.id] = card
  }

  /**
   * Removes and returns the next card from the deck, shuffling the discard pile back into the deck if necessary.
   *
   * @returns {BlueprintCard|null} The next card from the deck, or null if no cards are available.
   */
  _getNextCardFromDeck() {
    if (this.deck.length === 0) {
      if (this.discard.length === 0) {
        // No cards left in the deck or discard pile
        return null
      }
      this.deck = cards.shuffleArray(this.discard)
      this.discard = []
    }
    return this.deck.pop()
  }

  /**
   * Transition between Market Phase and Work Phase
   *
   * @returns {boolean} - True if the phase was changed successfully, false otherwise.
   */
  changePhase() {
    if (this.workPhase) {
      // Currently in Work phase, change to Market phase, resetting player temporary states
      this.workPhase = false
      for (const playerID of Object.keys(this.players)) {
        this.players[playerID].resetRound()
      }
    } else {
      // Currently in Market phase, change to Work phase
      this.workPhase = true
    }
    console.log('Work phase has been set to', this.workPhase)
    return true
  }

  /**
   * Fills the marketplace with cards from the deck
   *
   * @returns {boolean} - True if the marketplace was filled successfully, false otherwise.
   */
  fillMarketplace() {
    while (this.marketplace.length < 4) {
      const card = this._getNextCardFromDeck()
      if (card == null) {
        // Out of cards
        return false
      }
      this.marketplace.push(card)
    }
    return true
  }

  pickupFromMarketplace(playerID, cardID) {
    // TODO: check that provided cardID is actually in the marketplace
    if (this.workPhase) {
      console.log('Cannot pick up cards outside of Market phase')
      return false
    }

    const card = cards.removeCardByID(this.marketplace, cardID)
    if (card === null) {
      console.log('Card ID', cardID, 'not found in marketplace')
      return false
    }
    this.players[playerID].hand[cardID] = card
    return true
  }

  /**
   * Rolls dice for a given player during the Work phase.
   *
   * @param {string} playerID - The ID of the player rolling the dice.
   * @returns {boolean} - True if the dice were rolled successfully, false otherwise.
   */
  rollDice(playerID) {
    if (!this.workPhase) {
      console.log('Cannot roll dice outside of Work phase')
      return false
    }

    const numDice = this.players[playerID].numDice
    for (let i = 0; i < numDice; i++) {
      // Pick a random number from 1-6
      const value = Math.ceil(Math.random() * 6)
      this.players[playerID].dice.push(value)
    }
    this.players[playerID].numDice = 0
    return true
  }

  /**
   * Places a die in the specified floor of the player's headquarters.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} dieIndex - The index of the die in the player's dice pool.
   * @param {string} floor - The floor in the headquarters where the die should be placed. Valid values are 'generate', 'mine', and 'research'.
   * @returns {boolean} - Returns true if the die was successfully placed, otherwise false.
   */
  placeDieInHeadquarters(playerID, dieIndex, floor) {
    if (!this.workPhase) {
      console.log('Cannot place dice outside of Work phase')
      return false
    }

    // Verify that the player actually has this die
    if (typeof dieIndex !== 'number' || dieIndex > this.players[playerID].dice.length || dieIndex < 0) {
      console.log('Invalid die index', dieIndex, 'requested. Player has', this.players[playerID].dice.length, 'dice')
      return false
    }

    // Verify that this is a valid floor
    if (!(floor in this.players[playerID].headquarters)) {
      console.log('Invalid floor', floor, 'requested')
      return false
    }

    // Verify that this floor is not full
    if (this.players[playerID].headquarters.length >= 3) {
      console.log('Floor', floor, 'is full')
      return false
    }

    // Get dice value from index
    const die = this.players[playerID].dice[dieIndex]

    // Only dice 1-3 can be used for "generate", Only dice 4-6 can be used for "mine"
    if ((floor === 'generate' && die > 3) || (floor === 'mine' && die < 4)) {
      console.log('Die value', die, 'cannot be placed in', floor)
      return false
    }

    // Remove die from player's dice pool and add it to the headquarters
    console.log('Placing die', die, 'with index', dieIndex, 'in', floor)
    this.players[playerID].dice.splice(dieIndex, 1)

    // Match Bonus: gain an extra resource if you have matching dice values
    // This should cleanly handle X=X->+1 and X=X=X->+2
    const bonus = this.players[playerID].headquarters[floor].includes(die) ? 1 : 0

    // Update player resources based on where dice are placed
    if (floor === 'research') {
      // Draw a card for each die placed on research
      for (let i = 0; i < 1 + bonus; i++) {
        this._drawCard(playerID)
      }
    } else if (floor === 'generate') {
      // Gain energy based on value of die
      this.players[playerID].energy += die + bonus
    } else if (floor === 'mine') {
      // Gain one metal regardless of die value
      this.players[playerID].metal += 1 + bonus
    }

    this.players[playerID].headquarters[floor].push(die)
    return true
  }
}
