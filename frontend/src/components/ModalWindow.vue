<template>
  <div id="overlay" v-if="showModal"></div>
  <div id="modal" v-if="showModal">
    <div class="modal-contents">
      <ActivateCard v-if="showActivateCard" />
      <EndTurn v-if="showEndTurn" />
    </div>
  </div>
</template>

<script>
// TODO: leaving off here // I think what we want to do is make this more general, // we should pass in a prop
// which selects which component to show within the modal // Select between "activate card" and "discard extra stuff"
// windows // and then it's more flexible if we have a future use case // probably the sub-component will have the
// submit buttons even, except a close dialog option?

// Game state
import { gamestate, Actions } from './GameState.js'
import ActivateCard from './ActivateCard.vue'
import EndTurn from './EndTurn.vue'

// Exports
export default {
  components: {
    ActivateCard,
    EndTurn,
  },
  data() {
    return {
      gamestate,
    }
  },
  computed: {
    showModal() {
      return [Actions.activateCard, Actions.selectTurnEndResources].includes(gamestate.activeAction)
    },
    showActivateCard() {
      return gamestate.activeAction === Actions.activateCard
    },
    showEndTurn() {
      return gamestate.activeAction === Actions.selectTurnEndResources
    },
  },
  methods: {},
}
</script>

<style scoped>
/* Overlay to darken the background */
#overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Modal container */
#modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 1001; /* Higher than the overlay */
}

.modal-contents {
  text-align: center;
}
</style>
