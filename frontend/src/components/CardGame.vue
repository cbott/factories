<template>
  <div v-if="!initialized">
    <input v-model="usernameInput" placeholder="Enter username" data-bwignore="true" />
    <button @click="submitUsername">Connect</button>
  </div>

  <template v-if="initialized">
    <p>{{ gamestate.state.workPhase ? 'Work' : 'Market' }} Phase | Player ID: {{ gamestate.playerID }}</p>
    <div class="button-container">
      <button @click="gamestate.fillMarketplace">Fill Marketplace</button>
      <button @click="gamestate.requestChangePhase">Change Phase</button>
    </div>

    <div class="container">
      <div class="opponents">
        <OtherPlayers />
      </div>
      <div class="player">
        <Marketplace />
        <DiceArea />
        <PlayerHand />
        <Compound :playerID="gamestate.playerID" />
        <Headquarters />
        <ModalWindow />
      </div>
    </div>
  </template>
</template>

<script>
// Game state
import { gamestate } from './GameState.js'

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
      initialized: false,
    }
  },
  methods: {
    submitUsername() {
      gamestate.openSocket(this.usernameInput)
      this.initialized = true
    },
  },
  mounted() {
    // gamestate.openSocket()
  },
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.opponents {
  flex: 1;
  border: 1px solid black;
  margin: 5px;
}

.player {
  flex: 3;
  border: 1px solid black;
  margin: 5px;
  display: flex;
  flex-direction: column;
}
</style>

<style>
.area {
  border-width: 2px;
  border-style: solid;
  margin: 10px;
}

.card-area {
  display: flex;
  flex-wrap: wrap;
}

.card {
  margin: 5px;
  padding: 10px;
  background: lightblue;
  border-radius: 4px;
  width: 100px;
  height: 150px;
}

.die {
  width: 40px;
  height: 40px;
  border: 3px solid black;
  border-radius: 5px;
  background-color: ivory;
  text-align: center;
  margin: 3px;
  font-size: 20px;
}

.valid-div,
.valid-div-hover:hover {
  box-shadow: inset 0 0 5px rgba(0, 255, 0, 0.8);
}

.invalid-div-hover:hover {
  box-shadow: inset 0 0 5px rgba(255, 0, 0, 0.8);
}

.selected-div {
  box-shadow: inset 0 0 5px rgba(0, 0, 255, 0.8);
}
</style>
