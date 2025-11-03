import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import "./style.css";
import { fetchUnits } from "./core/fetchUnits";
import { unitManager } from "./managers/UnitManager";

async function startup() {
  try {
    const units = await unitManager.load()
    console.log('✅ Loaded units:', units)
  } catch (err) {
    console.error('❌ Error loading units:', err)
  }

  //createApp(App).mount('#app')
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia)
  app.mount('#app')
}

startup()
