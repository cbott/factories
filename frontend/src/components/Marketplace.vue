<template>
    <div class="marketplace">
        <p>Marketplace</p>
        <div class="card-area">
          <div v-for="card in gamestate.state.marketplace" :key="card.id" class="card" @click="addToHand(card.id)">
            {{ card.name }}
            {{ card.tool }}
            {{ card.id }}
          </div>
        </div>
    </div>
</template>

<script>
import { gamestate } from './GameState.js'

export default {
  data() {
    return {
      gamestate
    };
  },
  methods: {
    addToHand(cardID) {
      gamestate.pickUpFromMarketplace(cardID);
    }
  }
};
</script>

<style scoped>
.marketplace {
  border: 2px solid green;
  width: 500px;
  height: 200px;
  margin: 10px;
}
</style>

