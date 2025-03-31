<!-- Marketplace.vue -->
<template>
  <div class="area marketplace" :class="{ 'inactive-area': gamestate.state.workPhase !== false }">
    <p>
      Marketplace (Deck has {{ gamestate.state.deckSize }} cards, Discard has {{ gamestate.state.discardSize }} cards)
    </p>
    <div class="marketplace-container">
      <div class="refresh-buttons">
        <button @click="gamestate.fillMarketplace">Fill Marketplace</button>
        <button @click="gamestate.refreshMarketplaceBlueprints('energy')">Refresh (⚡)</button>
        <button @click="gamestate.refreshMarketplaceBlueprints('metal')">Refresh (🔩)</button>
      </div>
      <div class="card-area">
        <Card v-for="card in gamestate.state.marketplace" :key="card.id" :card="card" @click="addToHand(card.id)" />
      </div>
    </div>
  </div>
</template>

<script>
import { gamestate } from './GameState.js'
import Card from './Card.vue'

export default {
  components: {
    Card,
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    addToHand(cardID) {
      gamestate.pickUpFromMarketplace(cardID)
    },
  },
}
</script>

<style scoped>
.marketplace {
  border-color: green;
  height: 200px;
}

.marketplace-container {
  display: flex;
  flex-direction: row;
}

.refresh-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
