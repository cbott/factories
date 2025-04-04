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
