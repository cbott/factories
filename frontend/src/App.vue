<template>
  <header>Fantastic Factories Online</header>
  <div id="game">
    <CardGame />
  </div>
</template>

<script>
import CardGame from './components/CardGame.vue'

export default {
  components: {
    CardGame,
  },
}
</script>

<style scoped>
header {
  text-align: center;
  background-color: #f4f4f4;
  padding: 0.1rem;
  font-size: 1.5rem;
  font-weight: bold;
}

#game {
  flex: 1;
  background-color: #e8e8e8;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
