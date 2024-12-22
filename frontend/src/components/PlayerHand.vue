<template>
    <div class="hand">
        <p>Your Hand</p>
        <div class="card-area">
          <div v-for="card in gamestate.hand" :key="card.id" class="card">
            {{ card.name }}
            {{ card.tool }}
            {{ card.id }}
          </div>
        </div>
    </div>
</template>

<script>
import { gamestate } from './GameState.js'

export default {
  data() {
    return {
      gamestate
    };
  }
};
</script>


<style scoped>
.hand {
  border: 2px solid blue;
  width: 500px;
  height: 200px;
}
</style>
