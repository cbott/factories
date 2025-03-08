/**
 * Class representing a blueprint card
 *
 * There are 74 of these in the deck
 * Attributes
 * - Name
 * - Build Cost
 * -- Tool
 * -- Metal
 * -- Energy
 * - Card Type (production | utility | training | monument | special)
 * - Prestige Value
 * - Recipe
 * - # of Card Copies
 */
class BlueprintCard {
  constructor(id, name, tool, prestige, copies) {
    this.id = id // a unique identifier for us to keep track of it in code
    this.name = name
    this.tool = tool
    this.copies = copies
    this.cost_metal = 0
    this.cost_energy = 0
    this.prestige = prestige
  }
}

// TODO: we could potentially store all of this in a separate CSV that we load from
const card_setup = [
  { name: 'Aluminum Factory', tool: 'shovel', prestige: 1, copies: 2 },
  { name: 'Assembly Line', tool: 'gear', prestige: 1, copies: 2 },
  { name: 'Battery Factory', tool: 'wrench', prestige: 1, copies: 2 },
  { name: 'Beacon', tool: 'shovel', prestige: null, copies: 4 },
  { name: 'Biolab', tool: 'gear', prestige: 1, copies: 2 },
  // { name: 'Black Market', tool: 'gear', prestige: 1, copies: 2 },
  // { name: 'Concrete Plant', tool: 'shovel', prestige: 1, copies: 2 },
  // { name: 'Dojo', tool: 'gear', prestige: 0, copies: 2 },
  // { name: 'Fitness Center', tool: 'wrench', prestige: 0, copies: 3 },
  // { name: 'Foundry', tool: 'gear', prestige: 1, copies: 2 },
  // { name: 'Fulfillment Center', tool: 'hammer', prestige: 1, copies: 2 },
  // { name: 'Golem', tool: 'hammer', prestige: 1, copies: 2 },
  // { name: 'Gymnasium', tool: 'shovel', prestige: 0, copies: 3 },
  // { name: 'Harvester', tool: 'hammer', prestige: 1, copies: 2 },
  // { name: 'Incinerator', tool: 'shovel', prestige: 1, copies: 2 },
  // { name: 'Laboratory', tool: 'wrench', prestige: 1, copies: 2 },
  // { name: 'Manufactory', tool: 'wrench', prestige: 1, copies: 2 },
  // { name: 'Mega Factory', tool: 'gear', prestige: 1, copies: 2 },
  // { name: 'Megalith', tool: 'wrench', prestige: 3, copies: 3 },
  // { name: 'Motherlode', tool: 'shovel', prestige: 1, copies: 2 },
  // { name: 'Nuclear Plant', tool: 'wrench', prestige: 1, copies: 2 },
  // { name: 'Obelisk', tool: 'hammer', prestige: 2, copies: 5 },
  // { name: 'Power Plant', tool: 'gear', prestige: 1, copies: 2 },
  // { name: 'Recycling Plant', tool: 'gear', prestige: 1, copies: 3 },
  // { name: 'Refinery', tool: 'wrench', prestige: 1, copies: 2 },
  // { name: 'Replicator', tool: 'shovel', prestige: 1, copies: 2 },
  // { name: 'Robot', tool: 'hammer', prestige: 0, copies: 3 },
  // { name: 'Scrap Yard', tool: 'wrench', prestige: 0, copies: 2 },
  // { name: 'Solar Array', tool: 'gear', prestige: 0, copies: 2 },
  // { name: 'Temp Agency', tool: 'hammer', prestige: 0, copies: 2 },
  // { name: 'Trash Compactor', tool: 'shovel', prestige: 1, copies: 2 },
  // { name: 'Warehouse', tool: 'hammer', prestige: 1, copies: 2 },
]

/**
 * Helper function to initialize all Blueprint cards into a deck
 *
 * @returns {Array<BlueprintCard>} An array of BlueprintCard objects representing the shuffled deck.
 */
function buildDeck() {
  deck = []
  id = 0

  for (let i = 0; i < card_setup.length; i++) {
    card_type = card_setup[i]
    for (let copy = 0; copy < card_type.copies; copy++) {
      deck.push(new BlueprintCard(id, card_type.name, card_type.tool, card_type.prestige, card_type.copies))
      id++
    }
  }

  deck = shuffleArray(deck)

  return deck
}

/**
 * Returns the total Prestige score for a given array of `BlueprintCard`s
 *
 * @param {Array<BlueprintCard>} arr - The array of cards.
 * @returns {int} The total prestige score
 */
function calculatePrestige(arr) {
  let totalPrestige = 0
  let beacons = 0
  arr.forEach((card) => {
    if (card.prestige == null) {
      // sentinel value to indicate we're dealing with a beacon and have non-fixed prestige value
      beacons++
    } else {
      // All other cards have a fixed prestige
      totalPrestige += card.prestige
    }
  })

  // Add prestige for beacons
  switch (beacons) {
    case 1:
      // 1st beacon = 2 total
      totalPrestige += 2
      break
    case 2:
      // 2nd beacon = 5 total
      totalPrestige += 5
      break
    case 3:
      // 3rd beacon = 9 total
      totalPrestige += 9
      break
    case 4:
      // 4th beacon = 14 total
      totalPrestige += 14
      break
  }

  return totalPrestige
}

/**
 * Shuffles the elements of an array in place using the Fisher-Yates algorithm.
 *
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Removes a card from the array by its ID.
 *
 * @param {Array<BlueprintCard>} arr - The array of cards.
 * @param {number} id - The ID of the card to remove.
 * @returns {Array<BlueprintCard>} The removed card, or an empty array if not found.
 */
function removeCardByID(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id == id) {
      return arr.splice(i, 1)
    }
  }
  return []
}

module.exports = { BlueprintCard, buildDeck, removeCardByID, calculatePrestige, shuffleArray }
