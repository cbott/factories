<template>
  <span :class="cssClass" v-html="html" />
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    cssClass() {
      return ['icon', String(Boolean(this.value))]
    },
    html() {
      return this.value ? '&check;' : '&times;'
    },
  },
}
</script>

<style scoped>
.icon {
  font-weight: bold;
}
.icon.true {
  color: green;
}
.icon.false {
  color: red;
}
</style>
