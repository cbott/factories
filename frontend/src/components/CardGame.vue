<template>
  <div v-if="!gamestate.initialized">
    <input v-model="usernameInput" placeholder="Enter username" data-bwignore="true" />
    <button @click="submitUsername">Connect</button>
  </div>

  <template v-if="gamestate.initialized">
    <div class="infobar">
      <div style="display: flex">
        <p>{{ gamestate.state.workPhase ? 'Work' : 'Market' }} Phase</p>
        <div style="margin-left: 10px">
          <button @click="gamestate.requestChangePhase">Change Phase (debug)</button>
        </div>
        <div style="margin-left: 10px">
          <button @click="openEndTurnDialog" :disabled="disableEndTurn">End Turn</button>
        </div>
      </div>

      <div style="display: flex">
        <p>Player ID: {{ gamestate.playerID }}</p>
        <div style="margin-left: 10px">
          <button @click="gamestate.quit">Quit</button>
        </div>
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
          <ModalWindow />
        </div>
      </div>
    </div>
  </template>
</template>

<script>
// Game state
import { gamestate, Actions } from './GameState.js'

// Components
import Compound from './Compound.vue'
import DiceArea from './DiceArea.vue'
import Headquarters from './Headquarters.vue'
import Marketplace from './Marketplace.vue'
import ModalWindow from './ModalWindow.vue'
import OtherPlayers from './OtherPlayers.vue'
import PlayerHand from './PlayerHand.vue'

// Exports
export default {
  components: {
    Compound,
    DiceArea,
    Headquarters,
    Marketplace,
    ModalWindow,
    OtherPlayers,
    PlayerHand,
  },
  data() {
    return {
      gamestate,
      usernameInput: '',
    }
  },
  computed: {
    disableEndTurn() {
      if (!gamestate.initialized) {
        return true
      }
      if (gamestate.state.workPhase && !gamestate.state.players[gamestate.playerID].workDone.hasFinishedWork) {
        return null
      }
      return true
    },
  },
  methods: {
    submitUsername() {
      gamestate.openSocket(this.usernameInput)
    },
    openEndTurnDialog() {
      gamestate.activeAction = Actions.selectTurnEndResources
    },
  },
  mounted() {
    // gamestate.openSocket()
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
