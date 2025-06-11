<!-- Component representing a single Blueprint card -->
<template>
  <div
    :class="{ disabled: isDisabled }"
    class="card blueprintcard"
    v-tooltip="card.recipe"
    :style="{ backgroundImage: `url(/${this.card.type}.png)` }"
  >
    <p class="name" :style="{ backgroundColor: color }">{{ card.name }}</p>
    <div class="recipe-container card-box">
      <p class="recipe">{{ card.short_recipe }}</p>
    </div>
    <div class="icon-row icon-text">
      <img class="icon spacing" :src="getToolImage(card.tool)" :alt="card.tool" />
      <img class="icon" src="/prestige.png" />
      <p class="spacing">{{ card.prestige !== null ? card.prestige : '*' }}</p>
      <p>🔩{{ card.cost_metal }}{{ card.name == 'Megalith' ? '*' : '' }}</p>
      <p>⚡{{ card.cost_energy }}</p>
    </div>
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
  padding-top: 5px;
  padding-bottom: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.disabled {
  opacity: 0.5;
}

.cost {
  background-color: white;
}

.name {
  width: 100%;
  color: white;
}

.spacing {
  margin-right: 3px;
}
</style>
