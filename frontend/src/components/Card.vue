<!-- Component representing a single Blueprint card -->
<template>
  <div :class="{ disabled: isDisabled }" class="card blueprintcard" v-tooltip="card.recipe">
    <p class="name" :style="{ backgroundColor: color }">{{ card.name }}</p>
    🔩{{ card.cost_metal }}{{ card.name == 'Megalith' ? '*' : '' }} ⚡{{ card.cost_energy }}
    <div class="icon-row">
      <img class="icon" src="/prestige.png" />{{ card.prestige !== null ? card.prestige : '*' }}
    </div>
    <img class="tool-label" :src="getToolImage(card.tool)" :alt="card.tool" />
  </div>
</template>

<script>
import { getToolImage } from '../util.js'

export default {
  props: {
    card: {
      type: Object,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      getToolImage,
    }
  },
  computed: {
    color() {
      switch (this.card.type) {
        case 'production':
          return '#1e78c2'
        case 'utility':
          return '#ffb13d'
        case 'training':
          return '#ff2e17'
        case 'special':
          return '#6c3b9f'
        case 'monument':
          return '#707176'
        default:
          return '#000000'
      }
    },
  },
}
</script>

<style scoped>
.blueprintcard {
  background: #aec9e0;
  padding-left: 0px;
  padding-right: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.disabled {
  background: gray;
}

.name {
  width: 100%;
  color: white;
}

.tool-label {
  width: 25px;
  text-align: center;
}
</style>
