<template>
  <h2>Activate Card</h2>
  <p>Card: {{ cardToActivate.name }}</p>
  <p>Recipe: {{ this.getRecipe.recipe }}</p>
  <div v-if="this.getRecipe.requiresDiceSelection" class="dice-select-area">
    <p>Select your dice</p>
    <div class="selection-area">
      <div
        v-for="(diceval, index) in myDice"
        class="die"
        :class="{
          'valid-div': isSelectedDice(index),
        }"
        @click="selectDice(index)"
      >
        <p>{{ diceval }}</p>
      </div>
    </div>
  </div>

  <div v-if="this.getRecipe.requiresCardSelection" class="card-select-area">
    <p>Select your cards</p>
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

  <div v-if="this.getRecipe.requiresEnergySelection" class="resource-select-area">
    <p>Select 1-{{ golemEnergyOptions }} Energy</p>
    <div class="selection-area">
      <select name="energy" v-model="this.result.energy">
        <option v-for="n in golemEnergyOptions" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>
  </div>

  <div v-if="this.getRecipe.requiresRewardSelection" class="resource-select-area">
    <p>Select Reward</p>
    <div class="selection-area">
      <div v-for="n in rewardOptions" :key="n">
        <input type="radio" :id="n" :value="n" name="reward" v-model="this.result.reward" />
        <label style="margin-right: 15px; margin-left: 3px" :for="n">{{ n }}</label>
      </div>
    </div>
  </div>
</template>

<script>
// Game state
import { gamestate } from './GameState.js'
import Card from './Card.vue'

// Exports
export default {
  props: {
    // Return value
    result: {
      type: Object,
      required: true,
    },
    // The Blueprint card we are activating
    cardToActivate: {
      type: Object,
      required: true,
    },
  },
  components: {
    Card,
  },
  data() {
    return {
      gamestate,
    }
  },
  computed: {
    getRecipe() {
      let recipe = 'No Recipe'
      let requiresDiceSelection = false
      let requiresCardSelection = false
      let requiresEnergySelection = false
      let requiresRewardSelection = false

      recipe = this.cardToActivate.recipe
      switch (this.cardToActivate.name) {
        case 'Aluminum Factory':
          requiresDiceSelection = true
          break
        case 'Assembly Line':
          requiresDiceSelection = true
          break
        case 'Battery Factory':
          break
        case 'Beacon':
          break
        case 'Biolab':
          requiresDiceSelection = true
          break
        case 'Black Market':
          requiresDiceSelection = true
          requiresCardSelection = true
          break
        case 'Concrete Plant':
          requiresDiceSelection = true
          break
        case 'Dojo':
          requiresDiceSelection = true
          break
        case 'Fitness Center':
          requiresDiceSelection = true
          break
        case 'Foundry':
          requiresDiceSelection = true
          break
        case 'Fulfillment Center':
          requiresDiceSelection = true
          break
        case 'Golem':
          requiresEnergySelection = true
          break
        case 'Gymnasium':
          requiresDiceSelection = true
          break
        case 'Harvester':
          requiresDiceSelection = true
          requiresRewardSelection = true
          break
        case 'Incinerator':
          requiresCardSelection = true
          break
        case 'Laboratory':
          break
        case 'Manufactory':
          requiresDiceSelection = true
          requiresRewardSelection = true
          break
        case 'Mega Factory':
          requiresDiceSelection = true
          break
        case 'Megalith':
          break
        case 'Motherlode':
          requiresDiceSelection = true
          break
        case 'Nuclear Plant':
          requiresDiceSelection = true
          break
        case 'Obelisk':
          break
        case 'Power Plant':
          requiresDiceSelection = true
          break
        case 'Recycling Plant':
          requiresCardSelection = true
          break
        case 'Refinery':
          requiresCardSelection = true
          break
        case 'Replicator':
          break
        case 'Robot':
          break
        case 'Scrap Yard':
          break
        case 'Solar Array':
          break
        case 'Temp Agency':
          requiresDiceSelection = true
          break
        case 'Trash Compactor':
          requiresDiceSelection = true
          requiresCardSelection = true
          break
        case 'Warehouse':
          requiresDiceSelection = true
          break
      }

      return {
        recipe: recipe,
        requiresDiceSelection: requiresDiceSelection,
        requiresCardSelection: requiresCardSelection,
        requiresEnergySelection: requiresEnergySelection,
        requiresRewardSelection: requiresRewardSelection,
      }
    },
    // TODO: reduce duplication with Compound
    golemEnergyOptions() {
      if (gamestate.state.players == null) {
        return 0
      }
      // Golem can use up to 6 energy
      return Math.min(6, gamestate.state.players[gamestate.playerID].energy)
    },
    // Returns the current player's dice array
    // TODO: reduce duplication with DiceArea
    myDice() {
      if (gamestate.state.players == null) {
        return []
      }
      return gamestate.state.players[gamestate.playerID]?.dice || []
    },
    rewardOptions() {
      if (this.cardToActivate.name === 'Harvester') {
        return ['Metal', 'Energy']
      }
      return ['Card', 'Metal', 'Energy']
    },
  },
  methods: {
    isSelectedDice(diceIndex) {
      return this.result.dice.includes(diceIndex)
    },
    isSelectedCard(cardID) {
      return this.result.cards.includes(parseInt(cardID, 10))
    },
    /**
     * Select a die to be used for activating this card
     */
    selectDice(diceIndex) {
      if (this.isSelectedDice(diceIndex)) {
        // If already selected, deselect it
        this.result.dice = this.result.dice.filter((id) => id !== diceIndex)
      } else {
        this.result.dice.push(diceIndex)
      }
    },
    /**
     * Select a card to be used for activating this card
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
