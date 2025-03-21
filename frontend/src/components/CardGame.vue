<template>
  <p>{{ gamestate.state.workPhase ? 'Work' : 'Market' }} Phase | Player ID: {{ gamestate.playerID }}</p>
  <div class="button-container">
    <button @click="gamestate.fillMarketplace">Fill Marketplace</button>
    <button @click="gamestate.requestChangePhase">Change Phase</button>
  </div>
  <Marketplace />
  <DiceArea />
  <PlayerHand />
  <Compound :playerID="gamestate.playerID" />
  <Headquarters />
  <ModalWindow />
</template>

<script>
// Game state
import { gamestate } from './GameState.js'

// Components
import Marketplace from './Marketplace.vue'
import PlayerHand from './PlayerHand.vue'
import Compound from './Compound.vue'
import DiceArea from './DiceArea.vue'
import Headquarters from './Headquarters.vue'
import ModalWindow from './ModalWindow.vue'

// Exports
export default {
  components: {
    Marketplace,
    PlayerHand,
    Compound,
    DiceArea,
    Headquarters,
    ModalWindow,
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {},
  mounted() {
    gamestate.openSocket()
  },
}
</script>

<style scoped></style>

<style>
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

.valid-div {
  box-shadow: inset 0 0 5px rgba(0, 255, 0, 0.8);
}

.valid-div-hover:hover {
  box-shadow: inset 0 0 5px rgba(0, 255, 0, 0.8);
}

.invalid-div-hover:hover {
  box-shadow: inset 0 0 5px rgba(255, 0, 0, 0.8);
}
</style>
