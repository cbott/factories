<!-- PlayerHand.vue -->
<template>
  <div class="area hand">
    <div class="hand-header">
      <p>Your Hand</p>
      <button class="sort-toggle" type="button" @click="toggleSort">
        <span :class="{ active: sortMode === 'alpha' }">Alpha</span>
        / <span :class="{ active: sortMode === 'tool' }">Tool</span>
      </button>
    </div>
    <div class="card-area">
      <Card
        v-for="[cardID, card] in sortedHand"
        :key="cardID"
        :card="card"
        :isDisabled="activeCardTool !== '' && activeCardTool !== card.tool"
        :class="{ 'selected-div': isSelectedCard(cardID) }"
        @click="playCard(cardID)"
      />
    </div>
  </div>
</template>

<script>
import { gamestate, Actions } from '../GameState.js'
import Card from './Card.vue'

export default {
  components: {
    Card,
  },
  computed: {
    // The tool of the currently active card
    activeCardTool() {
      if (gamestate.activeAction === Actions.selectMatchingTool) {
        return gamestate.hand.get(gamestate.activeActionTarget)?.tool || ''
      }
      return ''
    },
    sortedHand() {
      const entries = Array.from(gamestate.hand.entries())
      if (this.sortMode === 'tool') {
        return entries.sort(([_, a], [__, b]) => {
          const toolA = (a.tool || '').toString().toLowerCase()
          const toolB = (b.tool || '').toString().toLowerCase()
          if (toolA < toolB) return -1
          if (toolA > toolB) return 1
          const nameA = (a.name || '').toString().toLowerCase()
          const nameB = (b.name || '').toString().toLowerCase()
          if (nameA < nameB) return -1
          if (nameA > nameB) return 1
          return 0
        })
      }
      return entries.sort(([_, a], [__, b]) => {
        const nameA = (a.name || '').toString().toLowerCase()
        const nameB = (b.name || '').toString().toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return 0
      })
    },
  },
  data() {
    return {
      gamestate,
      sortMode: 'alpha',
    }
  },
  methods: {
    /**
     * Toggle the hand sort mode between alphabetical and tool grouping.
     */
    toggleSort() {
      this.sortMode = this.sortMode === 'alpha' ? 'tool' : 'alpha'
    },
    /**
     * Handle card clicks in the player's hand by either playing the card or waiting for a second card selection
     *
     * @param {int} cardID - The ID of the card to select.
     */
    playCard(cardID) {
      if (this.activeCardTool === '') {
        // The player is selecting the card they want to build
        // next the player has to select a card with a matching tool
        gamestate.activeAction = Actions.selectMatchingTool
        gamestate.activeActionTarget = cardID
        return
      }
      // If the player clicks the same card again, cancel out of selection mode
      if (cardID === gamestate.activeActionTarget) {
        gamestate.activeAction = Actions.none
        gamestate.activeActionTarget = null
        return
      }
      // Check if the card has a matching tool
      if (gamestate.hand.get(cardID).tool === this.activeCardTool) {
        // The card has a matching tool, add it to the compound
        gamestate.addToCompoundWithDiscard(gamestate.activeActionTarget, cardID)
        gamestate.activeAction = Actions.none
        gamestate.activeActionTarget = null
      }
    },
    /**
     * Checks if the card with the given ID is currently selected.
     *
     * @param {int} cardID - The ID of the card to check.
     * @returns {boolean} - True if the card is selected, false otherwise.
     */
    isSelectedCard(cardID) {
      return gamestate.activeAction === Actions.selectMatchingTool && gamestate.activeActionTarget === cardID
    },
  },
}
</script>

<style scoped>
.hand {
  border-color: blue;
  min-height: 200px;
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-toggle {
  border: none;
  color: gray;
  cursor: pointer;
  font-size: 0.75rem;
}

.sort-toggle span {
  line-height: 1;
}

.sort-toggle:hover {
  background: transparent;
}

.sort-toggle .active {
  color: black;
  font-weight: 700;
  -webkit-text-stroke: 0.5px lightgreen;
}
</style>
