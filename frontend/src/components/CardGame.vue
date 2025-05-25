<template>
  <div v-if="!gamestate.initialized">
    <input
      v-model="usernameInput"
      placeholder="Enter username"
      data-bwignore="true"
      @keydown.enter="submitUsername"
      autofocus
    />
    <button @click="submitUsername">Connect</button>
  </div>

  <template v-else>
    <div class="infobar">
      <div class="infobar-element infobar-left" style="">
        <p>Player ID: {{ gamestate.playerID }}</p>
      </div>
      <div class="infobar-element infobar-center">
        <p>
          {{ gamestate.state.workPhase ? 'Work' : 'Market' }} Phase
          {{ gamestate.state.finalRound ? '(Final Round)' : '' }}
        </p>
        <button class="end-button" v-if="!disableEndTurn" @click="confirmEndTurn">End Turn</button>
      </div>
      <div class="infobar-element infobar-right">
        <button @click="gamestate.quit">Quit Game</button>
      </div>
    </div>

    <div class="container-horiz">
      <div class="opponents">
        <OtherPlayers />
      </div>
      <div class="player">
        <div class="container-vert">
          <div class="container-horiz">
            <div class="container-vert">
              <Marketplace />
              <DiceArea />
            </div>
            <Headquarters />
          </div>
          <PlayerHand />
          <Compound :playerID="gamestate.playerID" />
        </div>
      </div>
    </div>
    <ModalTemplate v-if="showModal" @submit="submitModal" @cancel="cancelModal">
      <EndTurn :result="modalResult" />
    </ModalTemplate>

    <ModalTemplate
      v-if="gamestate.messageQueue.length > 0"
      :showSubmit="false"
      :variant="gamestate.messageQueue[0].type"
      cancelText="Alright"
      @cancel="closeMessage"
    >
      <div class="message">
        <p>{{ gamestate.messageQueue[0].message }}</p>
      </div>
    </ModalTemplate>
  </template>
</template>

<script>
// Game state
import { gamestate } from '../GameState.js'

// Components
import Compound from './Compound.vue'
import DiceArea from './DiceArea.vue'
import EndTurn from './EndTurn.vue'
import Headquarters from './Headquarters.vue'
import Marketplace from './Marketplace.vue'
import ModalTemplate from './ModalTemplate.vue'
import OtherPlayers from './OtherPlayers.vue'
import PlayerHand from './PlayerHand.vue'

// Exports
export default {
  components: {
    Compound,
    DiceArea,
    EndTurn,
    Headquarters,
    Marketplace,
    ModalTemplate,
    OtherPlayers,
    PlayerHand,
  },
  data() {
    return {
      gamestate,
      usernameInput: '',
      showModal: false,
      modalResult: {
        cards: [],
        energy: 0,
        metal: 0,
      },
    }
  },
  computed: {
    disableEndTurn() {
      if (!gamestate.initialized) {
        return true
      }
      if (gamestate.state.workPhase && !gamestate.state.players[gamestate.playerID].workDone.hasFinishedWork) {
        return false
      }
      return true
    },
  },
  methods: {
    submitUsername() {
      gamestate.openSocket(this.usernameInput)
    },
    confirmEndTurn() {
      this.modalResult = { cards: [], energy: 0, metal: 0 }
      this.showModal = true
    },
    cancelModal() {
      this.showModal = false
    },
    submitModal() {
      this.showModal = false
      gamestate.requestEndTurn(this.modalResult.cards, this.modalResult.energy, this.modalResult.metal)
    },
    closeMessage() {
      gamestate.messageQueue.shift()
    },
  },
}
</script>

<style scoped>
.infobar {
  display: flex;
  justify-content: space-between;
  font-size: 1.5em;
  width: 100%;
  padding: 0px 10px 0px 10px;
}

.infobar-element {
  flex: 1;
  display: flex;
  align-items: center;
}

.infobar-left {
  justify-content: flex-start;
}

.infobar-center {
  justify-content: center;
}

.infobar-right {
  justify-content: flex-end;
}

.end-button {
  margin-left: 10px;
}

.container-horiz {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}

.container-vert {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
}

.opponents {
  flex: 1;
  margin: 5px;
  text-align: center;
}

.player {
  flex: 3;
  display: flex;
  flex-direction: column;
}
</style>
