<!-- Component representing a single Blueprint card -->
<template>
  <div class="tooltip">
    <div class="card" :class="{ disabled: isDisabled }">
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
.card {
  margin: 5px;
  padding: 10px;
  background: lightblue;
  border-radius: 4px;
  width: 100px;
  height: 150px;
  text-align: center;
}

.disabled {
  background: gray;
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  bottom: 100%;
  left: 50%;
  width: 200px;
  margin-left: -100px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .tooltiptext::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style>
