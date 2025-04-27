<!-- DiceArea.vue -->
<template>
  <div class="area dice-area" :class="{ 'inactive-area': gamestate.state.workPhase !== true }">
    <button v-if="canSelectDice" @click="chooseAllDice()">Select Dice</button>
    <button v-else @click="gamestate.rollDice">Roll Dice ({{ unrolledDice }})</button>
    <button v-if="hasBonusDie" @click="chooseOneDice()">Choose 1 Value</button>
    <div
      v-for="(diceval, index) in myDice"
      class="die"
      :class="{ 'selected-div': isSelectedDice(index) }"
      @click="activateDie(index)"
    >
      <p>{{ diceval }}</p>
    </div>
  </div>

  <ModalTemplate v-if="showModal" @submit="submitModal" @cancel="cancelModal">
    <div v-for="n in diceToSelect" :key="n" class="selection-area dice-select-area">
      <p style="margin-right: 20px">Select dice value {{ n }}</p>
      <div
        v-for="val in 6"
        class="die"
        :class="{ 'selected-div': selectedDice[n - 1] === val }"
        @click="selectedDice[n - 1] = val"
      >
        <p>{{ val }}</p>
      </div>
    </div>
  </ModalTemplate>
</template>

<script>
import { gamestate, Actions } from '../GameState.js'
import ModalTemplate from './ModalTemplate.vue'

export default {
  components: {
    ModalTemplate,
  },
  computed: {
    // Returns the current player's dice array
    myDice() {
      return gamestate.state.players[gamestate.playerID].dice
    },
    unrolledDice() {
      return gamestate.state.players[gamestate.playerID].numDice
    },
    canSelectDice() {
      return gamestate.state.players[gamestate.playerID].selectableDice
    },
    hasBonusDie() {
      return gamestate.state.players[gamestate.playerID].bonusDie
    },
  },
  data() {
    return {
      gamestate,
      showModal: false,
      diceToSelect: 0,
      selectedDice: [null, null, null, null],
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
    chooseAllDice() {
      this.showModal = true
      this.diceToSelect = Math.min(4, gamestate.state.players[gamestate.playerID].numDice)
      console.log('Selecting', this.diceToSelect, 'dice')
    },
    chooseOneDice() {
      this.showModal = true
      this.diceToSelect = 1
    },
    cancelModal() {
      this.showModal = false
      this.selectedDice = []
    },
    submitModal() {
      this.showModal = false
      if (this.diceToSelect === 1) {
        gamestate.gainDiceValue(this.selectedDice[0])
      } else {
        gamestate.chooseDice(this.selectedDice.filter((val) => val !== null))
      }
      this.selectedDice = []
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
