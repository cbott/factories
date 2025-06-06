<template>
  <h2>End Your Work Phase</h2>
  <p v-if="hasUnusedDice" style="font-weight: bold">
    <span style="color: gold">⚠</span> Some dice have not been used!
  </p>
  <p>
    <BooleanIcon :value="gamestate.hand.size <= 10" />
    Discard down to 10 cards in hand ({{ gamestate.hand.size }} / 10)
  </p>
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
    <p style="margin-top: 10px">
      <BooleanIcon :value="result.cards.length >= gamestate.hand.size - 10" />
      Total Selected: {{ result.cards.length }} / {{ gamestate.hand.size - 10 }} needed
    </p>
  </div>

  <p>
    <BooleanIcon :value="totalResources <= 12" />
    Discard down to 12 total resources ({{ totalResources }} / 12)
  </p>
  <div v-if="totalResources > 12" class="resource-select-area">
    <p>Select Resources To Discard</p>
    <div class="selection-area">
      <p style="margin-right: 5px">Discard</p>
      <select name="energy" v-model="this.result.energy">
        <option v-for="n in gamestate.playerEnergy() + 1" :key="n" :value="n - 1">{{ n - 1 }}</option>
      </select>
      <p>⚡</p>
      <span style="margin-left: 20px"></span>
      <p style="margin-right: 5px">Discard</p>
      <select name="metal" v-model="this.result.metal">
        <option v-for="n in gamestate.playerMetal() + 1" :key="n" :value="n - 1">{{ n - 1 }}</option>
      </select>
      <p>🔩</p>
    </div>
    <p style="margin-top: 10px">
      <BooleanIcon :value="resourcesSelected >= totalResources - 12" />
      Total Selected: {{ resourcesSelected }} / {{ totalResources - 12 }} needed
    </p>
  </div>
</template>

<script>
// Game state
import { gamestate } from '../GameState.js'
import BooleanIcon from './BooleanIcon.vue'
import Card from './Card.vue'

// Exports
export default {
  props: {
    result: {
      type: Object,
      required: true,
    },
  },
  components: {
    BooleanIcon,
    Card,
  },
  data() {
    return {
      gamestate,
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
      return this.result.energy + this.result.metal
    },
    hasUnusedDice() {
      return (
        gamestate.state.players[gamestate.playerID].dice.length > 0 ||
        gamestate.state.players[gamestate.playerID].numDice > 0
      )
    },
  },
  methods: {
    isSelectedCard(cardID) {
      return this.result.cards.includes(parseInt(cardID, 10))
    },
    /**
     * Select cards to be discarded
     */
    selectCard(cardID) {
      if (this.isSelectedCard(cardID)) {
        // If already selected, deselect it
        this.result.cards = this.result.cards.filter((id) => id !== parseInt(cardID, 10))
      } else {
        this.result.cards.push(parseInt(cardID, 10))
      }
    },
  },
}
</script>

<style scoped>
.check {
  color: green;
  font-weight: bold;
}
</style>
