<template>
  <h2>Activate Card</h2>
  <p>Card: {{ cardToActivate.name }}</p>
  <p>Recipe: {{ recipe }}</p>

  <div v-if="requiresMarketplaceSelection" class="card-select-area">
    <p>Select a Blueprint card from the Marketplace</p>
    <div class="selection-area">
      <Card
        v-for="card in gamestate.state.marketplace.blueprints"
        :key="card.id"
        :card="card"
        :class="{
          'valid-div': isSelectedMarketplace(card.id),
        }"
        :isDisabled="!card.activatable || card.name === 'Replicator'"
        @click="selectMarketplace(card.id)"
      />
    </div>
  </div>

  <div v-if="requiresDiceSelection" class="dice-select-area">
    <p>Select your dice</p>
    <div class="selection-area">
      <div
        v-for="(diceval, index) in gamestate.state.players[gamestate.playerID].dice"
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

  <div v-if="requiresCardSelectionNum > 0" class="card-select-area">
    <p>Select Blueprint cards from your hand</p>
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

  <div v-if="requiresEnergySelectionNum > 0" class="resource-select-area">
    <p>Select up to {{ requiresEnergySelectionNum }} Energy</p>
    <div class="selection-area">
      <select name="energy" v-model="this.result.energy">
        <option v-for="n in requiresEnergySelectionNum" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>
  </div>

  <div v-if="requiresRewardSelection" class="resource-select-area">
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
import { gamestate } from '../GameState.js'
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
      recipe: '',
      requiresDiceSelection: false,
      requiresCardSelectionNum: 0,
      requiresEnergySelectionNum: 0,
      requiresRewardSelection: false,
      requiresMarketplaceSelection: false,
    }
  },
  mounted() {
    console.log('New Card in Activate!!!')
    let requirements = this.getSelectionRequirements(this.cardToActivate)
    if (requirements === null) {
      return
    }
    this.recipe = requirements.recipe
    this.requiresDiceSelection = requirements.requiresDiceSelection
    this.requiresCardSelectionNum = requirements.requiresCardSelectionNum
    this.requiresEnergySelectionNum = requirements.requiresEnergySelectionNum
    this.requiresRewardSelection = requirements.requiresRewardSelection
    this.requiresMarketplaceSelection = requirements.requiresMarketplaceSelection
  },
  computed: {
    rewardOptions() {
      if (this.cardToActivate.name === 'Harvester') {
        return ['Metal', 'Energy']
      } else if (this.cardToActivate.name === 'Manufactory') {
        return ['Card', 'Metal', 'Energy']
      } else if (this.cardToActivate.name === 'Mega Factory') {
        return ['1', '2', '3', '4', '5', '6']
      }
      return []
    },
  },
  methods: {
    isSelectedMarketplace(cardID) {
      return this.result.replicate === cardID
    },
    isSelectedDice(diceIndex) {
      return this.result.dice.includes(diceIndex)
    },
    isSelectedCard(cardID) {
      return this.result.cards.includes(parseInt(cardID, 10))
    },
    /**
     * Selects a Blueprint card from the Marketplace to be activated by the Replicator
     */
    selectMarketplace(cardID) {
      console.log('selectMarketplace', cardID)
      if (this.isSelectedMarketplace(cardID)) {
        // If already selected, deselect it
        this.result.replicate = null
        this.requiresDiceSelection = false
        this.requiresCardSelectionNum = 0
        this.requiresEnergySelectionNum = 0
        this.requiresRewardSelection = false
      } else {
        let marketplaceCard = gamestate.state.marketplace.blueprints.find((c) => c.id === cardID)
        if (!marketplaceCard.activatable || marketplaceCard.name === 'Replicator') {
          return
        }
        this.result.replicate = cardID
        console.log('Picked card', marketplaceCard)
        let requirements = this.getSelectionRequirements(marketplaceCard)
        console.log('New requirements', requirements)
        this.requiresDiceSelection = requirements.requiresDiceSelection
        this.requiresCardSelectionNum = requirements.requiresCardSelectionNum
        this.requiresEnergySelectionNum = requirements.requiresEnergySelectionNum
        this.requiresRewardSelection = requirements.requiresRewardSelection
      }
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
        // Golem and Black Market are the only ones requiring this, so safe to clear selection
        this.requiresEnergySelectionNum = 0
      } else if (this.requiresCardSelectionNum === 1) {
        // If only one card is required, replace the current selection
        this.result.cards = [parseInt(cardID, 10)]
        if (this.cardToActivate.name === 'Black Market') {
          // Black Market requires energy selection if the card selected has a cost of 4 or more
          if (gamestate.hand.get(cardID).cost_energy + gamestate.hand.get(cardID).cost_metal > 4) {
            this.requiresEnergySelectionNum = gamestate.hand.get(cardID).cost_energy
          } else {
            this.requiresEnergySelectionNum = 0
          }
        }
      } else {
        // Otherwise, add the card to the selection
        this.result.cards.push(parseInt(cardID, 10))
      }
    },
    /**
     * Determine the selection requirements based on the provided card
     */
    getSelectionRequirements(card) {
      let recipe = 'No Recipe'
      let requiresDiceSelection = false
      let requiresCardSelectionNum = 0
      let requiresEnergySelectionNum = 0
      let requiresRewardSelection = false
      let requiresMarketplaceSelection = false

      recipe = card.recipe
      switch (card.name) {
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
          requiresCardSelectionNum = 1
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
          requiresEnergySelectionNum = Math.min(6, gamestate.playerEnergy())
          break
        case 'Gymnasium':
          requiresDiceSelection = true
          break
        case 'Harvester':
          requiresDiceSelection = true
          requiresRewardSelection = true
          break
        case 'Incinerator':
          requiresCardSelectionNum = 1
          break
        case 'Laboratory':
          break
        case 'Manufactory':
          requiresDiceSelection = true
          requiresRewardSelection = true
          break
        case 'Mega Factory':
          requiresDiceSelection = true
          requiresRewardSelection = true
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
          requiresCardSelectionNum = 2
          break
        case 'Refinery':
          requiresCardSelectionNum = 1
          break
        case 'Replicator':
          requiresMarketplaceSelection = true
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
          requiresCardSelectionNum = 2
          break
        case 'Warehouse':
          requiresDiceSelection = true
          break
        default:
          return null
      }

      return {
        recipe: recipe,
        requiresDiceSelection: requiresDiceSelection,
        requiresCardSelectionNum: requiresCardSelectionNum,
        requiresEnergySelectionNum: requiresEnergySelectionNum,
        requiresRewardSelection: requiresRewardSelection,
        requiresMarketplaceSelection: requiresMarketplaceSelection,
      }
    },
  },
}
</script>
