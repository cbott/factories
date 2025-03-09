import { promises as fs } from 'fs'
import { parse } from 'csv-parse'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the CSV file containing the definitions for the blueprint cards
const BLUEPRINT_DEFINITION_CSV = path.join(__dirname, '..', 'resources', 'blueprintcards.csv')

/**
 * Class representing a blueprint card
 *
 * There are 74 of these in the deck
 */
export class BlueprintCard {
  /**
   * Creates an instance of a Card.
   *
   * @constructor
   * @param {int} id - A unique identifier for the card in the code.
   * @param {string} name - The name of the card.
   * @param {string} tool - The tool associated with the card.
   * @param {string} type - Card Type (production | utility | training | monument | special).
   * @param {int} prestige - The prestige value of the card.
   * @param {int} cost_metal - Metal cost to build the card.
   * @param {int} cost_energy - Energy cost to build the card.
   * @param {int} copies - The number of copies of this card in the deck.
   */
  constructor(id, name, tool, type, prestige, cost_metal, cost_energy, copies) {
    this.id = id
    this.name = name
    this.tool = tool
    this.type = type
    this.copies = copies
    this.cost_metal = cost_metal
    this.cost_energy = cost_energy
    this.prestige = prestige
  }
}

/**
 * Create a deck of BlueprintCards from a list of card definitions
 * with format { name: 'Aluminum Factory', tool: 'shovel', prestige: 1, copies: 2 ... }
 *
 * @param {Array<Object>} cardDefinitions
 * @returns {Array<BlueprintCard>}
 */
function buildDeckFromDefinitions(cardDefinitions) {
  let deck = []
  let id = 0
  for (let i = 0; i < cardDefinitions.length; i++) {
    let cardType = cardDefinitions[i]
    for (let copy = 0; copy < cardType.copies; copy++) {
      deck.push(
        new BlueprintCard(
          id,
          cardType.name,
          cardType.tool,
          cardType.type,
          cardType.prestige,
          cardType.cost_metal,
          cardType.cost_energy,
          cardType.copies
        )
      )
      id++
    }
  }
  return shuffleArray(deck)
}

/**
 * Casts a CSV value to the appropriate type based on the column it comes from
 *
 * @param {string} value - The value to be cast.
 * @param {Object} context - The csv-parse context.
 * @returns {string|number|null} - The value converted to the correct type.
 */
function castCSVValue(value, context) {
  if (context.header) {
    return value
  }
  if (value === 'null') {
    return null
  }
  if (['name', 'tool', 'type'].includes(context.column)) {
    return value
  }
  return parseInt(value, 10)
}

/**
 * Create the deck of BlueprintCards from the card definition CSV file
 *
 * @returns {Array<BlueprintCard>} An array of BlueprintCard objects representing the shuffled deck.
 */
export async function buildDeck() {
  const data = await fs.readFile(BLUEPRINT_DEFINITION_CSV, 'utf8')
  return new Promise((resolve, reject) => {
    parse(
      data,
      {
        cast: (value, context) => {
          return castCSVValue(value, context)
        },
        columns: true,
      },
      (err, cardDefinitions) => {
        if (err) {
          console.error('Error parsing the CSV file:', err)
          reject(err)
        } else {
          console.log('Creating deck from file', BLUEPRINT_DEFINITION_CSV)
          resolve(buildDeckFromDefinitions(cardDefinitions))
        }
      }
    )
  })
}

/**
 * Returns the total Prestige score for a given array of `BlueprintCard`s
 *
 * @param {Array<BlueprintCard>} arr - The array of cards.
 * @returns {int} The total prestige score
 */
export function calculatePrestige(arr) {
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
export function shuffleArray(array) {
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
 * @returns {BlueprintCard|null} The removed card, or null if not found.
 */
export function removeCardByID(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id == id) {
      return arr.splice(i, 1)[0]
    }
  }
  return null
}
