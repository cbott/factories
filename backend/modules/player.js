export const STARTING_DICE = 4
export const STARTING_HAND_SIZE = 4
const STARTING_ENERGY = 20
const STARTING_METAL = 10

/**
 * Represents a player in the game.
 *
 * Game State will track a mapping of player connections to instances of this class
 */
export class Player {
  constructor() {
    // Player's hand, indexed by card ID {cardID: BlueprintCard}
    this.hand = {}
    // Player's compund
    this.compound = []
    // Rolled dice that have not yet been used
    this.dice = []
    // Number of dice available to roll, can be increased with contractor cards
    this.numDice = STARTING_DICE
    // Whether the player can manually select dice values (Foreman contractor card)
    this.selectableDice = false
    // Whether the player can gain an extra dice of their choice (Specialist contractor card)
    this.bonusDie = false
    // Resources
    this.energy = STARTING_ENERGY // ⚡
    this.metal = STARTING_METAL // 🔩
    this.prestige = 0 // 🏆
    this.goods = 0 // 📦
    // Dice played in the Headquarters
    this.headquarters = {
      research: [],
      generate: [],
      mine: [],
    }
    this.workDone = {
      hasRefreshedCards: false,
      hasDrawnCard: false,
      hasFinishedWork: false,
    }
  }

  /**
   * Clear the player's hand and headquarters for the start of the next round.
   */
  resetRound() {
    this.dice = []
    this.headquarters.research = []
    this.headquarters.generate = []
    this.headquarters.mine = []
    this.numDice = STARTING_DICE
    this.selectableDice = false
    this.bonusDie = false
    this.compound.forEach((card) => {
      card.alreadyActivated = false
    })
    this.workDone.hasRefreshedCards = false
    this.workDone.hasDrawnCard = false
    this.workDone.hasFinishedWork = false
  }

  /**
   * Counts the number of cards of type 'monument' in the compound.
   *
   * @returns {int} The total count of 'monument' cards in the compound.
   */
  monumentsInCompound() {
    return this.compound.filter((card) => card.type === 'monument').length
  }

  /**
   * Check player compound for unactivated blueprint card with a given name and mark it as activated.
   *
   * @param {string} cardName - The name of the card to search for.
   * @returns {boolean} True if a card with the given name exists in the compound and was able to be activated.
   */
  markCardNameActivated(cardName) {
    for (let card of this.compound) {
      if (card.name === cardName && !card.alreadyActivated) {
        console.log('Marking card', card.id, 'as activated')
        card.alreadyActivated = true
        return true
      }
    }
    return false
  }
}
