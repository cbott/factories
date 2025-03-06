<!-- PlayerHand.vue -->
<template>
  <div class="hand">
    <p>Your Hand</p>
    <div class="card-area">
      <Card
        v-for="[cardID, card] in gamestate.hand"
        :key="cardID"
        :card="card"
        :isDisabled="activeCardTool !== '' && activeCardTool !== card.tool"
        @click="playCard(cardID)"
      />
    </div>
  </div>
</template>

<script>
import { gamestate, Actions } from './GameState.js'
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
    playCard(cardID) {
      if (gamestate.activeAction === '') {
        // No active action, this is the first card selected
        // next the player has to select a card with a matching tool
        gamestate.activeAction = Actions.selectMatchingTool
        gamestate.activeActionTarget = cardID
        console.log('Selected card with tool:', gamestate.hand.get(cardID).tool)
      } else if (gamestate.activeAction === Actions.selectMatchingTool) {
        // Check if the card has a matching tool
        console.log('checking for matching tool', this.activeCardTool)
        if (
          cardID != gamestate.activeActionTarget &&
          gamestate.hand.get(cardID).tool === this.activeCardTool
        ) {
          // The card has a matching tool, add it to the compound
          gamestate.addToCompoundWithDiscard(gamestate.activeActionTarget, cardID)
          gamestate.activeAction = Actions.none
          gamestate.activeActionTarget = null
          console.log('found matching tool')
        }
      }
    },
  },
}
</script>

<style scoped>
.hand {
  border: 2px solid blue;
  width: 800px;
  height: 200px;
}
</style>
