<!-- DiceArea.vue -->
<template>
  <div class="dice-area">
    <p>Your Dice</p>
    <button @click="gamestate.rollDice">Roll Dice</button>
    <div v-for="(diceval, index) in myDice" class="die" @click="activateDie(index)">
      <p>{{ diceval }}</p>
    </div>
  </div>
</template>

<script>
import { gamestate, Actions } from './GameState.js'

export default {
  components: {},
  computed: {
    // Returns the current player's dice array
    myDice() {
      if (gamestate.state.players == null) {
        return []
      }
      return gamestate.state.players[gamestate.playerID]?.dice || []
    },
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    activateDie(index) {
      // Selects one of the dice. Player must click on a valid target to complete the action
      gamestate.activeAction = Actions.selectDieTarget
      gamestate.activeActionTarget = index
    },
  },
}
</script>

<style scoped>
.dice-area {
  border: 2px solid black;
  width: 500px;
  height: 50px;
  margin: 10px;
  display: flex;
}
</style>
