<template>
  <div class="game">
    <p>Player ID: {{ gamestate.playerID }}</p>
    <button @click="gamestate.fillMarketplace">Fill Marketplace</button>
  </div>
</template>

<script>
// TODO: utilize this shared game state
import { gamestate } from './GameState.js'
// <button @click="gamestate.method()">

// Here's what I am thinking
// GardGame will manage setting up the socket, initializing the game
// It will update this in the shared game state.
// We might even be able to store the game state here vs the separate js file
// Each box in the layout is its own component that will import the shared game state
// All methods mutating the game state should be defined in the common file
// This also means those components don't need to have knowledge of the socket I think

export default {
  data() {
    return {
      socket: null,
      hand: [],
      marketplace: [],
      gamestate
    };
  },
  methods: {
  },
  mounted() {
    gamestate.openSocket();
  }
};
</script>

<style scoped>
.hand {
  display: flex;
  flex-wrap: wrap;
}
</style>

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
</style>