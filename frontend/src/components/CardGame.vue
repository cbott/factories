<template>
  <p>Player ID: {{ gamestate.playerID }}</p>
  <button @click="gamestate.fillMarketplace">Fill Marketplace</button>
  <Marketplace />
  <DiceArea />
  <PlayerHand />
  <Compound :playerID="gamestate.playerID" />
</template>

<script>
// Game state
import { gamestate } from './GameState.js'

// Components
import Marketplace from './Marketplace.vue';
import PlayerHand from './PlayerHand.vue';
import Compound from './Compound.vue';
import DiceArea from './DiceArea.vue';

// Exports
export default {
  components: {
    Marketplace,
    PlayerHand,
    Compound,
    DiceArea,
  },
  data() {
    return {
      gamestate
    };
  },
  methods: {
  },
  mounted() {
    gamestate.openSocket();
  }
};
</script>

<style scoped>

</style>

<style>
.card-area {
  display: flex;
  flex-wrap: wrap;
}

.card {
  margin: 5px;
  padding: 10px;
  background: lightblue;
  border-radius: 4px;
  width: 100px;
  height: 150px;
}
</style>