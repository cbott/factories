/**
 * Core logic for the game
 */

const { BlueprintCard } = require("./cards");

/**
 * Draws a card from the deck and adds it to the hand.
 *
 * @param {Array<BlueprintCard>} deck - The deck of cards to draw from.
 * @param {Object} hand - The hand where the drawn card will be added
 */
function drawCard(deck, hand){
    if (deck.length) {
        console.log("Drawing card")
        const card = deck.pop();
        hand[card.id] = card;
    }
}

module.exports = { drawCard };
