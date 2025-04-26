<!-- Marketplace.vue -->
<template>
  <div class="area marketplace" :class="{ 'inactive-area': !isMarketplaceAvailable }">
    <p>
      Marketplace (Deck has {{ gamestate.state.deckSize }} cards, Discard has {{ gamestate.state.discardSize }} cards)
    </p>
    <div class="marketplace-container">
      <div class="horiz-layout">
        <div class="card-area">
          <Card
            v-for="card in gamestate.state.marketplace.blueprints"
            :key="card.id"
            :card="card"
            :class="{
              'valid-div-hover': isMarketplaceAvailable,
            }"
            @click="addToHand(card.id)"
          />
        </div>
        <div class="refresh-buttons">
          <button @click="gamestate.fillMarketplace">Fill Marketplace</button>
          <button @click="gamestate.refreshMarketplace('blueprint', 'energy')">Refresh (⚡)</button>
          <button @click="gamestate.refreshMarketplace('blueprint', 'metal')">Refresh (🔩)</button>
        </div>
      </div>
      <div class="horiz-layout">
        <div class="card-area">
          <div class="card-with-marker" v-for="tool in ['hammer', 'wrench', 'gear', 'shovel']">
            <img class="tool-label" :src="getToolImage(tool)" :alt="tool" />
            <ContractorCard
              v-if="gamestate.state.marketplace.contractors[tool]"
              :key="gamestate.state.marketplace.contractors[tool].id"
              :card="gamestate.state.marketplace.contractors[tool]"
              :class="{
                'valid-div-hover': isMarketplaceAvailable,
              }"
              @click="selectContractor(tool)"
            />
          </div>
        </div>
        <div class="refresh-buttons">
          <button @click="gamestate.refreshMarketplace('contractor', 'energy')">Refresh (⚡)</button>
          <button @click="gamestate.refreshMarketplace('contractor', 'metal')">Refresh (🔩)</button>
        </div>
      </div>
    </div>
  </div>
  <ModalTemplate v-if="showModal" @submit="submitModal" @cancel="cancelModal" :showSubmit="this.modalResult.ok">
    <HireContractor :result="modalResult" :contractorTool="selectedContractorTool" />
  </ModalTemplate>
</template>

<script>
import { gamestate } from '../GameState.js'
import Card from './Card.vue'
import ContractorCard from './ContractorCard.vue'
import HireContractor from './HireContractor.vue'
import ModalTemplate from './ModalTemplate.vue'

export default {
  components: {
    Card,
    ContractorCard,
    ModalTemplate,
    HireContractor,
  },
  data() {
    return {
      gamestate,
      showModal: false,
      selectedContractorTool: null,
      modalResult: {
        // This is the contract that the modal window contents must fulfill
        selectedCard: null,
        selectedPlayer: null,
        ok: false,
      },
    }
  },
  computed: {
    isMarketplaceAvailable() {
      return gamestate.state.workPhase === false && gamestate.state.currentPlayerID === gamestate.playerID
    },
  },
  methods: {
    addToHand(cardID) {
      gamestate.pickUpFromMarketplace(cardID)
    },
    getToolImage(tool) {
      switch (tool) {
        case 'hammer':
          return '/hammer.png'
        case 'wrench':
          return '/wrench.png'
        case 'gear':
          return '/gear.png'
        case 'shovel':
          return '/shovel.png'
        default:
          return ''
      }
    },
    /**
     * Begin the process of hiring a contractor
     *
     * @param contractor {ContractorCard} The contractor card to be selected
     */
    selectContractor(contractorTool) {
      // if (this.isMarketplaceAvailable) {}
      this.selectedContractorTool = contractorTool
      this.showModal = true
    },
    clearResult() {
      this.modalResult = {
        selectedCard: null,
        selectedPlayer: null,
        ok: false,
      }
    },
    cancelModal() {
      this.showModal = false
      this.clearResult()
    },
    submitModal() {
      this.showModal = false
      gamestate.hireContractor(
        this.selectedContractorTool,
        this.modalResult.selectedCard,
        this.modalResult.selectedPlayer,
      )
      this.clearResult()
    },
  },
}
</script>

<style scoped>
.marketplace {
  border-color: green;
  min-height: 200px;
}

.marketplace-container {
  display: flex;
  flex-direction: column;
}

.horiz-layout {
  display: flex;
  flex-direction: row;
}

.refresh-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 120px;
}

.card-with-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tool-label {
  width: 40px;
  text-align: center;
}
</style>
