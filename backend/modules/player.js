
/**
 * Represents a player in the game.
 *
 * Game State will track a mapping of player connections to instances of this class
 */
class Player {
  constructor() {
    // Player's hand, indexed by card ID
    this.hand = {};
    // Player's compund
    this.compound = [];
    // Rolled dice that have not yet been used
    this.dice = [];
    // Number of dice available to roll, can be increased with contractor cards
    this.numDice = 4;
    // Resources
    this.energy = 0; // ⚡
    this.metal = 0; // 🔩
    this.prestige = 0; // 🏆
  }
}

module.exports = { Player };
