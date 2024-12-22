<template>
  <header>
    Fantastic Factories Online
  </header>
  <div id="game">
    <CardGame />
    <Marketplace />
    <PlayerHand />
  </div>
</template>

<script>
import CardGame from './components/CardGame.vue';
import Marketplace from './components/Marketplace.vue';
import PlayerHand from './components/PlayerHand.vue';

export default {
  components: {
    CardGame,
    Marketplace,
    PlayerHand
  }
};
</script>

<style scoped>
header {
    text-align: center;
    background-color: #f4f4f4;
    padding: 1rem;
    font-size: 1.5rem;
    font-weight: bold;
}

#game {
    flex: 1;
    background-color: #e8e8e8;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>