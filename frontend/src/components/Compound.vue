<template>
    <div class="compound">
        <p>Your Compound</p>
        <div class="card-area">
          <Card v-for="card in gamestate.getPlayerCompound(playerID)" :key="card.id" :card="card" />
        </div>
    </div>
</template>

<script>
import { gamestate } from './GameState.js'
import Card from './Card.vue'

export default {
  props: {
    playerID: {
      type: String,
      required: true
    }
  },
  components: {
    Card
  },
  data() {
    return {
      gamestate
    };
  }
};
</script>


<style scoped>
.compound {
  border: 2px solid orange;
  border-radius: 10px;
  width: 500px;
  height: 200px;
  margin: 5px;
}
</style>
