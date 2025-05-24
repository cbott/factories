import * as fs from 'fs'
import { parse } from 'csv-parse/sync'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the CSV file containing the definitions for the blueprint cards
export const BLUEPRINT_DEFINITION_CSV = path.join(__dirname, '..', 'resources', 'blueprintcards.csv')
export const CONTRACTOR_DEFINITION_CSV = path.join(__dirname, '..', 'resources', 'contractorcards.csv')

/**
 * Class representing a blueprint card
 *
 * There are 74 of these in the deck
 */
export class BlueprintCard {
  /**
   * Creates an instance of a Blueprint Card.
   *
   * @constructor
   * @param {int} id - A unique identifier for the card in the code.
   * @param {string} name - The name of the card.
   * @param {string} tool - The tool associated with the card.
   * @param {string} type - Card Type (production | utility | training | monument | special).
   * @param {int} prestige - The prestige value of the card.
   * @param {int} cost_metal - Metal cost to build the card.
   * @param {int} cost_energy - Energy cost to build the card.
   * @param {bool} activatable - Whether the card can be manually activated from the compound.
   * @param {string} recipe - Card recipe in plain text.
   * @param {int} copies - The number of copies of this card in the deck.
   */
  constructor(id, name, tool, type, prestige, cost_metal, cost_energy, activatable, recipe, copies) {
    this.id = id
    this.name = name
    this.tool = tool
    this.type = type
    this.copies = copies
    this.cost_metal = cost_metal
    this.cost_energy = cost_energy
    this.prestige = prestige
    // Note: a card may not be activatable either because it is a monument type (no effect)
    // or because it is activated by another action such as acquiring goods (automatic effect)
    this.activatable = activatable
    this.recipe = recipe
    // Whether or not card was activated this round (applies to cards in compound only)
    this.alreadyActivated = false
  }
}

/**
 * Class representing a contractor card
 *
 * There are 17 of these in the deck
 */
export class ContractorCard {
  /**
   * Creates an instance of a Contractor Card.
   *
   * @constructor
   * @param {int} id - A unique identifier for the card in the code.
   * @param {string} name - The name of the card.
   * @param {int} cost_energy - Energy cost to pick up the card.
   * @param {string} short_recipe - Abbreviated recipe to display on the card.
   * @param {string} recipe - Card recipe in plain text.
   * @param {int} copies - The number of copies of this card in the deck.
   */
  constructor(id, name, cost_energy, short_recipe, recipe, copies) {
    this.id = id
    this.name = name
    this.cost_energy = cost_energy
    this.short_recipe = short_recipe
    this.recipe = recipe
    this.copies = copies
  }
}

/**
 * Create a deck of BlueprintCards from a list of card definitions
 * with format { name: 'Aluminum Factory', tool: 'shovel', prestige: 1, copies: 2 ... }
 *
 * @param {Array<Object>} cardDefinitions
 * @returns {Array<BlueprintCard>}
 */
function buildBlueprintDeckFromDefinitions(cardDefinitions) {
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
          cardType.activatable,
          cardType.recipe,
          cardType.copies,
        ),
      )
      id++
    }
  }
  shuffleArray(deck)
  return deck
}

/**
 * Create a deck of ContractorCards from a list of card definitions
 * with format { name: 'Architect', cost_energy: 0 ... }
 *
 * @param {Array<Object>} cardDefinitions
 * @returns {Array<ContractorCard>}
 */
function buildContractorDeckFromDefinitions(cardDefinitions) {
  let deck = []
  let id = 0
  for (let i = 0; i < cardDefinitions.length; i++) {
    let cardType = cardDefinitions[i]
    for (let copy = 0; copy < cardType.copies; copy++) {
      deck.push(
        new ContractorCard(
          id,
          cardType.name,
          cardType.cost_energy,
          cardType.short_recipe,
          cardType.recipe,
          cardType.copies,
        ),
      )
      id++
    }
  }
  shuffleArray(deck)
  return deck
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
  // name, tool, type, and recipe are Strings
  if (['name', 'tool', 'type', 'short_recipe', 'recipe'].includes(context.column)) {
    return value
  }
  // activatable is a Boolean
  if (context.column === 'activatable') {
    return value.toLowerCase() === 'true'
  }
  // All other columns are integers
  return parseInt(value, 10)
}

/**
 * Create the deck of BlueprintCards from the card definition CSV file
 *
 * @param {string} cardDefinitionFile - The path to the CSV file containing card definitions.
 * @param {string} cardType - The type of card to build (one of 'blueprint', 'contractor').
 * @returns {Array<BlueprintCard>} An array of BlueprintCard objects representing the shuffled deck.
 */
export function buildDeck(cardDefinitionFile, cardType) {
  const buildFunc = cardType === 'blueprint' ? buildBlueprintDeckFromDefinitions : buildContractorDeckFromDefinitions

  const data = fs.readFileSync(cardDefinitionFile, 'utf8')
  let cardDefinitions = parse(data, {
    cast: (value, context) => {
      return castCSVValue(value, context)
    },
    columns: true,
  })

  // throw new Error(`Failed to parse CSV file: ${err}`)

  let deck = buildFunc(cardDefinitions)
  console.log('Created deck of', deck.length, 'cards from file', cardDefinitionFile)
  return deck
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
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Retrieves the next card from the deck. If the deck is empty, it reshuffles the discard pile
 * into the deck. If both the deck and discard pile are empty, it returns null.
 *
 * @param {Array} deck - The array representing the current deck of cards.
 * @param {Array} discard - The array representing the discard pile of cards.
 * @returns {BlueprintCard|ContractorCard|null} The next card from the deck, or null if no cards are available.
 */
export function getNextCardFromDeck(deck, discard) {
  if (deck.length === 0) {
    if (discard.length === 0) {
      // No cards left in the deck or discard pile
      return null
    }
    for (let card of discard) {
      deck.push(card)
    }
    // Because we want to modify discard which was passed by reference `discard = []` will not work correctly
    discard.length = 0
    shuffleArray(deck)
  }
  return deck.pop()
}

/**
 * Removes a card from an array by its ID.
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
