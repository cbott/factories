/**
 * Core logic for the game
 */
import * as fs from 'fs'

import * as cards from './cards.js'
import * as player from './player.js'
import * as activateCards from './activateCards.js'
import * as constants from './constants.js'
import { checkArrayValuesUnique, isValidDiceValue, randomDice } from './helpers.js'

export class GameError extends Error {}

export class GameState {
  constructor() {
    this.deck = []
    this.contractors = []
    this.discard = []
    this.contractorDiscard = []
    this.marketplace = {
      blueprints: [],
      contractors: {
        hammer: null,
        wrench: null,
        gear: null,
        shovel: null,
      },
    }
    // `players` object maps session IDs to instances of the Player class
    this.players = {}
    this.workPhase = false
    this.currentPlayerID = null
    this.finalRound = false
    this.savefile = null
  }

  /**
   * Initializes the game state
   */
  init() {
    this.deck = cards.buildDeck(cards.BLUEPRINT_DEFINITION_CSV, 'blueprint')
    this.contractors = cards.buildDeck(cards.CONTRACTOR_DEFINITION_CSV, 'contractor')
    this.fillMarketplace()
  }

  /**
   * Loads the game state from a file
   *
   * @param {string} filename - The name of the file to load the game state from.
   * @return {GameState} - The loaded game.
   */
  static fromFile(filename) {
    let game = new GameState()
    let gamedata = JSON.parse(fs.readFileSync(filename))

    Object.assign(game, gamedata)

    game.players = Object.fromEntries(
      Object.entries(gamedata.players).map(([playerID, playerData]) => [playerID, player.Player.fromJSON(playerData)]),
    )
    game.savefile = filename

    return game
  }

