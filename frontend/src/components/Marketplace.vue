<!-- Marketplace.vue -->
<template>
  <div class="area marketplace" :class="{ 'inactive-area': gamestate.state.workPhase !== false }">
    <p>Marketplace</p>
    <div class="card-area">
      <Card v-for="card in gamestate.state.marketplace" :key="card.id" :card="card" @click="addToHand(card.id)" />
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
</style>
