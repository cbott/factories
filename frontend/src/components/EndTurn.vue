<template>
  <h2>End Your Work Phase</h2>
  <p>Discard down to 12 total resources (metal and energy resources combined) and 10 cards in hand</p>
  <p>{{ gamestate.hand.size }} / 10 Cards</p>
  <p>{{ totalResources }} / 12 Resources</p>

  <div v-if="gamestate.hand.size > 10" class="card-select-area">
    <p>Select Cards To Discard</p>
    <div class="selection-area">
      <Card
        v-for="[cardID, card] in gamestate.hand"
        :key="cardID"
        :card="card"
        :class="{
          'valid-div': isSelectedCard(cardID),
        }"
        @click="selectCard(cardID)"
      />
    </div>
  </div>

  <div v-if="totalResources > 12" class="resource-select-area">
    <p>Select Resources To Discard</p>
    <div class="selection-area">
      <p style="margin-right: 5px">Discard</p>
      <select name="energy" v-model="this.selectedEnergy">
        <option v-for="n in gamestate.playerEnergy() + 1" :key="n" :value="n - 1">{{ n - 1 }}</option>
      </select>
      <p>⚡</p>
      <span style="margin-left: 20px"></span>
      <p style="margin-right: 5px">Discard</p>
      <select name="metal" v-model="this.selectedMetal">
        <option v-for="n in gamestate.playerMetal() + 1" :key="n" :value="n - 1">{{ n - 1 }}</option>
      </select>
      <p>🔩</p>
    </div>
    <p style="margin-top: 10px">Total Selected: {{ resourcesSelected }} / {{ totalResources - 12 }} needed</p>
  </div>

  <button @click="cancel()">Cancel</button>
  <button style="margin-left: 10px" @click="endTurn()">End Turn</button>
</template>

<script>
// Game state
import { gamestate, Actions } from './GameState.js'
import Card from './Card.vue'

// Exports
export default {
  components: {
    Card,
  },
  mounted() {},
  data() {
    let selectedCards = []
    let selectedEnergy = 0
    let selectedMetal = 0
    return {
      gamestate,
      selectedCards,
      selectedEnergy,
      selectedMetal,
    }
  },
  computed: {
    /**
     * Get the total number of resources (energy and metal) the player has
     *
     * @returns {int} The total number of resources
     */
    totalResources() {
      return gamestate.playerEnergy() + gamestate.playerMetal()
    },
    /**
     * Get the total number of resources (energy and metal) the player selected to discard
     *
     * @returns {int} The total of selected energy and metal resources.
     */
    resourcesSelected() {
      return this.selectedEnergy + this.selectedMetal
    },
  },
  methods: {
    cancel() {
      gamestate.activeAction = Actions.none
      gamestate.activeActionTarget = null
      this.selectedCards = []
      this.selectedEnergy = 0
      this.selectedMetal = 0
    },
    endTurn() {
      this.gamestate.requestEndTurn(this.selectedCards, this.selectedEnergy, this.selectedMetal)
      this.cancel()
    },
    isSelectedCard(cardID) {
      return this.selectedCards.includes(parseInt(cardID, 10))
    },
    /**
     * Select cards to be discarded
     *
     * TODO: can we share this between EndTurn and ActivateCard?
     */
    selectCard(cardID) {
      if (this.isSelectedCard(cardID)) {
        // If already selected, deselect it
        this.selectedCards = this.selectedCards.filter((id) => id !== parseInt(cardID, 10))
      } else {
        this.selectedCards.push(parseInt(cardID, 10))
      }
    },
  },
}
</script>

<style scoped>
.card-select-area {
  border: 2px solid black;
  margin: 10px;
}

.resource-select-area {
  border: 2px solid black;
  margin: 10px;
  padding: 10px;
}

.selection-area {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
