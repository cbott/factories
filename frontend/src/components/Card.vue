<!-- Component representing a single Blueprint card -->
<template>
  <div class="tooltip">
    <div :class="{ disabled: isDisabled }" class="card blueprintcard">
      {{ card.name }}
      <br />
      🔩{{ card.cost_metal }}{{ card.name == 'Megalith' ? '*' : '' }} ⚡{{ card.cost_energy }} 🏆{{
        card.prestige !== null ? card.prestige : '?'
      }}
      <br />
      ({{ card.tool }})
    </div>
    <span class="tooltiptext">{{ card.recipe }}</span>
  </div>
</template>

<script>
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
}
</script>

<style scoped>
.blueprintcard {
  background: #aec9e0;
}

.disabled {
  background: gray;
}
</style>
