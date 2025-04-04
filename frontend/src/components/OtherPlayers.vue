<template>
  <p>Opponents</p>
  <div class="opponent" v-for="playerID in otherIDs" :key="playerID">
    <Compound :playerID="playerID" />
  </div>
</template>

<script>
// Game state
import { gamestate } from './GameState.js'

// Components
import Compound from './Compound.vue'

// Exports
export default {
  components: {
    Compound,
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {},
  computed: {
    otherIDs() {
      if (gamestate.state.players == null) {
        return []
      }
      return Object.keys(gamestate.state.players).filter((id) => id !== gamestate.playerID)
    },
  },
}
</script>

<style scoped>
.opponent {
  zoom: 0.75;
}
</style>
