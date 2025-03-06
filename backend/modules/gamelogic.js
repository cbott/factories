/**
 * Core logic for the game
 */

const { BlueprintCard, buildDeck, calculatePrestige } = require('./cards')

class GameState {
  constructor() {
    this.deck = buildDeck()
    this.marketplace = []
    // `players` object maps session IDs to instances of the Player class
    this.players = {}
  }
  // Can we define a getter for the class that would return the serializable object that we want
  // to send to the front end? This would let us have some backend-only attributes.
  // May not need to do this but will have to experiment with what socket.io can handle.

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
   * Removes a card from a player's hand.
   *
   * @param {string} playerID - The ID of the player.
   * @param {int} cardID - The ID of the card to be removed.
   */
  removeFromHand(playerID, cardID) {
    // TODO: implement discard pile
    delete this.players[playerID].hand[cardID]
  }
}

/**
 * Draws a card from the deck and adds it to the hand.
 *
 * @param {Array<BlueprintCard>} deck - The deck of cards to draw from.
 * @param {Object} hand - The hand where the drawn card will be added
 */
function drawCard(deck, hand) {
  if (deck.length) {
    console.log('Drawing card')
    const card = deck.pop()
    hand[card.id] = card
  }
}

module.exports = { GameState, drawCard }
