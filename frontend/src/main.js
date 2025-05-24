import 'floating-vue/dist/style.css'

import './assets/main.css'

import { createApp } from 'vue'
import FloatingVue from 'floating-vue'

import App from './App.vue'

// https://floating-vue.starpad.dev/guide/config
const FLOATING_OPTIONS = {
  overflowPadding: 5, // min space between tooltips and edge of window
  themes: {
    tooltip: {
      delay: {
        show: 0,
      },
    },
  },
}

createApp(App).use(FloatingVue, FLOATING_OPTIONS).mount('#app')
