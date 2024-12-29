<template>
  <div class="compound">
    <p>Your Compound</p>
      <div class="score">
        <p>⚡x{{ energy }}</p>
        <p>🔩x{{ metal }}</p>
        <p>🏆x{{ prestige }}</p>
      </div>
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
  computed: {
    energy() {
      if(gamestate.state.players == null){
        return 0;
      }
      return this.gamestate.state.players[this.playerID].energy;
    },
    metal() {
      if(gamestate.state.players == null){
        return 0;
      }
      return this.gamestate.state.players[this.playerID].metal;
    },
    prestige() {
      if(gamestate.state.players == null){
        return 0;
      }
      return this.gamestate.state.players[this.playerID].prestige;
    }
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
  height: 225px;
  margin: 5px;
}
.score {
  display: flex;
}
.score > p {
  margin-left: 5px;
}
</style>
