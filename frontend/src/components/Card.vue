<!-- Component representing a single Fantastic Factories card -->
<template>
  <div class="card">
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
</style>