<template>
  <div id="overlay" v-if="showModal"></div>
  <div id="modal" v-if="showModal">
    <div class="modal-contents">
      <h2>Activate Card</h2>
      <p>Card: {{ gamestate.activeActionTarget.name }}</p>
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

      <div v-if="this.getRecipe.requiresEnergySelection" class="energy-select-area">
        <p>Select 1-{{ golemEnergyOptions }} Energy</p>
        <div class="selection-area">
          <select name="energy" v-model="this.selectedEnergy">
            <option v-for="n in golemEnergyOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>

      <button @click="closeModal()">Cancel</button>
      <button @click="submit()">Activate!</button>
    </div>
  </div>
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
  mounted() {
    // TODO: determine if this actually matters or if initializing in data() is okay
    this.selectedDice = []
  },
  data() {
    let selectedDice = []
    let selectedCards = []
    let selectedEnergy = 0
    return {
      gamestate,
      selectedDice,
      selectedCards,
      selectedEnergy,
    }
  },
  computed: {
    showModal() {
      return gamestate.activeAction === Actions.activateCard
    },
    getRecipe() {
      let recipe = 'No Recipe'
      let requiresDiceSelection = false
      let requiresCardSelection = false
      let requiresEnergySelection = false

      if (this.showModal) {
        recipe = gamestate.activeActionTarget.recipe
        switch (gamestate.activeActionTarget.name) {
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
            break
          case 'Incinerator':
            requiresCardSelection = true
            break
          case 'Laboratory':
            break
          case 'Manufactory':
            requiresDiceSelection = true
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
      }

      return {
        recipe: recipe,
        requiresDiceSelection: requiresDiceSelection,
        requiresCardSelection: requiresCardSelection,
        requiresEnergySelection: requiresEnergySelection,
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
  },
  methods: {
    /**
     * Activate the card
     */
    submit() {
      gamestate.activateCard(
        gamestate.activeActionTarget.id,
        this.selectedDice,
        this.selectedCards,
        this.selectedEnergy,
      )
      this.closeModal()
    },
    closeModal() {
      gamestate.activeAction = Actions.none
      gamestate.activeActionTarget = null
      this.selectedDice = []
      this.selectedCards = []
      this.selectedEnergy = 0
    },
    isSelectedDice(diceIndex) {
      return this.selectedDice.includes(diceIndex)
    },
    isSelectedCard(cardID) {
      return this.selectedCards.includes(parseInt(cardID, 10))
    },
    /**
     * Select a die to be used for activating this card
     * */
    selectDice(diceIndex) {
      this.selectedDice.push(diceIndex)
    },
    /**
     * Select a card to be used for activating this card
     *
     * */
    selectCard(cardID) {
      this.selectedCards.push(parseInt(cardID, 10))
    },
  },
}
</script>

<style scoped>
/* Overlay to darken the background */
#overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Modal container */
#modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 1001; /* Higher than the overlay */
}

.modal-contents {
  text-align: center;
}

.dice-select-area {
  border: 2px solid black;
}

.card-select-area {
  border: 2px solid black;
}

.energy-select-area {
  border: 2px solid black;
}

.selection-area {
  display: flex;
}
</style>
