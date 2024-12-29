<!-- Component representing a single Fantastic Factories card -->
<template>
  <div class="card" :class="{ disabled: isDisabled }">
    {{ card.name }}
    <br/>
    {{ card.tool }}
    <br/>
    {{ card.id }}
  </div>
</template>

<script>
export default {
  props: {
    card: {
      type: Object,
      required: true
    },
    isDisabled: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.card {
  margin: 5px;
  padding: 10px;
  background: lightblue;
  border-radius: 4px;
  width: 100px;
  height: 150px;
}

.disabled {
  background: gray;
}
</style>