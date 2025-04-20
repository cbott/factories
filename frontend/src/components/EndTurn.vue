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
    <p style="margin-top: 10px">Total Selected: {{ resourcesSelected }} / {{ totalResources - 12 }} needed</p>
  </div>
</template>

<script>
// Game state
import { gamestate } from './GameState.js'
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
    Card,
  },
  mounted() {},
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
