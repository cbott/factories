<template>
  <template v-if="!playerHasSufficientEnergy">
    <h2>Insufficient energy to hire {{ contractorName.toUpperCase() }}</h2>
  </template>
  <template v-else>
    <div class="card-select-area">
      <h2>Select Card To Discard</h2>
      <div class="selection-area">
        <Card
          v-for="[cardID, card] in gamestate.hand"
          :key="cardID"
          :card="card"
          :isDisabled="card.tool !== contractorTool"
          :class="{
            'valid-div': isSelectedCard(cardID),
          }"
          @click="selectCard(cardID)"
        />
      </div>
    </div>

    <div v-if="requiresPlayerSelection" class="card-select-area">
      <h2>Select a Player</h2>
      <div class="player-selector">
        <div
          v-for="playerID in otherPlayers"
          :key="playerID"
          @click="selectPlayer(playerID)"
          class="player-card"
          :class="{
            'valid-div': isSelectedPlayer(playerID),
          }"
        >
          <p>{{ playerID }}</p>
        </div>
      </div>
    </div>
  </template>
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
    contractorTool: {
      type: String,
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
    otherPlayers() {
      if (gamestate.state.players == null) {
        return []
      }
      return Object.keys(gamestate.state.players).filter((id) => id !== gamestate.playerID)
    },
    contractorName() {
      if (this.contractorTool === null) {
        return ''
      }
      return gamestate.state.marketplace.contractors[this.contractorTool].name.toLowerCase()
    },
    /**
     * Check if the player selection is required to hire this contractor
     *
     * @returns {boolean} True if player selection is required, false otherwise
     */
    requiresPlayerSelection() {
      return ['architect', 'electrician', 'miner'].includes(this.contractorName)
    },
    playerHasSufficientEnergy() {
      if (this.contractorTool === null) {
        return false
      }
      return gamestate.playerEnergy() >= gamestate.state.marketplace.contractors[this.contractorTool].cost_energy
    },
  },
  methods: {
    setOK() {
      let ok = this.result.selectedCard !== null
      if (this.requiresPlayerSelection) {
        ok = ok && this.result.selectedPlayer !== null
      }
      this.result.ok = ok
    },
    selectPlayer(playerID) {
      if (this.isSelectedPlayer(playerID)) {
        // If already selected, deselect it
        this.result.selectedPlayer = null
      } else {
        this.result.selectedPlayer = playerID
      }
      this.setOK()
    },
    isSelectedPlayer(playerID) {
      return this.result.selectedPlayer === playerID
    },
    isSelectedCard(cardID) {
      return this.result.selectedCard === cardID
    },
    selectCard(cardID) {
      if (gamestate.hand.get(cardID).tool !== this.contractorTool) {
        // Selected Blueprint card must have a tool matching this contractor
        return
      }
      if (this.isSelectedCard(cardID)) {
        // If already selected, deselect it
        this.result.selectedCard = null
      } else {
        this.result.selectedCard = cardID
      }
      this.setOK()
    },
  },
}
</script>

<style scoped>
.player-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.player-card {
  background: #d4d4d4;
  width: 100px;
  height: 100px;
  margin: 10px;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
