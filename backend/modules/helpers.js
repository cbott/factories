// General purpose helper functions

/**
 * Checks whether N unique values are in an array
 *
 * @param {Array<int>} arr - Array of values
 * @param {int} n - The expected number of elements in the array
 * @returns {boolean} Whether or not there are N unique values in the array
 */
export function checkArrayValuesUnique(arr, n) {
  // Check that the expected number of values are present
  if (arr.length !== n) {
    console.log('Expected', n, 'values, got', arr.length)
    return false
  }
  // Check that all array values are unique
  if (new Set(arr).size !== arr.length) {
    console.log('not all values are unique')
    return false
  }
  return true
}

/**
 * Get a random dice roll
 *
 * @returns {int} A random dice value (1-6)
 */
export function randomDice() {
  return Math.ceil(Math.random() * 6)
}

/**
 * Check if a value is a valid dice value
 *
 * @param {int} value - The value to check
 * @returns {boolean} Whether or not the value is a valid dice value
 */
export function isValidDiceValue(value) {
  return Number.isInteger(value) && value >= 1 && value <= 6
}

/**
 * Get an arbitrary "score" for a player for ranking purposes
 *
 * @param {Player} player - The player object to get a score for
 * @returns {int} The player's score
 */
function getPlayerScore(player) {
  let score = 0
  // Once the game ends, each player adds the number of goods they manufactured
  // + the amount of prestige on buildings in their compound to calculate their final score
  score += (player.goods + player.prestige) * 1e6
  // In the event of a tie, the tie breaker is determined first by the player with the most metal resources
  score += player.metal * 1e4
  // then by most energy resources
  score += player.energy * 1e2
  // and finally by most blueprints in hand
  score += Object.keys(player.hand).length
  return score
}

/**
 * Get a human-readable string with the final rankings
 *
 * @param {Object} players - Object mapping player IDs to Player objects
 * @returns {string} A string with the final rankings
 */
export function rankPlayers(players) {
  let rankString = 'Final Rankings:'
  let remainingPlayerIDs = Object.keys(players)

  let rank = 1

  while (remainingPlayerIDs.length > 0) {
    let rankScore = 0
    let rankPlayers = []

    for (const playerID of remainingPlayerIDs) {
      let thisScore = getPlayerScore(players[playerID])
      if (thisScore > rankScore) {
        rankScore = thisScore
        rankPlayers = [playerID]
      } else if (thisScore === rankScore) {
        rankPlayers.push(playerID)
      }
    }

    // Remove the players that are tied for this rank
    remainingPlayerIDs = remainingPlayerIDs.filter((id) => !rankPlayers.includes(id))

    rankString += ` ${rank}.${rankPlayers.join(', ')}`
    rank += rankPlayers.length
  }

  return rankString
}
