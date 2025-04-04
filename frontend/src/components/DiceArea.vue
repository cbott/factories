<!-- DiceArea.vue -->
<template>
  <div class="area dice-area" :class="{ 'inactive-area': gamestate.state.workPhase !== true }">
    <button @click="gamestate.rollDice">Roll Dice ({{ unrolledDice }})</button>
    <div
      v-for="(diceval, index) in myDice"
      class="die"
      :class="{ 'selected-div': isSelectedDice(index) }"
      @click="activateDie(index)"
    >
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
    unrolledDice() {
      if (gamestate.state.players == null) {
        return 0
      }
      return gamestate.state.players[gamestate.playerID]?.numDice || 0
    },
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    /**
     * Sets die as active action target. Player must click on a valid target to complete the action.
     *
     * @param {int} index - The index in the player's dice array of the die to activate.
     */
    activateDie(index) {
      if (gamestate.activeAction === Actions.selectDieTarget && gamestate.activeActionTarget === index) {
        // If the player clicks the same die again, deselect it
        gamestate.activeAction = Actions.none
        gamestate.activeActionTarget = null
        return
      }
      gamestate.activeAction = Actions.selectDieTarget
      gamestate.activeActionTarget = index
    },
    /**
     * Checks if the die at the given index is currently selected.
     *
     * @param {number} index - The index of the die to check.
     * @returns {boolean} - True if the die is selected, false otherwise.
     */
    isSelectedDice(index) {
      return gamestate.activeAction === Actions.selectDieTarget && gamestate.activeActionTarget === index
    },
  },
}
</script>

<style scoped>
.dice-area {
  border-color: black;
  height: 55px;
  display: flex;
}
</style>
