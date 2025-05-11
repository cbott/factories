<template>
  <div class="area compound" :class="{ 'work-complete': isWorkComplete }">
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
  <ModalTemplate
    v-if="showModal"
    @submit="submitModal"
    @cancel="cancelModal"
    submitText="Activate"
    :showSubmit="this.modalResult.ok"
  >
    <ActivateCard :result="modalResult" :cardToActivate="cardToActivate" />
  </ModalTemplate>
</template>

<script>
import { gamestate } from '../GameState.js'
import ActivateCard from './ActivateCard.vue'
import Card from './Card.vue'
import ModalTemplate from './ModalTemplate.vue'

export default {
  props: {
    playerID: {
      type: String,
      required: true,
    },
  },
  components: {
    ActivateCard,
    Card,
    ModalTemplate,
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
    isWorkComplete() {
      if (gamestate.state.players === undefined) {
        return false
      }
      return gamestate.state.players[this.playerID].workDone.hasFinishedWork
    },
  },
  data() {
    return {
      gamestate,
      showModal: false,
      modalResult: {
        dice: [],
        cards: [],
        energy: 0,
        reward: '',
        replicate: null,
        ok: false,
      },
      cardToActivate: null,
    }
  },
  methods: {
    activateCard(card) {
      if (!card.activatable || card.alreadyActivated || !this.isMainPlayer) {
        return
      }
      this.cardToActivate = card
      this.modalResult = { dice: [], cards: [], energy: 0, reward: '', replicate: null, ok: false }
      this.showModal = true
    },
    cancelModal() {
      this.showModal = false
    },
    submitModal() {
      gamestate.activateCard(
        this.cardToActivate.id,
        this.modalResult.dice,
        this.modalResult.cards,
        this.modalResult.energy,
        this.modalResult.reward,
        this.modalResult.replicate,
      )
      this.showModal = false
      this.cardToActivate = null
    },
  },
}
</script>

<style scoped>
.compound {
  border-color: orange;
  min-height: 225px;
}

.work-complete {
  background-color: #00ff0022;
}

.score {
  display: flex;
  font-size: 1.2em;
}

.score > p {
  margin-left: 5px;
}
</style>
