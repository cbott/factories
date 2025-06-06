<template>
  <div id="overlay"></div>
  <div id="modal" :style="variantStyle">
    <div v-if="variantIcon" class="modal-top-icon">
      {{ variantIcon }}
    </div>
    <div class="modal-contents">
      <slot></slot>
    </div>
    <div class="modal-footer">
      <hr />
      <button class="action-button" @click="cancel()">{{ cancelText }}</button>
      <button v-if="showSubmit" class="action-button" @click="submit()">{{ submitText }}</button>
    </div>
  </div>
</template>

<script>
// Game state
import { gamestate } from '../GameState.js'

const VARIANTS = {
  info: { icon: '🛈', color: 'cyan' },
  warning: { icon: '⚠', color: 'gold' },
  error: { icon: '❌', color: 'red' },
}

// Exports
export default {
  emits: ['submit', 'cancel'],
  props: {
    submitText: {
      type: String,
      default: 'Submit',
    },
    cancelText: {
      type: String,
      default: 'Cancel',
    },
    showSubmit: {
      type: Boolean,
      default: true,
    },
    variant: {
      type: String,
      default: '',
    },
  },
  computed: {
    variantIcon() {
      return VARIANTS[this.variant]?.icon
    },
    variantStyle() {
      if (!VARIANTS[this.variant]) return {}

      return {
        borderColor: VARIANTS[this.variant].color,
      }
    },
  },
  data() {
    return {
      gamestate,
    }
  },
  methods: {
    cancel() {
      this.$emit('cancel')
    },
    submit() {
      this.$emit('submit')
    },
  },
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
  width: 90%;
  border: 5px solid gold;
}

.modal-top-icon {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
  margin-top: -20px;
}

.modal-contents {
  text-align: center;
}

.modal-footer {
  text-align: center;
  margin-top: 20px;
}

.action-button {
  margin: 3px;
}
</style>