  /**
   * Saves the game state to a file
   */
  saveToFile() {
    if (!this.savefile) {
      return
    }
    console.log('Saving game state to', this.savefile)
    let data = JSON.stringify(this)
    fs.writeFileSync(this.savefile, data)
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
      currentPlayerID: this.currentPlayerID,
      deckSize: this.deck.length,
      discardSize: this.discard.length,
      contractorSize: this.contractors.length,
      contractorDiscardSize: this.contractorDiscard.length,
      finalRound: this.finalRound,
    }
  }

  /**
   * Adds a player to the game and deals them a starting hand.
   *
   * @param {string} playerID - The ID of the player to add.
   */
  addPlayer(playerID) {
    this.players[playerID] = new player.Player()
    for (let i = 0; i < constants.STARTING_HAND_SIZE; i++) {
      this._drawBlueprint(playerID)
    }

    if (this.currentPlayerID === null) {
      this.currentPlayerID = playerID
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
      this._discardFromHand(playerID, cardID)
    }
    // Discard the player's compound
    for (let card of this.players[playerID].compound) {
      this.discard.push(card)
    }
    // Pass on the current player token to the next player if needed
    if (this.currentPlayerID === playerID) {
      this._advanceToNextPlayer()
    }

    delete this.players[playerID]
  }

  /**
   * Sets it to the next player's turn of the Market phase
   */
  _advanceToNextPlayer() {
    let keys = Object.keys(this.players)
    let nextPlayerID = ''

    if (this.currentPlayerID === null) {
      // Current player is not set
      nextPlayerID = keys[0]
    } else {
      nextPlayerID = keys[(keys.indexOf(this.currentPlayerID) + 1) % keys.length]
    }

    console.log('Advancing player token from', this.currentPlayerID, 'to', nextPlayerID)
    this.currentPlayerID = nextPlayerID
  }

  /**
   * Checks which players have met the end game conditions.
   * The game ends if a player has either:
   * - Accumulated a number of goods greater than or equal to the defined threshold.
   * - Constructed a number of buildings greater than or equal to the defined threshold.
   *
   * @returns {Object} - Players meeting end conditions.
   */
  _checkEndConditions() {
    let atGoodsThreshold = []
    let atBuildingsThreshold = []

    for (const playerID of Object.keys(this.players)) {
      if (this.players[playerID].goods >= constants.END_GAME_TRIGGER_GOODS) {
        atGoodsThreshold.push(playerID)
        this.finalRound = true
      }
      if (this.players[playerID].compound.length >= constants.END_GAME_TRIGGER_BUILDINGS) {
        atBuildingsThreshold.push(playerID)
        this.finalRound = true
      }
    }
    return { goods: atGoodsThreshold, buildings: atBuildingsThreshold }
  }

  /**
   * Checks whether a player is allowed to perform a market phase action at this time
   *
   * @param {string} playerID - The ID of the player.
   * @returns {boolean} - True if the player can perform an action, false otherwise.
   */
  _marketPhaseActionValid(playerID) {
    if (this.workPhase) {
      console.log('Action can only be performed during Market phase')
      return false
    }

    if (!this._isPlayersTurn(playerID)) {
      console.log('It is not', playerID + "'s turn")
      return false
    }

    if (this.players[playerID].workDone.hasDrawnCard) {
      console.log('Player', playerID, 'has already drawn a card this round')
      return false
    }

    return true
  }

  /**
   * Checks whether a player is allowed to perform a work phase action at this time
   *
   * @param {string} playerID - The ID of the player.
   * @returns {boolean} - True if the player can perform an action, false otherwise.
   */
  _workPhaseActionValid(playerID) {
    if (!this.workPhase) {
      console.log('Action can only be performed during Work phase')
      return false
    }

    if (this.players[playerID].workDone.hasFinishedWork) {
      console.log('Player', playerID, 'has already ended their turn')
      return false
    }

    return true
  }

  /**
   * Increases the goods for a specific player.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} count - The number of goods to add to the player's total.
   */
  _manufactureGoods(playerID, count) {
    this.players[playerID].goods += count
    if (this.players[playerID].markCardNameActivated('Laboratory')) {
      // Having a laboratory in the compound allows the player to draw a card when gaining goods
      this._drawBlueprint(playerID)
    }
  }

  /**
   * Builds a Blueprint card from the player's hand by using resources and discarding a matching tool card.
   *
   * @param {string} playerID - The ID of the player attempting to build the card.
   * @param {int} cardIDToBuild - The ID of the card the player wants to build.
   * @param {int} cardIDToDiscard - The ID of the card the player wants to discard.
   * @returns {true|GameError} - True if the card was successfully built, otherwise GameError.
   */
  buildCard(playerID, cardIDToBuild, cardIDToDiscard) {
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Blueprint cards can only be built during the Work phase')
    }

    if (cardIDToBuild === cardIDToDiscard) {
      return new GameError(`Card ID ${cardIDToBuild} selected to build and discard are the same`)
    }

    let hand = this.players[playerID].hand
    let cardToBuild = hand[cardIDToBuild]

    if (!hand[cardIDToBuild]) {
      return new GameError(`Card ID ${cardIDToBuild} selected to build but is not in player hand`)
    }
    if (!hand[cardIDToDiscard]) {
      return new GameError(`Card ID ${cardIDToDiscard} selected to discard but is not in player hand`)
    }
    if (cardToBuild.tool !== hand[cardIDToDiscard].tool) {
      return new GameError(`Card to build and discard do not have matching tools`)
    }

    // Check player resources
    let metalCost = cardToBuild.cost_metal
    if (cardToBuild.name === 'Megalith') {
      // Special case for Megalith, metal cost reduced by 1 for each monument card in compound
      metalCost = Math.max(0, metalCost - this.players[playerID].monumentsInCompound())
    }

    if (metalCost > this.players[playerID].metal) {
      return new GameError(`Player needs ${metalCost} metal to build this card`)
    } else if (cardToBuild.cost_energy > this.players[playerID].energy) {
      return new GameError(`Player needs ${cardToBuild.cost_energy} energy to build this card`)
    }

    // Build the card
    if (!this._moveToCompound(playerID, cardToBuild)) {
      return new GameError(`Player already has card ${cardToBuild.name} in compound`)
    }

    // Spend resources
    delete this.players[playerID].hand[cardIDToBuild]
    this._discardFromHand(playerID, cardIDToDiscard)
    this.players[playerID].metal -= metalCost
    this.players[playerID].energy -= cardToBuild.cost_energy

    return true
  }

  /**
   * Core logic for building Blueprints. Adds the specified card to the player's compound.
   * - checks for duplicates
   * - activates on-build effects
   * - adds card to the compound
   * - updates prestige
   *
   * @param {string} playerID - The ID of the player for the compound.
   * @param {cards.BlueprintCard} card - The card to put in the player's compound.
   * @returns {boolean} - True if the card was successfully moved, false otherwise.
   */
  _moveToCompound(playerID, card) {
    // Check that player does not already have one of these cards in their compound
    if (
      !constants.BUILD_MULTIPLE.includes(card.name) &&
      this.players[playerID].compound.some((c) => c.name === card.name)
    ) {
      console.log('Player already has card', card.name, 'in compound')
      return false
    }

    // Activate extra effects from cards already in the compound
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

    // Place the new card in the compound
    console.log('Moving card', card.id, 'to compound of', playerID)
    this.players[playerID].compound.push(card)

    // Re-calculate prestige with the new compound contents
    this.players[playerID].prestige = cards.calculatePrestige(this.players[playerID].compound)

    return true
  }

  /**
   * Removes a blueprint card from a player's hand and adds it to the discard pile.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be discarded.
   */
  _discardFromHand(playerID, cardID) {
    this.discard.push(this.players[playerID].hand[cardID])
    delete this.players[playerID].hand[cardID]
  }

  /**
   * Discard all blueprint cards in the marketplace
   */
  _clearMarketplaceBlueprints() {
    for (let card of this.marketplace.blueprints) {
      this.discard.push(card)
    }
    this.marketplace.blueprints = []
  }

  /**
   * Discard all contractor cards in the marketplace
   */
  _clearMarketplaceContractors() {
    for (const tool of constants.TOOLS) {
      this.contractorDiscard.push(this.marketplace.contractors[tool])
      this.marketplace.contractors[tool] = null
    }
  }

  /**
   * Draws a card from the deck and adds it to the player's hand.
   *
   * @param {string} playerID - The ID of the player.
   */
  _drawBlueprint(playerID) {
    const card = this._getNextBlueprintFromDeck()
    if (card === null) {
      console.log('No cards left in deck')
      return
    }
    console.log('Moving card', card.id, 'to player', playerID, 'hand')
    this.players[playerID].hand[card.id] = card
  }

  /**
   * Retrieves the next Blueprint card from the deck
   *
   * @returns {cards.BlueprintCard|null} - The next blueprint card from the deck.
   */
  _getNextBlueprintFromDeck() {
    return cards.getNextCardFromDeck(this.deck, this.discard)
  }

  /**
   * Retrieves the next Blueprint card from the deck
   *
   * @returns {cards.BlueprintCard} - The next blueprint card from the deck.
   */
  _getNextContractorFromDeck() {
    return cards.getNextCardFromDeck(this.contractors, this.contractorDiscard)
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
      this._advanceToNextPlayer()
    } else {
      // Currently in Market phase, change to Work phase
      this.workPhase = true
    }
    console.log('Work phase has been set to', this.workPhase)
    // Save game state at the start of each phase
    this.saveToFile()
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
   * Checks whether all players in the game have finished their market phase.
   *
   * @returns {boolean} - True if currently market phase and all players have drawn a card
   */
  _checkAllPlayersHaveDrawnCard() {
    if (this.workPhase) {
      return false
    }
    for (const playerID of Object.keys(this.players)) {
      if (!this.players[playerID].workDone.hasDrawnCard) {
        return false
      }
    }
    return true
  }

  /**
   * Requests that a player be marked as having completed the work phase
   *
   * @param {string} playerID - The ID of the player to mark work phase complete for.
   * @param {Array<int>} cards - Array of Blueprint card IDs to discard from hand, if needed.
   * @param {int} energy - The number of energy to discard.
   * @param {int} metal - The number of metal to discard.
   * @returns {Object|GameError} - End game conditions.
   */
  endTurn(playerID, cards, energy, metal) {
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Action can only be performed during Work phase')
    }

    // Check that resource discard selection is valid
    if (this.players[playerID].energy < energy || energy < 0) {
      return new GameError(`Player does not have ${energy} energy to discard`)
    }
    if (this.players[playerID].metal < metal || metal < 0) {
      return new GameError(`Player does not have ${metal} metal to discard`)
    }

    // Check that resource discards are sufficient
    let currentResources = this.players[playerID].energy + this.players[playerID].metal
    if (currentResources - metal - energy > constants.END_WORK_MAX_RESOURCES) {
      return new GameError(
        `Player has ${currentResources} resources, must discard down to ${constants.END_WORK_MAX_RESOURCES}`,
      )
    }

    let nCardsInHand = Object.keys(this.players[playerID].hand).length
    let nDiscardsNeeded = nCardsInHand - constants.END_WORK_MAX_CARDS
    if (nDiscardsNeeded > 0) {
      // Check that player provided acceptable list of cards to discard
      if (!checkArrayValuesUnique(cards, nDiscardsNeeded)) {
        return new GameError(`Player must discard ${nDiscardsNeeded} unique cards from hand`)
      }
      for (let cardID of cards) {
        if (!this.players[playerID].hand[cardID]) {
          return new GameError(`Card ID ${cardID} not found in player hand`)
        }
      }
    }

    // Discard the resources
    console.log('Discarding', cards, metal, energy)
    this.players[playerID].metal -= metal
    this.players[playerID].energy -= energy
    for (let cardID of cards) {
      this._discardFromHand(playerID, cardID)
    }

    this.players[playerID].workDone.hasFinishedWork = true

    if (this._checkAllPlayersFinishedWork()) {
      this.changePhase()
      if (this.finalRound) {
        // We were already on the last round of the game, so we're done now
        return { end: true }
      }
      let result = this._checkEndConditions()
      result['newRound'] = true
      return result
    }

    return {}
  }

  /**
   * Fills the marketplace with Blueprint and Contractor cards from the deck
   *
   * @returns {boolean} - True if the marketplace was filled successfully, false otherwise.
   */
  fillMarketplace() {
    for (const tool of constants.TOOLS) {
      if (this.marketplace.contractors[tool] === null) {
        this.marketplace.contractors[tool] = this._getNextContractorFromDeck()
      }
    }

    while (this.marketplace.blueprints.length < 4) {
      const card = this._getNextBlueprintFromDeck()
      if (card == null) {
        // Out of cards
        return false
      }
      this.marketplace.blueprints.push(card)
    }
    return true
  }

  /**
   * Checks whether it is this player's turn of the market phase
   *
   * @param {string} playerID  - The ID of the player to check.
   * @returns {boolean} - Whether or not it is this player's turn.
   */
  _isPlayersTurn(playerID) {
    return playerID === this.currentPlayerID
  }

  /**
   * Cleanup actions to perform after a player has completed the actions of their Market phase
   *
   * @param {string} playerID - The ID of the player to end Market phase for
   */
  _completePlayerMarketPhase(playerID) {
    this.players[playerID].workDone.hasDrawnCard = true
    this.fillMarketplace()
    this._advanceToNextPlayer()
    if (this._checkAllPlayersHaveDrawnCard()) {
      this.changePhase()
    }
  }

  /**
   * Moves the selected Blueprint card from the marketplace into the player's hand
   *
   * @param {string} playerID - The ID of the player attempting to pick up the card.
   * @param {int} cardID - The ID of the card to be picked up from the marketplace.
   * @returns {true|GameError} - Whether the card was successfully picked up or activated.
   */
  pickupFromMarketplace(playerID, cardID) {
    if (!this._marketPhaseActionValid(playerID)) {
      return new GameError('Cards can only be picked up during the Market phase')
    }
    const card = cards.removeCardByID(this.marketplace.blueprints, cardID)
    if (card === null) {
      return new GameError(`Card ID ${cardID} not found in marketplace`)
    }
    this.players[playerID].hand[cardID] = card
    this._completePlayerMarketPhase(playerID)
    return true
  }

  /**
   * Activate a contractor card from the marketplace
   *
   * @param {string} playerID - The ID of the player attempting to pick up the card.
   * @param {int} cardTool - The tool of the Contractor card that is to be picked up.
   * @param {int} cardIDToDiscard - The ID of a Blueprint card in the player's hand to discard.
   * @param {string|null} otherPlayerID - Optionally another player to be a target of the contractor action.
   * @returns {Object|GameError} - Object with message for otherPlayer if successful, otherwise a GameError.
   */
  hireContractor(playerID, cardTool, cardIDToDiscard, otherPlayerID) {
    if (!this._marketPhaseActionValid(playerID)) {
      return new GameError('Cards can only be picked up during the Market phase')
    }

    if (!constants.TOOLS.includes(cardTool)) {
      return new GameError(`Invalid tool ${cardTool} selected for contractor`)
    }

    let contractorCard = this.marketplace.contractors[cardTool]

    if (contractorCard === null) {
      // There shouldn't really be a situation where this happens
      return new GameError(`Contractor card ${cardTool} not found in marketplace`)
    }

    // Check that player has sufficient energy to hire
    if (this.players[playerID].energy < contractorCard.cost_energy) {
      return new GameError(`Player does not have ${contractorCard.cost_energy} energy to hire contractor`)
    }

    // Check that player has the card they intend to discard
    if (!this.players[playerID].hand[cardIDToDiscard]) {
      return new GameError(`Card ID ${cardIDToDiscard} not found in player hand`)
    }

    // Check that the player is discarding the correct tool
    if (this.players[playerID].hand[cardIDToDiscard].tool !== cardTool) {
      return new GameError(`Card selected for discard ${cardIDToDiscard} does not match tool "${cardTool}"`)
    }

    // Check that another player is selected for Contractors that require it
    if (['Architect', 'Electrician', 'Miner'].includes(contractorCard.name)) {
      if (otherPlayerID === null) {
        return new GameError(`Contractor ${contractorCard.name} requires another player to be selected`)
      }
      if (!this.players[otherPlayerID]) {
        return new GameError(`Other player ID "${otherPlayerID}" not found`)
      }
    }

    console.log('Activating contractor card', contractorCard.name)
    let otherPlayerMessage = ''

    switch (contractorCard.name) {
      case 'Architect':
        // Draw 3🟦 and then pick an opponent to draw 1🟦
        for (let i = 0; i < 3; i++) {
          this._drawBlueprint(playerID)
        }
        otherPlayerMessage = `${playerID} sent you 1🟦 Blueprint card!`
        this._drawBlueprint(otherPlayerID)
        break
      case 'Electrician':
        // Gain 5⚡ and then pick an opponent to gain 2⚡
        this.players[playerID].energy += 5
        otherPlayerMessage = `${playerID} sent you 2⚡ Energy!`
        this.players[otherPlayerID].energy += 2
        break
      case 'Engineer': {
        // Draw and reveal a 🟦. Immediately BUILD it for free
        const max_retries = this.deck.length + this.discard.length
        // Theoretically if there are no cards left in the deck that we don't already have
        // we could get stuck in an infinite loop, so we enforce a limit on retries
        let success = false
        for (let i = 0; i < max_retries; i++) {
          const card = this._getNextBlueprintFromDeck()
          if (card === null) {
            return new GameError('There are no Blueprint cards left in deck')
          }
          if (this._moveToCompound(playerID, card)) {
            success = true
            break
          }
          this.discard.push(card)
        }
        if (!success) {
          return new GameError('There are no Blueprint cards left in deck that can be built')
        }
        break
      }
      case 'Foreman':
        // "At the start of the next work phase, instead of rolling you may choose the values for up to 4x [?]"
        this.players[playerID].selectableDice = true
        break
      case 'Hired Hands':
        // Roll 2 extra [?] at the start of the next work phase
        this.players[playerID].numDice += 2
        break
      case 'Investor': {
        // Draw and reveal a 🟦. Gain 🔩 and ⚡ equal to its BUILD cost. Discard the 🟦
        const card = this._getNextBlueprintFromDeck()
        if (card === null) {
          return new GameError('There are no Blueprint cards left in deck')
        }
        console.log('Collecting resources from', card)
        this.players[playerID].metal += card.cost_metal
        this.players[playerID].energy += card.cost_energy
        this.discard.push(card)
        break
      }
      case 'Miner':
        // Gain 3🔩 and then pick an opponent to gain 1🔩
        this.players[playerID].metal += 3
        otherPlayerMessage = `${playerID} sent you 1🔩 Metal!`
        this.players[otherPlayerID].metal += 1
        break
      case 'Specialist':
        // Gain an extra [?] of any value any time during the next work phase
        this.players[playerID].bonusDie = true
        break
    }

    // Spend the contractor activation cost
    this.players[playerID].energy -= contractorCard.cost_energy
    this._discardFromHand(playerID, cardIDToDiscard)

    // Discard the contractor card
    this.marketplace.contractors[cardTool] = null
    this.contractorDiscard.push(contractorCard)
    this._completePlayerMarketPhase(playerID)

    return { message: otherPlayerMessage }
  }

  /**
   * Rolls dice for a given player during the Work phase.
   *
   * @param {string} playerID - The ID of the player rolling the dice.
   * @returns {true|GameError} - True if the dice were rolled successfully, otherwise a GameError.
   */
  rollDice(playerID) {
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Dice can only be rolled during the Work phase')
    }

    const numDice = this.players[playerID].numDice
    if (numDice < 1) {
      return new GameError('No dice left to roll')
    }

    for (let i = 0; i < numDice; i++) {
      // Pick a random number from 1-6
      const value = randomDice()
      this.players[playerID].dice.push(value)
    }
    this.players[playerID].numDice = 0
    this.players[playerID].selectableDice = false
    return true
  }

  /**
   * Select specific values for up to 4 dice for a given player at the start of the Work phase.
   * This is the action associated with the "Foreman" contractor card
   *
   * @param {string} playerID - The ID of the player selecting the dice.
   * @param {Array<int>} diceSelection - An array of integers representing the selected dice values.
   * @returns {true|GameError} - Whether dice values were selected successfully.
   */
  chooseDice(playerID, diceSelection) {
    // The rules specify that this should be done "at the start of the next work phase"
    // We aren't strictly enforcing that, mainly just ensuring it is done before dice are rolled
    // though with robot/golem there are still some work-arounds to that
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Dice can only be selected during the Work phase')
    }

    if (!this.players[playerID].selectableDice) {
      return new GameError(`Player ${playerID} is not allowed to select dice`)
    }

    if (diceSelection.length > Math.min(4, this.players[playerID].numDice)) {
      return new GameError(`Player can only select up to ${Math.min(4, this.players[playerID].numDice)} dice`)
    }

    if (diceSelection.some((value) => !isValidDiceValue(value))) {
      return new GameError(`Invalid die values selected: ${diceSelection}`)
    }

    this.players[playerID].dice = diceSelection
    this.players[playerID].numDice -= diceSelection.length
    this.players[playerID].selectableDice = false
    return true
  }

  /**
   * Gain a die with a specific value
   * This is the actions associated with the "Specialist" contractor card
   *
   * @param {string} playerID - The ID of the player selecting the die.
   * @param {int} value - The value of the die to add.
   * @returns {true|GameError} - Whether a die with the specified value was added successfully.
   */
  gainDiceValue(playerID, value) {
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Dice can only be selected during the Work phase')
    }

    if (!this.players[playerID].bonusDie) {
      return new GameError(`Player ${playerID} does not have a bonus die this round`)
    }

    if (!isValidDiceValue(value)) {
      return new GameError(`Invalid die value selected: ${value}`)
    }

    this.players[playerID].bonusDie = false
    this.players[playerID].dice.push(value)
    return true
  }

  /**
   * Refresh the marketplace with new blueprint cards
   *
   * @param {string} playerID - The ID of the player.
   * @param {string} cardType - 'blueprint' or 'contractor' to determine which type of cards to refresh
   * @param {string} resource - 'metal' or 'energy' to determine which resource to spend.
   * @returns {boolean} True if the marketplace was refreshed successfully, false otherwise.
   */
  refreshMarketplace(playerID, cardType, resource) {
    if (!this._marketPhaseActionValid(playerID)) {
      return new GameError('Marketplace can only be refreshed during the Market phase')
    }

    if (this.players[playerID].workDone.hasRefreshedCards) {
      return new GameError('Player has already refreshed cards this round')
    }

    if (resource === 'metal') {
      if (this.players[playerID].metal < 1) {
        return new GameError('Player does not have enough metal to refresh marketplace')
      }
      this.players[playerID].metal -= 1
    } else if (resource === 'energy') {
      if (this.players[playerID].energy < 1) {
        return new GameError('Player does not have enough energy to refresh marketplace')
      }
      this.players[playerID].energy -= 1
    } else {
      return new GameError(`Invalid resource "${resource}" requested for refreshing marketplace`)
    }

    if (cardType === 'blueprint') {
      this._clearMarketplaceBlueprints()
    } else if (cardType === 'contractor') {
      this._clearMarketplaceContractors()
    } else {
      return new GameError(`Invalid card type "${cardType}" requested for refreshing marketplace`)
    }
    this.players[playerID].workDone.hasRefreshedCards = true
    this.fillMarketplace()
    return true
  }

  /**
   * Places a die in the specified floor of the player's headquarters.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} dieIndex - The index of the die in the player's dice pool.
   * @param {string} floor - The floor in the headquarters where the die should be placed. Valid values are 'generate', 'mine', and 'research'.
   * @returns {true|GameError} - Whether the die was successfully placed.
   */
  placeDieInHeadquarters(playerID, dieIndex, floor) {
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Dice can only be placed during the Work phase')
    }

    // Verify that the player actually has this die
    if (!Number.isInteger(dieIndex) || dieIndex >= this.players[playerID].dice.length || dieIndex < 0) {
      return new GameError(
        `Invalid die index ${dieIndex} requested. Player has ${this.players[playerID].dice.length} dice`,
      )
    }

    // Verify that this is a valid floor
    if (!(floor in this.players[playerID].headquarters)) {
      return new GameError(`Invalid floor "${floor}" requested`)
    }

    // Verify that this floor is not full
    if (this.players[playerID].headquarters.length >= 3) {
      return new GameError(`Floor "${floor}" is full`)
    }

    // Get dice value from index
    const die = this.players[playerID].dice[dieIndex]

    // Only dice 1-3 can be used for "generate", Only dice 4-6 can be used for "mine"
    if ((floor === 'generate' && die > 3) || (floor === 'mine' && die < 4)) {
      return new GameError(`Die value ${die} cannot be placed in "${floor}"`)
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
        this._drawBlueprint(playerID)
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
   * Activates a Blueprint card from the player's compound
   *
   * @param {string} playerID - The ID of the player attempting to activate the card.
   * @param {int} cardID - The ID of the card to be activated.
   * @param {Array<int>} diceSelection - The dice indices selected by the player for this action.
   * @param {Array<int>} cardSelection - The IDs of other cards selected by the player for this action.
   * @param {int} energySelection - The number of energy selected by the player for this action.
   * @param {String} rewardSelection - One of 'Card', 'Energy', 'Metal', 'n' (dice val) to earn by activating the card.
   * @param {int} cardToReplicate - If activating a Replicator, the ID of a Blueprint card in the marketplace.
   * @returns {true|GameError} Whether or not the card was successfully activated.
   */
  activateCard(playerID, cardID, diceSelection, cardSelection, energySelection, rewardSelection, cardToReplicate) {
    if (!this._workPhaseActionValid(playerID)) {
      return new GameError('Cards can only be activated during the Work phase')
    }
    // Check that the player actually has this card in their compound
    let card = this.players[playerID].compound.find((card) => card.id === cardID)
    if (!card) {
      return new GameError(`Player ${playerID} does not have card ${cardID} in their compound`)
    }
    // Check that the card has not been activated already
    if (card.alreadyActivated) {
      return new GameError(`Card ID ${cardID} has already been activated`)
    }
    // Attempt to activate the card, using up the player's resources
    console.log('Activating card ID', cardID, 'for player', playerID)

    let cardToActivate = card
    let withReplicator = false
    if (card.name === 'Replicator') {
      // Check that this cardID is in the marketplace
      if (!Number.isInteger(cardToReplicate)) {
        return new GameError(`Invalid card ID ${cardToReplicate} sent to Replicator`)
      }
      let newCard = this.marketplace.blueprints.find((c) => c.id === cardToReplicate)
      if (!newCard) {
        return new GameError(`Card ID ${cardToReplicate} not found in marketplace`)
      }
      cardToActivate = newCard
      withReplicator = true
    }

    let result = this._activate(
      playerID,
      cardToActivate,
      diceSelection,
      cardSelection,
      energySelection,
      rewardSelection,
      withReplicator,
    )

    if (result !== true) {
      return result
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
   * @param {cards.BlueprintCard} card - The card to activate, must be in player's compound.
   * @param {Array<int>} diceSelection - The dice indices selected by the player for this action.
   * @param {Array<int>} cardSelection - The IDs of other cards selected by the player for this action.
   * @param {int} energySelection - The number of energy selected by the player for this action.
   * @param {String} rewardSelection - One of 'Card', 'Energy', 'Metal', 'n' (dice val) to earn by activating the card.
   * @param {boolean} withReplicator - Whether the card is being activated through a Replicator.
   * @returns {true|GameError} Whether or not the card was successfully activated.
   */
  _activate(playerID, card, diceSelection, cardSelection, energySelection, rewardSelection, withReplicator) {
    // This function should not worry about game state
    // It should just check and update the player's resources basically
    if (!card.activatable) {
      return new GameError('Card is not activatable')
    }

    let player = this.players[playerID]

    let availableEnergy = player.energy
    if (withReplicator) {
      // Replicator costs 1 energy to activate another card
      if (availableEnergy < 1) {
        return new GameError('Insufficient energy to use Replicator')
      }
      availableEnergy -= 1
    }

    switch (card.name) {
      case 'Aluminum Factory':
        // [X]=[X] + ⚡5 -> 📦2 + 🔩
        // Confirm that we have 2 dice of equal value
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          return new GameError('Invalid dice selection')
        }

        // Confirm that we have 5 energy
        if (availableEnergy < 5) {
          return new GameError('Insufficient energy')
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 5
        this._manufactureGoods(playerID, 2)
        player.metal += 1
        break

      case 'Assembly Line':
        // [X]+[X+1]+[X+2] -> 📦2
        // Confirm we have 3 dice with incrementing values
        if (!activateCards.checkDiceSeries(player.dice, diceSelection, 3)) {
          return new GameError('Invalid dice selection')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 2)
        break

      case 'Battery Factory':
        // ⚡4 -> 📦
        if (availableEnergy < 4) {
          return new GameError('Insufficient energy')
        }
        player.energy -= 4
        this._manufactureGoods(playerID, 1)
        break

      case 'Biolab':
        // [1] + ⚡ -> 📦
        if (activateCards.checkDieValue(player.dice, diceSelection, [1]) === null) {
          return new GameError('Invalid dice selection')
        }
        if (availableEnergy < 1) {
          return new GameError('Insufficient energy')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 1
        this._manufactureGoods(playerID, 1)
        break

      case 'Black Market': {
        // [?] + 🟦 -> ⚡+🔩* (gain up to 4 resources equal to the build cost of the discarded 🟦)
        if (activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6]) === null) {
          return new GameError('Invalid dice selection')
        }
        if (!checkArrayValuesUnique(cardSelection, 1)) {
          return new GameError('Invalid card selection')
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 1) {
          return new GameError(`Expected 1 card selection, got ${cards.length}`)
        }

        let energyToGain = cards[0].cost_energy
        let metalToGain = cards[0].cost_metal

        if (energyToGain + metalToGain > 4) {
          if (!Number.isInteger(energySelection) || energySelection > energyToGain || energySelection < 0) {
            return new GameError(`Invalid energy selection: ${energySelection} exceeds ${energyToGain}`)
          }
          // Try to maximize the resources given to the player
          // First give all requested energy
          energyToGain = energySelection
          // Then give as much metal as the card allows up until 4 total energy+metal
          metalToGain = Math.min(metalToGain, 4 - energyToGain)
          // If the player under-requested energy, give it back
          if (energyToGain + metalToGain < 4) {
            energyToGain = 4 - metalToGain
          }
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._discardFromHand(playerID, cardSelection[0])
        player.energy += energyToGain
        player.metal += metalToGain
        break
      }

      case 'Concrete Plant': {
        // [X]=[X] + 🔩X -> 📦2
        // Confirm that we have 2 dice of equal value
        let value = activateCards.checkDiceEqual(player.dice, diceSelection, 2)
        if (value === null) {
          return new GameError('Invalid dice selection')
        }
        // Confirm that we have X metal
        if (player.metal < value) {
          return new GameError(`Player does not have ${value} metal to spend`)
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.metal -= value
        this._manufactureGoods(playerID, 2)
        break
      }

      case 'Dojo': {
        // ⚡ -> [?] flip
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6])
        if (value === null) {
          return new GameError('Invalid dice selection')
        }
        if (availableEnergy < 1) {
          return new GameError('Player does not have 1 energy')
        }
        player.energy -= 1
        player.dice[diceSelection[0]] = 7 - value
        break
      }

      case 'Fitness Center': {
        // ⚡ -> [-1]
        let value = activateCards.checkDieValue(player.dice, diceSelection, [2, 3, 4, 5, 6])
        if (value === null) {
          return new GameError('Invalid dice selection')
        }
        if (availableEnergy < 1) {
          return new GameError('Player does not have 1 energy')
        }
        player.energy -= 1
        player.dice[diceSelection[0]] = value - 1
        break
      }

      case 'Foundry': {
        // [X] + ⚡X -> 🔩X
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6])
        if (value === null) {
          return new GameError('Invalid dice selection')
        }
        if (availableEnergy < value) {
          return new GameError(`Player does not have ${value} energy to spend`)
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= value
        player.metal += value
        break
      }

      case 'Fulfillment Center':
        // [4] + ⚡2 -> 📦 + 🔩
        if (activateCards.checkDieValue(player.dice, diceSelection, [4]) === null) {
          return new GameError('Invalid dice selection')
        }
        if (availableEnergy < 2) {
          return new GameError('Player does not have 2 energy to spend')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy -= 2
        player.metal += 1
        this._manufactureGoods(playerID, 1)
        break

      case 'Golem':
        // ⚡X -> [X] gain an extra [?] with a value of X this turn
        if (!isValidDiceValue(energySelection) || availableEnergy < energySelection) {
          return new GameError('Invalid energy selection')
        }
        player.energy -= energySelection
        player.dice.push(energySelection)
        break

      case 'Gymnasium': {
        // ⚡ -> [+1]
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5])
        if (value === null) {
          return new GameError('Invalid dice selection')
        }
        if (availableEnergy < 1) {
          return new GameError('Player does not have 1 energy')
        }
        player.energy -= 1
        console.log('Changing die', diceSelection[0], 'with value', player.dice[diceSelection[0]], 'to', value + 1)
        player.dice[diceSelection[0]] = value + 1
        break
      }

      case 'Harvester':
        // [X]=[X] -> 🔩4 OR [X]=[X] -> ⚡7
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          return new GameError('Invalid dice selection')
        }

        if (rewardSelection === 'Metal') {
          player.metal += 4
        } else if (rewardSelection === 'Energy') {
          player.energy += 7
        } else {
          return new GameError('Invalid reward selection')
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        break

      case 'Incinerator': {
        // 🟦 + 🔩 -> ⚡6
        if (!checkArrayValuesUnique(cardSelection, 1)) {
          return new GameError('Invalid card selection')
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 1) {
          return new GameError(`Expected 1 card selection, got ${cards.length}`)
        }

        if (player.metal < 1) {
          return new GameError('Insufficient metal')
        }

        this._discardFromHand(playerID, cardSelection[0])
        player.metal -= 1
        player.energy += 6
        break
      }

      case 'Manufactory':
        // [X]=[X] -> 📦 + 🔩2 OR 🟦2 OR ⚡3
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          return new GameError('Invalid dice selection')
        }

        if (rewardSelection === 'Metal') {
          player.metal += 2
        } else if (rewardSelection === 'Energy') {
          player.energy += 3
        } else if (rewardSelection === 'Card') {
          if (this.deck.length + this.discard.length < 2) {
            return new GameError('There are not 2 Blueprints available to draw, choose a different reward')
          }
          for (let i = 0; i < 2; i++) {
            this._drawBlueprint(playerID)
          }
        } else {
          return new GameError('Invalid reward selection')
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 1)
        break

      case 'Mega Factory':
        // [X]=[X]=[X] -> 📦2 + [?]* Gain an extra [?] of any value this turn
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 3) === null) {
          return new GameError('Invalid dice selection')
        }

        let diceValToGain = parseInt(rewardSelection, 10)
        if (!isValidDiceValue(diceValToGain)) {
          return new GameError('Invalid die value selected')
        }

        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 2)
        player.dice.push(diceValToGain)
        break

      case 'Motherlode':
        // [1] | [2] | [3] -> 🔩 OR [4] | [5] | [6] -> 🔩2
        if (activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3])) {
          player.metal += 1
        } else if (activateCards.checkDieValue(player.dice, diceSelection, [4, 5, 6])) {
          player.metal += 2
        } else {
          return new GameError('Invalid dice selection')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        break

      case 'Nuclear Plant':
        // [6] -> 📦 + ⚡
        if (activateCards.checkDieValue(player.dice, diceSelection, [6]) === null) {
          return new GameError('Invalid dice selection')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 1)
        player.energy += 1
        break

      case 'Power Plant': {
        // [X] -> ⚡X
        let value = activateCards.checkDieValue(player.dice, diceSelection, [1, 2, 3, 4, 5, 6])
        if (value === null) {
          return new GameError('Invalid dice selection')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        player.energy += value
        break
      }

      case 'Recycling Plant': {
        // 🟦2 + ⚡2 -> 📦 + 🟦
        if (!checkArrayValuesUnique(cardSelection, 2)) {
          return new GameError('Invalid card selection')
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 2) {
          return new GameError(`Expected 2 card selection, got ${cardSelection.length}`)
        }
        if (availableEnergy < 2) {
          return new GameError('Insufficient energy')
        }
        player.energy -= 2
        this._discardFromHand(playerID, cardSelection[0])
        this._discardFromHand(playerID, cardSelection[1])
        this._drawBlueprint(playerID)
        this._manufactureGoods(playerID, 1)
        break
      }

      case 'Refinery': {
        // 🟦 + ⚡3 -> 🔩3
        if (!checkArrayValuesUnique(cardSelection, 1)) {
          return new GameError('Invalid card selection')
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 1) {
          return new GameError(`Expected 1 card selection, got ${cardSelection.length}`)
        }
        if (availableEnergy < 3) {
          return new GameError('Insufficient energy')
        }
        player.energy -= 3
        this._discardFromHand(playerID, cardSelection[0])
        player.metal += 3
        break
      }

      case 'Robot':
        // 🔩 -> Roll an extra [?] this turn
        if (player.metal < 1) {
          return new GameError('Insufficient metal')
        }
        player.metal -= 1
        player.dice.push(randomDice())
        break

      case 'Temp Agency': {
        // ⚡ -> choose 1 or more unplaced [?] and reroll them
        if (!activateCards.checkDiceValid(player.dice, diceSelection)) {
          return new GameError('Invalid dice selection')
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
        if (activateCards.checkDiceEqual(player.dice, diceSelection, 2) === null) {
          return new GameError('Invalid dice selection')
        }
        if (!checkArrayValuesUnique(cardSelection, 2)) {
          return new GameError('Invalid card selection')
        }
        let cards = activateCards.getCards(player.hand, cardSelection)
        if (cards.length !== 2) {
          return new GameError(`Expected 2 card selection, got ${cards.length}`)
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._discardFromHand(playerID, cardSelection[0])
        this._discardFromHand(playerID, cardSelection[1])
        this._manufactureGoods(playerID, 2)
        break
      }

      case 'Warehouse':
        // [?]+[?]+[?] sum must be 14+ -> 📦2 + ⚡2
        if (!activateCards.checkDiceSum(player.dice, diceSelection, 3, 14)) {
          return new GameError('Invalid dice selection')
        }
        activateCards.removeIndicesFromArray(player.dice, diceSelection)
        this._manufactureGoods(playerID, 2)
        player.energy += 2
        break

      default:
        return new GameError(`Cannot activate unknown card "${card.name}"`)
    }

    if (withReplicator) {
      // Spend cost of the Replicator
      player.energy -= 1
    }

    return true
  }
}
