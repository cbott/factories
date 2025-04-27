<!-- Headquarters.vue -->
<template>
  <div class="headquarters-area">
    <p class="header">HEADQUARTERS</p>

    <div
      v-for="floorname in ['research', 'generate', 'mine']"
      :class="{
        floor: true,
        'valid-div-hover': isValidDieTarget(floorname) === true,
        'invalid-div-hover': isValidDieTarget(floorname) === false,
      }"
      @click="placeDie(floorname)"
    >
      <p>{{ floorname.toUpperCase() }}</p>
      <div class="floor-dice">
        <div v-for="diceval in headquartersContents[floorname]" class="die">
          <p>{{ diceval }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gamestate, Actions } from '../GameState.js'

export default {
  components: {},
  computed: {
    // Returns the current player's headquarters map
    headquartersContents() {
      return gamestate.state.players[gamestate.playerID].headquarters
    },
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    placeDie(floor) {
      if (!this.isValidDieTarget(floor)) {
        // Die cannot be placed here
        return
      }

      // If we have selected a die, the actionTarget is the index of the die in the player's dice array
      gamestate.placeDieInHeadquarters(gamestate.activeActionTarget, floor)

      // Reset the active action
      gamestate.activeAction = Actions.none
      gamestate.activeActionTarget = null
    },

    /**
     * Determines if a given floor is a valid target for placing a die.
     *
     * @param {string} floor - The floor to check for validity.
     * @returns {boolean|null} - Returns true if the floor is a valid target,
     *                           false if it is not, and null if the action is not
     *                           currently selecting a die target or if the floor is invalid.
     */
    isValidDieTarget(floor) {
      if (gamestate.activeAction !== Actions.selectDieTarget) {
        // Only return validity if we're actively looking for a target to place a die
        return null
      }

      if (this.headquartersContents[floor]?.length >= 3) {
        // At most a floor can hold 3 dice
        return false
      }

      if (floor === 'research') {
        // Any dice value can be placed in research
        return true
      }

      // Get dice value from index
      const value = gamestate.state.players[gamestate.playerID].dice[gamestate.activeActionTarget]

      if (floor === 'generate') {
        return value <= 3
      }

      if (floor === 'mine') {
        return value >= 4
      }

      // Invalid floor
      return null
    },
  },
}
</script>

<style scoped>
.headquarters-area {
  border: 2px solid red;
  width: 300px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: center;
}

.floor {
  border: 1px solid black;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Container for displaying dice on a floor */
.floor-dice {
  width: 140px;
  display: flex;
  flex-direction: row;
}

.header {
  background-color: white;
  border: 3px solid black;
}
</style>
