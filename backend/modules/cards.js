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
 constructor(id, name, tool, copies) {
     this.id = id; // a unique identifier for us to keep track of it in code
     this.name = name;
     this.tool = tool;
     this.copies = copies;
 }
}

const card_setup = [
  {name: "Aluminum Factory", tool: "shovel", copies: 2},
  {name: "Assembly Line", tool: "gear", copies: 2},
  {name: "Battery Factory", tool: "wrench", copies: 2},
  {name: "Beacon", tool: "shovel", copies: 4},
  {name: "Biolab", tool: "gear", copies: 2},
  {name: "Black Market", tool: "gear", copies: 2},
  {name: "Concrete Plant", tool: "shovel", copies: 2},
  {name: "Dojo", tool: "gear", copies: 2},
  {name: "Fitness Center", tool: "wrench", copies: 3},
  {name: "Foundry", tool: "gear", copies: 2},
  {name: "Fulfillment Center", tool: "hammer", copies: 2},
  {name: "Golem", tool: "hammer", copies: 2},
  {name: "Gymnasium", tool: "shovel", copies: 3},
  {name: "Harvester", tool: "hammer", copies: 2},
  {name: "Incinerator", tool: "shovel", copies: 2},
  {name: "Laboratory", tool: "wrench", copies: 2},
  {name: "Manufactory", tool: "wrench", copies: 2},
  {name: "Mega Factory", tool: "gear", copies: 2},
  {name: "Megalith", tool: "wrench", copies: 3},
  {name: "Motherlode", tool: "shovel", copies: 2},
  {name: "Nuclear Plant", tool: "wrench", copies: 2},
  {name: "Obelisk", tool: "hammer", copies: 5},
  {name: "Power Plant", tool: "gear", copies: 2},
  {name: "Recycling Plant", tool: "gear", copies: 3},
  {name: "Refinery", tool: "wrench", copies: 2},
  {name: "Replicator", tool: "shovel", copies: 2},
  {name: "Robot", tool: "hammer", copies: 3},
  {name: "Scrap Yard", tool: "wrench", copies: 2},
  {name: "Solar Array", tool: "gear", copies: 2},
  {name: "Temp Agency", tool: "hammer", copies: 2},
  {name: "Trash Compactor", tool: "shovel", copies: 2},
  {name: "Warehouse", tool: "hammer", copies: 2},
]

function buildDeck() {
  deck = []
  id = 0

  for(let i=0; i<card_setup.length; i++){
    card_type = card_setup[i]
    for(let copy=0; copy<card_type.copies; copy++){
      deck.push(new BlueprintCard(id, card_type.name, card_type.tool, card_type.copies))
      id++
    }
  }

  deck = shuffleArray(deck);

  return deck
}

/**
 * Shuffles the elements of an array in place using the Fisher-Yates algorithm.
 *
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Removes a card from the array by its ID.
 *
 * @param {Array<BlueprintCard>} arr - The array of cards.
 * @param {number} id - The ID of the card to remove.
 * @returns {Array<BlueprintCard>} The removed card, or an empty array if not found.
 */
function removeCardByID(arr, id) {
  for(let i=0; i<arr.length; i++){
    if (arr[i].id == id) {
      return arr.splice(i, 1);
    }
  }
  return [];
}

module.exports = { BlueprintCard, buildDeck, removeCardByID };
