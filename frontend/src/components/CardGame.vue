<template>
  <div class="game">
    <button @click="drawCard">Draw Card</button>
    <div class="hand">
      <h2>Your Hand:</h2>
      <div v-for="card in hand" :key="card.id" class="card">
        {{ card.name }}
        {{ card.tool }}
      </div>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      socket: null,
      hand: [],
      gameState: {}
    };
  },
  methods: {
    drawCard() {
      this.socket.emit('draw-card');
    }
  },
  mounted() {
    this.socket = io("http://localhost:3000");
    this.socket.on('game-state', (state) => {
      this.gameState = state;
      this.hand = state.players[this.socket.id]?.hand || [];
    });
  }
};
</script>

<style scoped>
.hand {
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
