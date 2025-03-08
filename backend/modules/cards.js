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
export class BlueprintCard {
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

/**
 * Create a deck of BlueprintCards from a list of card definitions
 * with format { name: 'Aluminum Factory', tool: 'shovel', prestige: 1, copies: 2 ... }
 *
 * @param {Array<Object>} cardDefinitions
 * @returns Array<BlueprintCard>
 */
function buildDeckFromDefinitions(cardDefinitions) {
  let deck = []
  let id = 0
  for (let i = 0; i < cardDefinitions.length; i++) {
    let cardType = cardDefinitions[i]
    for (let copy = 0; copy < cardType.copies; copy++) {
      deck.push(new BlueprintCard(id, cardType.name, cardType.tool, cardType.prestige, cardType.copies))
      id++
    }
  }
  return shuffleArray(deck)
}

/**
 * Create the deck of BlueprintCards from the card definition CSV file
 *
 * @returns {Array<BlueprintCard>} An array of BlueprintCard objects representing the shuffled deck.
 */
export async function buildDeck() {
  const data = await fs.readFile(BLUEPRINT_DEFINITION_CSV, 'utf8')
  return new Promise((resolve, reject) => {
    parse(data, { columns: true }, (err, cardDefinitions) => {
      if (err) {
        console.error('Error parsing the CSV file:', err)
        reject(err)
      } else {
        console.error('Creating deck from file', BLUEPRINT_DEFINITION_CSV)
        resolve(buildDeckFromDefinitions(cardDefinitions))
      }
    })
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
 * @returns {Array<BlueprintCard>} The removed card, or an empty array if not found.
 */
export function removeCardByID(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id == id) {
      return arr.splice(i, 1)
    }
  }
  return []
}
