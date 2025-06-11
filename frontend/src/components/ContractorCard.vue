<!-- Component representing a single Contractor card -->
<template>
  <div class="card contractorcard" v-tooltip="card.recipe" :style="{ backgroundImage: backgroundImagePath }">
    <p class="name">{{ card.name }}</p>
    <div class="recipe-container card-box">
      <p class="recipe">{{ card.short_recipe }}</p>
    </div>
    <div class="cost-label">
      <p style="font-weight: bold">⚡{{ card.cost_energy }}</p>
    </div>
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
  computed: {
    backgroundImagePath() {
      let imageName = this.card.name.toLowerCase().replace(/\s+/g, '_')
      return `url(/${imageName}.png)`
    },
  },
}
</script>

<style scoped>
.contractorcard {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.name {
  width: 100%;
  color: white;
  font-weight: bold;
}

.cost-label {
  width: 100%;
  text-align: left;
  color: black;
  font-weight: bold;
  border-radius: 5px;
  padding-left: 5px;
  padding-bottom: 1px;
}
</style>
