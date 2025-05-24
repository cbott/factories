<!-- Component representing a single Contractor card -->
<template>
  <div class="card contractorcard" v-tooltip="card.recipe">
    <p class="name">{{ card.name }}</p>
    <p class="recipe">{{ card.short_recipe }}</p>
    <p class="cost-label" style="display: inline-block">⚡{{ card.cost_energy }}</p>
  </div>
</template>

<script>
export default {
  props: {
    card: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style scoped>
.contractorcard {
  background: #ffd042;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.name {
  width: 100%;
  background-color: #d6e2e8;
  border-radius: 5px;
}

.cost-label {
  background-color: #282a32;
  color: white;
  border-radius: 5px;
  padding: 2px;
}

.recipe {
  width: 100%;
  background-color: #e2eaec;
  padding: 2px;
  border-radius: 5px;
}
</style>
