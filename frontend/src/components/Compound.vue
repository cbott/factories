<template>
  <div class="area compound">
    <p>{{ playerID }}'s Compound</p>
    <div class="score">
      <p>🔩x{{ metal }}</p>
      <p>⚡x{{ energy }}</p>
      <p>🏆x{{ prestige }}</p>
      <p>📦x{{ goods }}</p>
    </div>
    <div class="card-area">
      <Card
        v-for="card in gamestate.getPlayerCompound(playerID)"
        :key="card.id"
        :card="card"
        :class="{
          'valid-div-hover': card.activatable && !card.alreadyActivated && isMainPlayer,
          'invalid-div-hover': (!card.activatable || card.alreadyActivated) && isMainPlayer,
        }"
        :isDisabled="card.alreadyActivated"
        @click="activateCard(card)"
      />
    </div>
  </div>
</template>

<script>
import { Actions, gamestate } from './GameState.js'
import Card from './Card.vue'

export default {
  props: {
    playerID: {
      type: String,
      required: true,
    },
  },
  components: {
    Card,
  },
  computed: {
    energy() {
      if (gamestate.state.players == null) {
        return 0
      }
      return gamestate.state.players[this.playerID].energy
    },
    metal() {
      if (gamestate.state.players == null) {
        return 0
      }
      return gamestate.state.players[this.playerID].metal
    },
    prestige() {
      if (gamestate.state.players == null) {
        return 0
      }
      return gamestate.state.players[this.playerID].prestige
    },
    goods() {
      if (gamestate.state.players == null) {
        return 0
      }
      return gamestate.state.players[this.playerID].goods
    },
    isMainPlayer() {
      return this.playerID === gamestate.playerID && this.playerID !== null
    },
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    activateCard(card) {
      if (!card.activatable || card.alreadyActivated || !this.isMainPlayer) {
        return
      }
      gamestate.activeAction = Actions.activateCard
      gamestate.activeActionTarget = card
    },
  },
}
</script>

<style scoped>
.compound {
  border-color: orange;
  height: 225px;
}
.score {
  display: flex;
}
.score > p {
  margin-left: 5px;
}
</style>
