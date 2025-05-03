<!-- PlayerHand.vue -->
<template>
  <div class="area hand">
    <p>Your Hand</p>
    <div class="card-area">
      <Card
        v-for="[cardID, card] in gamestate.hand"
        :key="cardID"
        :card="card"
        :isDisabled="activeCardTool !== '' && activeCardTool !== card.tool"
        :class="{ 'selected-div': isSelectedCard(cardID) }"
        @click="playCard(cardID)"
      />
    </div>
  </div>
</template>

<script>
import { gamestate, Actions } from '../GameState.js'
import Card from './Card.vue'

export default {
  components: {
    Card,
  },
  computed: {
    // The tool of the currently active card
    activeCardTool() {
      if (gamestate.activeAction === Actions.selectMatchingTool) {
        return gamestate.hand.get(gamestate.activeActionTarget).tool
      }
      return ''
    },
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    /**
     * Handle card clicks in the player's hand by either playing the card or waiting for a second card selection
     *
     * @param {int} cardID - The ID of the card to select.
     */
    playCard(cardID) {
      if (gamestate.activeAction === Actions.none) {
        // No active action, this is the first card selected
        // next the player has to select a card with a matching tool
        gamestate.activeAction = Actions.selectMatchingTool
        gamestate.activeActionTarget = cardID
      } else if (gamestate.activeAction === Actions.selectMatchingTool) {
        // If the player clicks the same card again, cancel out of selection mode
        if (cardID === gamestate.activeActionTarget) {
          gamestate.activeAction = Actions.none
          gamestate.activeActionTarget = null
          return
        }
        // Check if the card has a matching tool
        if (gamestate.hand.get(cardID).tool === this.activeCardTool) {
          // The card has a matching tool, add it to the compound
          gamestate.addToCompoundWithDiscard(gamestate.activeActionTarget, cardID)
          gamestate.activeAction = Actions.none
          gamestate.activeActionTarget = null
        }
      }
    },
    /**
     * Checks if the card with the given ID is currently selected.
     *
     * @param {int} cardID - The ID of the card to check.
     * @returns {boolean} - True if the card is selected, false otherwise.
     */
    isSelectedCard(cardID) {
      return gamestate.activeAction === Actions.selectMatchingTool && gamestate.activeActionTarget === cardID
    },
  },
}
</script>

<style scoped>
.hand {
  border-color: blue;
  min-height: 200px;
}
</style>
