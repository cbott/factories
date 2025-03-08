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
      this.drawCard(playerID)
    }
  }

  /**
   * Removes a player from the game and discards all of their cards
   *
   * @param {string} playerID - The ID of the player to remove.
   */
  removePlayer(playerID) {
    for (const cardID of Object.keys(this.players[playerID].hand)) {
      this.removeFromHand(playerID, cardID)
    }
    delete this.players[playerID]
  }

  /**
   * Moves a card from a player's hand to their compound and updates prestige.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be moved.
   */
  moveToCompound(playerID, cardID) {
    // TODO: add validation
    console.log('Moving card', cardID, 'to compound', playerID)
    this.players[playerID].compound.push(this.players[playerID].hand[cardID])
    // Card is moved to compound, now remove it from hand
    delete this.players[playerID].hand[cardID]
    this.players[playerID].prestige = calculatePrestige(this.players[playerID].compound)
  }

  /**
   * Removes a card from a player's hand and adds it to the discard pile.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be removed.
   */
  removeFromHand(playerID, cardID) {
    this.discard.push(this.players[playerID].hand[cardID])
    delete this.players[playerID].hand[cardID]
  }

  /**
   * Draws a card from the deck and adds it to the player's hand.
   *
   * @param {string} playerID - The ID of the player.
   */
  drawCard(playerID) {
    const card = this.getNextCardFromDeck()
    if (card === null) {
      console.log('No cards left in deck')
      return
    }
    console.log('Drawing card')
    this.players[playerID].hand[card.id] = card
  }

  /**
   * Retrieves the next card from the deck, shuffling the discard pile back into the deck if necessary.
   *
   * @returns {BlueprintCard|null} The next card from the deck, or null if no cards are available.
   */
  getNextCardFromDeck() {
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
}
