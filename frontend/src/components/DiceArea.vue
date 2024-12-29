<!-- DiceArea.vue -->
<template>
  <div class="dice-area">
    <p>Your Dice</p>
    <button @click="gamestate.rollDice">Roll Dice</button>
    <div v-for="diceval in myDice" class="die">
      <p>{{ diceval }}</p>
    </div>
  </div>
</template>

<script>
import { gamestate } from './GameState.js'

export default {
  components: {
  },
  computed: {
    // Returns the current player's dice array
    myDice() {
      if (gamestate.state.players == null) {
        return [];
      }
      return gamestate.state.players[gamestate.playerID]?.dice || [];
    }
  },
  data() {
    return {
      gamestate
    };
  },
  methods: {
  }
};
</script>


<style scoped>
.dice-area {
  border: 2px solid black;
  width: 500px;
  height: 50px;
  margin: 10px;
  display: flex;
}

.die {
  width: 40px;
  height: 40px;
  border: 3px solid black;
  border-radius: 5px;
  background-color: ivory;
  text-align: center;
  margin: 3px;
  font-size: 20px;
}
</style>
