export const STARTING_DICE = 4
export const STARTING_HAND_SIZE = 4
const STARTING_ENERGY = 2
const STARTING_METAL = 1

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
    // Resources
    this.energy = STARTING_ENERGY // ⚡
    this.metal = STARTING_METAL // 🔩
    this.prestige = 0 // 🏆
    // Dice played in the Headquarters
    this.headquarters = {
      research: [],
      generate: [],
      mine: [],
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
    this.compound.forEach((card) => {
      card.alreadyActivated = false
    })
  }
}
