/**
 * Core logic for the game
 */

import * as cards from './cards.js'
import * as player from './player.js'
import * as activateCards from './activateCards.js'
import * as constants from './constants.js'
import { checkArrayValuesUnique, randomDice } from './helpers.js'

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
      deckSize: this.deck.length,
      discardSize: this.discard.length,
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
  }

  /**
   * Removes a player from the game and discards all of their cards
   *
   * @param {string} playerID - The ID of the player to remove.
   */
  removePlayer(playerID) {
    // Discard the player's hand
    for (const cardID of Object.keys(this.players[playerID].hand)) {
      this._removeFromHand(playerID, cardID)
    }
    // Discard the player's compound
    for (let card of this.players[playerID].compound) {
      this.discard.push(card)
    }
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
   * Increases the goods for a specific player.
   *
   * @private
   * @param {string} playerID - The ID of the player.
   * @param {int} count - The number of goods to add to the player's total.
   */
  _manufactureGoods(playerID, count) {
    this.players[playerID].goods += count
    if (this.players[playerID].markCardNameActivated('Laboratory')) {
      // Having a laboratory in the compound allows the player to draw a card when gaining goods
      this._drawCard(playerID)
    }
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
    // Check that player does not already have one of these cards in their compound
    if (
      !constants.BUILD_MULTIPLE.includes(card.name) &&
      this.players[playerID].compound.some((c) => c.name === card.name)
    ) {
      console.log('Player already has card', card.name, 'in compound')
      return false
    }
    // Check player resources
    let metalCost = card.cost_metal
    if (metalCost === null) {
      // Special case for Megalith, metal cost reduced by 1 for each monument card in compound
      metalCost = Math.max(0, 5 - this.players[playerID].monumentsInCompound())
    }

    if (metalCost > this.players[playerID].metal) {
      console.log('Player does not have enough metal to build card')
      return false
    } else if (card.cost_energy > this.players[playerID].energy) {
      console.log('Player does not have enough energy to build card')
      return false
    }

    // Build the card
    this.players[playerID].metal -= metalCost
    this.players[playerID].energy -= card.cost_energy
    this._removeFromHand(playerID, cardIDToDiscard)

    if (this.players[playerID].markCardNameActivated('Scrap Yard')) {
      // Scrap Yard: gain 1 metal after building a card
      console.log('Activating Scrap Yard')
      this.players[playerID].metal += 1
    }

    if (this.players[playerID].markCardNameActivated('Solar Array')) {
      // Solar Array: gain 2 energy after building a card
      console.log('Activating Solar Array')
      this.players[playerID].energy += 2
    }

    this._moveToCompound(playerID, cardIDToBuild)

    return true
  }

  /**
   * Removes a blueprint card from a player's hand and adds it to the discard pile.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be removed.
   */
  _removeFromHand(playerID, cardID) {
    this.discard.push(this.players[playerID].hand[cardID])
    delete this.players[playerID].hand[cardID]
  }

  /**
   * Discard all blueprint cards in the marketplace
   */
  _clearMarketplaceBlueprints() {
    for (let card of this.marketplace) {
      this.discard.push(card)
    }
    this.marketplace = []
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
   * Checks whether all players in the game have finished their work phase.
   *
   * @returns {boolean} - True if currently work phase and all players are finished
   */
  _checkAllPlayersFinishedWork() {
    if (!this.workPhase) {
      return false
    }
    for (const playerID of Object.keys(this.players)) {
      if (!this.players[playerID].workDone.hasFinishedWork) {
        return false
      }
    }
    return true
  }

  /**
   * Requests that a player be marked as having completed the work phase
   *
   * @param {string} playerID - The ID of the player to mark work phase complete for
   * @param {Array<cards.BlueprintCard>} cards - Any cards to discard
   * @param {int} energy - The number of energy to discard
   * @param {int} metal - The number of metal to discard
   * @returns {boolean} - Whether the player's work phase was successfully marked as complete
   */
  endTurn(playerID, cards, energy, metal) {
    if (!this.workPhase) {
      console.log('Cannot end turn outside of Work phase')
      return false
    }

    // Check that resource discard selection is valid
    if (this.players[playerID].energy < energy || energy < 0) {
      console.log('Player does not have', energy, 'energy to discard')
      return false
    }
    if (this.players[playerID].metal < metal || metal < 0) {
      console.log('Player does not have', metal, 'metal to discard')
      return false
    }

    // Check that resource discards are sufficient
    let currentResources = this.players[playerID].energy + this.players[playerID].metal
    if (currentResources - metal - energy > constants.END_WORK_MAX_RESOURCES) {
      console.log('Player has', currentResources, 'resources, must discard down to', constants.END_WORK_MAX_RESOURCES)
      return false
    }

    let nCardsInHand = Object.keys(this.players[playerID].hand).length
    let nDiscardsNeeded = nCardsInHand - constants.END_WORK_MAX_CARDS
    if (nDiscardsNeeded > 0) {
      // Check that player provided acceptable list of cards to discard
      if (!checkArrayValuesUnique(cards, nDiscardsNeeded)) {
        console.log('Player must discard', nDiscardsNeeded, 'unique cards from hand')
        return false
      }
      for (let cardID of cards) {
        if (!this.players[playerID].hand[cardID]) {
          console.log('Card ID', cardID, 'not found in player hand')
          return false
        }
      }
    }

    // Discard the resources
    console.log('Discarding', cards, metal, energy)
    this.players[playerID].metal -= metal
    this.players[playerID].energy -= energy
    for (let cardID of cards) {
      this._removeFromHand(playerID, cardID)
    }

    this.players[playerID].workDone.hasFinishedWork = true

    if (this._checkAllPlayersFinishedWork()) {
      this.changePhase()
    }

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

  /**
   * Moves the selected card from the marketplace into the player's hand
   *
   * @param {string} playerID - The ID of the player attempting to pick up the card.
   * @param {int} cardID - The ID of the card to be picked up from the marketplace.
   * @returns {boolean} - Whether the card was successfully picked up.
   */
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
    this.fillMarketplace()
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
      const value = randomDice()
      this.players[playerID].dice.push(value)
    }
    this.players[playerID].numDice = 0
    return true
  }

  /**
   * Refresh the marketplace with new blueprint cards
   *
   * @param {string} playerID - The ID of the player.
   * @param {string} resource - 'metal' or 'energy' to determine which resource to spend.
   * @returns {boolean} - True if the marketplace was refreshed successfully, false otherwise.
   */
  refreshMarketplaceBlueprints(playerID, resource) {
    if (this.players[playerID].workDone.hasRefreshedCards) {
      console.log('Player has already refreshed cards this round')
      return false
    }

    if (resource === 'metal') {
      if (this.players[playerID].metal < 1) {
        console.log('Player does not have enough metal to refresh marketplace')
        return false
      }
      this.players[playerID].metal -= 1
    } else if (resource === 'energy') {
      if (this.players[playerID].energy < 1) {
        console.log('Player does not have enough energy to refresh marketplace')
        return false
      }
      this.players[playerID].energy -= 1
    } else {
      console.log('Invalid resource', resource, 'requested for refreshing marketplace')
      return false
    }
    this.players[playerID].workDone.hasRefreshedCards = true
    this._clearMarketplaceBlueprints()
    this.fillMarketplace()
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

  /**
   * Activates a card from the player's compound
   *
   * @param {string} playerID - The ID of the player attempting to activate the card.
   * @param {int} cardID - The ID of the card to be activated.
   * @param {Array<int>} diceSelection - The dice indices selected by the player for this action.
   * @param {Array<int>} cardSelection - The IDs of other cards selected by the player for this action.
   * @param {int} energySelection - The number of energy selected by the player for this action.
   * @returns {boolean} Whether or not the card was successfully activated.
   */
  activateCard(playerID, cardID, diceSelection, cardSelection, energySelection) {
    // Check we're in the right phase
    if (!this.workPhase) {
      console.log('Cannot activate cards outside of the work phase')
      return false
    }
    // Check that the player actually has this card in their compound
    let card = this.players[playerID].compound.find((card) => card.id === cardID)
    if (!card) {
      console.log('Player', playerID, 'does not have card', cardID, 'in compound')
      return false
    }
    // Check that the card has not been activated already
    if (card.alreadyActivated) {
      console.log('Card ID', cardID, 'has already been activated')
      return false
    }
    // Attempt to activate the card, using up the player's resources
    console.log('Activating card ID', cardID, 'for player', playerID)
    if (!this._activate(playerID, card, diceSelection, cardSelection, energySelection)) {
      return false
    }
    console.log('Successfully activated card ID', cardID)
    // Mark the card as activated
    card.alreadyActivated = true
    return true
  }

  /**
   * Helper function to break out all the hard-coded logic for the unique cards.
   *
   * @param {string} playerID - The ID of the player attempting to activate the card.
   * @param {BlueprintCard} card - The card to activate, must be in player's compound.
   * @param {Array<int>} diceSelection - The dice indices selected by the player for this action.
   * @param {Array<int>} cardSelection - The IDs of other cards selected by the player for this action.
   * @param {int} energySelection - The number of energy selected by the player for this action.
   * @returns {boolean} Whether or not the card was successfully activated.
   */
  _activate(playerID, card, diceSelection, cardSelection, energySelection) {
    // This function should not worry about game state
    // It should just check and update the player's resources basically
    if (!card.activatable) {
      return false
    }

    let player = this.players[playerID]

    switch (card.name) {
      case 'Aluminum Factory':
        // [X]=[X] + ⚡5 -> 📦2 + 🔩
        console.log('Aluminum Factory')
        // Confirm that we have 2 dice of equal value
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          console.log('Invalid dice selection')
          return false
        }

        // Confirm that we have 5 energy
        if (player.energy < 5) {
          console.log('Insufficient energy')
          return false
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 5
        this._manufactureGoods(playerID, 2)
        player.metal += 1
        break

      case 'Assembly Line':
        // [X]+[X+1]+[X+2] -> 📦2
        console.log('Assembly Line')
        // Confirm we have 3 dice with incrementing values
        if (!activateCards.checkDiceSeries(player.dice, diceSelection, 3)) {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 2)
        break

      case 'Battery Factory':
        // ⚡4 -> 📦
        console.log('Battery Factory')
        if (player.energy < 4) {
          console.log('Insufficient energy')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 4
        this._manufactureGoods(playerID, 1)
        break

      case 'Biolab':
        // [1] + ⚡ -> 📦
        console.log('Biolab')
        if (activateCards.checkDieValue(player.dice, diceSelection, [1]) === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (player.energy < 1) {
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 1
        this._manufactureGoods(playerID, 1)
        break

      case 'Black Market': {
        // [?] + 🟦 -> ⚡+🔩* (gain up to 4 resources equal to the build cost of the discarded 🟦)
        console.log('Black Market')
        // TODO: implement resource selection, for now you just get 2 of each
        if (activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6]) === null) {
          console.log('Invalid dice selection')
          return false
        }
        // TODO: handle card validation better so we don't perform two checks here
        // and we don't seem to use the cards from getCards so that might be unnecessary
        if (!checkArrayValuesUnique(cardSelection, 1)) {
          console.log('Invalid card selection')
          return false
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 1) {
          console.log('Expected 1 card selection, got', cards.length)
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._removeFromHand(playerID, cardSelection[0])
        player.energy += 2
        player.metal += 2
        break
      }

      case 'Concrete Plant': {
        // [X]=[X] + 🔩X -> 📦2
        console.log('Concrete Plant')
        // Confirm that we have 2 dice of equal value
        let value = activateCards.checkDiceEqual(player.dice, diceSelection, 2)
        if (value === null) {
          console.log('Invalid dice selection')
          return false
        }
        // Confirm that we have X metal
        if (player.metal < value) {
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.metal -= value
        this._manufactureGoods(playerID, 2)
        break
      }

      case 'Dojo': {
        // ⚡ -> [?] flip
        console.log('Dojo')
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6])
        if (value === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (player.energy < 1) {
          return false
        }
        player.energy -= 1
        player.dice[diceSelection[0]] = 7 - value
        break
      }

      case 'Fitness Center': {
        // ⚡ -> [-1]
        console.log('Fitness Center')

        let value = activateCards.checkDieValue(player.dice, diceSelection, [2, 3, 4, 5, 6])
        if (value === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (player.energy < 1) {
          return false
        }
        player.energy -= 1
        player.dice[diceSelection[0]] = value - 1
        break
      }

      case 'Foundry': {
        // [X] + ⚡X -> 🔩X
        console.log('Foundry')
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6])
        if (value === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (player.energy < value) {
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= value
        player.metal += value
        break
      }

      case 'Fulfillment Center':
        // [4] + ⚡2 -> 📦 + 🔩
        console.log('Fulfillment Center')
        if (activateCards.checkDieValue(player.dice, diceSelection, [4]) === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (player.energy < 2) {
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 2
        player.metal += 1
        this._manufactureGoods(playerID, 1)
        break

      case 'Golem':
        // ⚡X -> [X] gain an extra [?] with a value of X this turn
        console.log('Golem')
        if (energySelection < 1 || energySelection > 6 || player.energy < energySelection) {
          console.log('Invalid energy selection')
          return false
        }
        player.energy -= energySelection
        player.dice.push(energySelection)
        break

      case 'Gymnasium': {
        // ⚡ -> [+1]
        console.log('Gymnasium')
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5])
        if (value === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (player.energy < 1) {
          return false
        }
        player.energy -= 1
        console.log('Changing die', diceSelection[0], 'with value', player.dice[diceSelection[0]], 'to', value + 1)
        player.dice[diceSelection[0]] = value + 1
        break
      }

      case 'Harvester':
        // [X]=[X] -> 🔩4 OR [X]=[X] -> ⚡7
        console.log('Harvester')
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          console.log('Invalid dice selection')
          return false
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        // TODO: implement selection of metal vs energy. For now just give metal
        player.metal += 4
        break

      case 'Incinerator': {
        // 🟦 + 🔩 -> ⚡6
        console.log('Incinerator')
        if (!checkArrayValuesUnique(cardSelection, 1)) {
          console.log('Invalid card selection')
          return false
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 1) {
          console.log('Expected 1 card selection, got', cards.length)
          return false
        }

        if (player.metal < 1) {
          console.log('Insufficient metal')
          return false
        }

        this._removeFromHand(playerID, cardSelection[0])
        player.metal -= 1
        player.energy += 6
        break
      }

      case 'Manufactory':
        // [X]=[X] -> 📦 + 🔩2 OR 🟦2 OR ⚡3
        console.log('Manufactory')
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        // TODO: implement reward selection, for now just give metal
        // TODO: handle if the deck is empty and cards were selected?
        player.metal += 2
        this._manufactureGoods(playerID, 1)
        break

      case 'Mega Factory':
        // [X]=[X]=[X] -> 📦2 + [?]* Gain an extra [?] of any value this turn
        console.log('Mega Factory')
        // TODO: implement reward selection, for now just give a [6]
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 3) === null) {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 2)
        player.dice.push(6)
        break

      case 'Motherlode':
        // [1] | [2] | [3] -> 🔩 OR [4] | [5] | [6] -> 🔩2
        console.log('Motherlode')
        if (activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3])) {
          player.metal += 1
        } else if (activateCards.checkDieValue(player.dice, diceSelection, [4, 5, 6])) {
          player.metal += 2
        } else {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        break

      case 'Nuclear Plant':
        // [6] -> 📦 + ⚡
        console.log('Nuclear Plant')
        if (activateCards.checkDieValue(player.dice, diceSelection, [6]) === null) {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 1)
        player.energy += 1
        break

      case 'Power Plant': {
        // [X] -> ⚡X
        console.log('Power Plant')
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6])
        if (value === null) {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy += value
        break
      }

      case 'Recycling Plant': {
        // 🟦2 + ⚡2 -> 📦 + 🟦
        console.log('Recycling Plant')
        if (!checkArrayValuesUnique(cardSelection, 2)) {
          console.log('Invalid card selection')
          return false
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 2) {
          console.log('Expected 2 card selection, got', cardSelection.length)
          return false
        }
        if (player.energy < 2) {
          console.log('Insufficient energy')
          return false
        }
        player.energy -= 2
        this._removeFromHand(playerID, cardSelection[0])
        this._removeFromHand(playerID, cardSelection[1])
        this._drawCard(playerID)
        this._manufactureGoods(playerID, 1)
        break
      }

      case 'Refinery': {
        // 🟦 + ⚡3 -> 🔩3
        console.log('Refinery')
        if (!checkArrayValuesUnique(cardSelection, 1)) {
          console.log('Invalid card selection')
          return false
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 1) {
          console.log('Expected 1 card selection, got', cardSelection.length)
          return false
        }
        if (player.energy < 3) {
          console.log('Insufficient energy')
          return false
        }
        player.energy -= 3
        this._removeFromHand(playerID, cardSelection[0])
        player.metal += 3
        break
      }

      case 'Replicator':
        // ⚡ -> Use a 🟦 in the MARKETPLACE (activation costs still apply)
        console.log('Replicator')
        // TODO: implement marketplace card activation, for now do nothing but use energy
        // one way to do this would be to have a "used by replicator" flag where the client could
        // send a normal activate-card request with that set, then the server can check that flag,
        // see if the player actually has a replicator, and if so activate the card like normal, just
        // set the replicator as alreadyActivated instead of the marketplace card
        if (player.energy < 1) {
          return false
        }
        player.energy -= 1
        break

      case 'Robot':
        // 🔩 -> Roll an extra [?] this turn
        console.log('Robot')
        if (player.metal < 1) {
          return false
        }
        player.dice.push(randomDice())
        break

      case 'Temp Agency': {
        // ⚡ -> choose 1 or more unplaced [?] and reroll them
        console.log('Temp Agency')
        if (!activateCards.checkDiceValid(player.dice, diceSelection)) {
          console.log('Invalid dice selection')
          return false
        }

        this.energy -= 1
        for (let i = 0; i < diceSelection.length; i++) {
          let index = diceSelection[i]
          player.dice[index] = randomDice()
        }
        break
      }

      case 'Trash Compactor': {
        // [X]=[X] + 🟦2 -> 📦2
        console.log('Trash Compactor')
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          console.log('Invalid dice selection')
          return false
        }
        if (!checkArrayValuesUnique(cardSelection, 2)) {
          console.log('Invalid card selection')
          return false
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 2) {
          console.log('Expected 2 card selection, got', cards.length)
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._removeFromHand(playerID, cardSelection[0])
        this._removeFromHand(playerID, cardSelection[1])
        this._manufactureGoods(playerID, 2)
        break
      }

      case 'Warehouse':
        // [?]+[?]+[?] sum must be 14+ -> 📦2 + ⚡2
        console.log('Warehouse')
        if (!activateCards.checkDiceSum(player.dice, diceSelection, 3, 14)) {
          console.log('Invalid dice selection')
          return false
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 2)
        player.energy += 2
        break

      default:
        console.log('Cannot activate unknown card', card.name)
        return false
    }

    // TODO: should we ignore if extra selections are specified?
    // i.e. if only dice are needed but cardSelection is not []?
    // Could check in each card activation that only required inputs are present
    return true
  }
}
