/**
 * Collection of helper functions for activating unique Blueprints
 */
import { BlueprintCard } from './cards.js'

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
 * Get the selected dice values from the dice array, specified by index
 *
 * @param {Array<int>} diceArray - The array of dice get values from
 * @param {Array<int>} diceSelection - Array of dice indices
 * @returns {Array<int>} Values from the diceArray
 */
function getDiceValues(diceArray, diceSelection) {
  let selectedValues = []
  for (let i = 0; i < diceSelection.length; i++) {
    let diceIndex = diceSelection[i]
    if (diceArray[diceIndex] === undefined) {
      // This is not a valid index into the dice array
      console.log('diceIndex', diceIndex, 'is invalid')
      return []
    }
    selectedValues.push(diceArray[diceIndex])
  }
  console.log('Selected values', selectedValues, 'from diceArray', diceArray, 'by index', diceSelection)
  return selectedValues
}

/**
 * Get the selected cards from a player's hand
 *
 * @param {Object} hand - The player's hand of Blueprint Cards
 * @param {Array<int>} cardSelection - Array of card IDs to get from the hand
 * @returns {Array<BlueprintCard>} The selected cards, empty if selection was invalid
 */
export function getCards(hand, cardSelection) {
  let selectedCards = []
  for (let cardID of cardSelection) {
    if (hand[cardID] === undefined) {
      // This is not a valid card in the hand
      console.log('cardID', cardID, 'is invalid')
      return []
    }
    selectedCards.push(hand[cardID])
  }
  return selectedCards
}

/**
 * Checks that a single die is selected and that die has an acceptable value
 *
 * @param {Array<int>} diceArray - The array of dice to check in
 * @param {Array<int>} diceSelection - Array of dice indices
 * @param {Array<int>} acceptableValues - Array of acceptable values for the die to have
 * @returns {int | null} The value of the die, or null if it is not acceptable
 */
export function checkDieValue(diceArray, diceSelection, acceptableValues) {
  let values = getDiceValues(diceArray, diceSelection)
  if (values.length !== 1) {
    console.log('Got', values.length, 'dice, expected 1')
    return null
  }

  // Check that the selected die has an acceptable value
  if (acceptableValues.includes(values[0])) {
    console.log('Checked die index', diceSelection, 'and got acceptable value', values[0])
    return values[0]
  }

  console.log('Value', values[0], 'is not in', acceptableValues)
  return null
}

/**
 * Checks whether an array of dice indices points to N dice that all have the same value.
 *
 * @param {Array<int>} diceArray - The array of dice to check in
 * @param {Array<int>} diceSelection - Array of dice indices
 * @param {int} numDice - The expected number of dice to check
 * @returns {int | null} The value of the dice, or null if they are not equal
 */
export function checkDiceEqual(diceArray, diceSelection, numDice) {
  if (numDice < 1 || !checkArrayValuesUnique(diceSelection, numDice)) {
    return null
  }
  let values = getDiceValues(diceArray, diceSelection)
  if (!values.length) {
    return null
  }

  // Check that all selected dice have equal value
  if (new Set(values).size !== 1) {
    console.log('Dice values are not equal')
    return null
  }

  return values[0]
}

/**
 * Checks whether an array of dice indices points to N dice that have incrementing values
 * as N, N+1, N+2...
 *
 * @param {Array<int>} diceArray - The array of dice to check in
 * @param {Array<int>} diceSelection - Array of dice indices
 * @param {int} numDice - The expected number of dice to check
 * @returns {boolean} Whether or not the dice all have incrementing values
 */
export function checkDiceSeries(diceArray, diceSelection, numDice) {
  if (!checkArrayValuesUnique(diceSelection, numDice)) {
    return false
  }
  let values = getDiceValues(diceArray, diceSelection)
  if (!values.length) {
    return false
  }

  // Check that selected dice have incrementing values
  values.sort()
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      console.log('Dice values do not form a series')
      return false
    }
  }
  return true
}

/**
 * Checks whether an array of dice indices points to N dice that have a sum >= some value
 *
 * @param {Array<int>} diceArray - The array of dice to check in
 * @param {Array<int>} diceSelection - Array of dice indices
 * @param {int} numDice - The expected number of dice to check
 * @param {int} sum - The dice must sum to be at least this value
 * @returns {boolean} Whether or not the dice all have incrementing values
 */
export function checkDiceSum(diceArray, diceSelection, numDice, sum) {
  if (!checkArrayValuesUnique(diceSelection, numDice)) {
    return false
  }
  let values = getDiceValues(diceArray, diceSelection)
  if (!values.length) {
    return false
  }
  // Check that selected dice have the desired sum
  let count = 0
  values.forEach((x) => (count += x))
  return count >= sum
}

/**
 * Checks whether an array of dice indices all point to valid unique dice in the diceArray
 *
 * @param {Array<int>} diceArray - The array of dice to check in
 * @param {Array<int>} diceSelection - Array of dice indices
 * @returns {boolean} Whether or not all diceSelection indices are valid
 */
export function checkDiceValid(diceArray, diceSelection) {
  // Check that each index is unique
  if (!checkArrayValuesUnique(diceSelection, diceSelection.length)) {
    return false
  }
  // Check that all indices have a valid value in the dice array
  if (!getDiceValues(diceArray, diceSelection).length) {
    return false
  }
  return true
}

/**
 * Removes values from an array by index
 *
 * @param {Array<int>} arr - The array to remove values from
 * @param {Array<int>} indices - The indices to remove
 */
export function removeIndicesFromArray(arr, indices) {
  // Splicing modifies the array so we need to start from the highest index
  indices.sort((a, b) => b - a)
  for (let i = 0; i < indices.length; i++) {
    arr.splice(indices[i], 1)
  }
}
