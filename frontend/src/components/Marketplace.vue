<!-- Marketplace.vue -->
<template>
  <div class="area marketplace">
    <div v-if="!isMarketplaceAvailable" class="marketplace-overlay"></div>
    <div class="marketplace-header">
      <p>MARKETPLACE {{ currentPlayerText }}</p>
    </div>
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
            @click="selectBlueprint(card.id)"
          />
        </div>
        <div class="refresh-buttons">
          <button @click="gamestate.refreshMarketplace('blueprint', 'energy')" :disabled="energyRefreshDisabled">
            Refresh (⚡)
          </button>
          <button @click="gamestate.refreshMarketplace('blueprint', 'metal')" :disabled="metalRefreshDisabled">
            Refresh (🔩)
          </button>
        </div>
        <div class="deck-size">
          <p>Deck: {{ gamestate.state.deckSize }}</p>
          <p>Discard: {{ gamestate.state.discardSize }}</p>
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
          <button @click="gamestate.refreshMarketplace('contractor', 'energy')" :disabled="energyRefreshDisabled">
            Refresh (⚡)
          </button>
          <button @click="gamestate.refreshMarketplace('contractor', 'metal')" :disabled="metalRefreshDisabled">
            Refresh (🔩)
          </button>
        </div>
        <div class="deck-size">
          <p>Deck: {{ gamestate.state.contractorSize }}</p>
          <p>Discard: {{ gamestate.state.contractorDiscardSize }}</p>
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
import { getToolImage } from '../util.js'
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
      getToolImage,
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
    currentPlayerText() {
      if (gamestate.state.workPhase) {
        return ''
      }
      if (gamestate.state.currentPlayerID === gamestate.playerID) {
        return '- Your Turn'
      }
      return `- ${gamestate.state.currentPlayerID}'s Turn`
    },
    refreshDisabled() {
      if (!this.isMarketplaceAvailable || gamestate.state.players[gamestate.playerID].workDone.hasRefreshedCards) {
        return true
      }
      return null
    },
    energyRefreshDisabled() {
      if (gamestate.playerEnergy() < 1) {
        return true
      }
      return this.refreshDisabled
    },
    metalRefreshDisabled() {
      if (gamestate.playerMetal() < 1) {
        return true
      }
      return this.refreshDisabled
    },
  },
  methods: {
    selectBlueprint(cardID) {
      if (this.isMarketplaceAvailable) {
        gamestate.pickUpFromMarketplace(cardID)
      }
    },
    /**
     * Begin the process of hiring a contractor
     *
     * @param contractor {ContractorCard} The contractor card to be selected
     */
    selectContractor(contractorTool) {
      if (this.isMarketplaceAvailable) {
        this.selectedContractorTool = contractorTool
        this.showModal = true
      }
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
  position: relative;
}

.marketplace-header {
  text-align: center;
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

.deck-size {
  padding: 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.marketplace-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent gray */
  z-index: 1; /* Ensure it appears above the content but below tooltips and modal window */
  pointer-events: none; /* Prevent interaction with the overlay */
}
</style>
