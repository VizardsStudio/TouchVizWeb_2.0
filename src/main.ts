import { createApp } from "vue";
import App from "./App.vue";
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

  createApp(App).mount('#app')
}

startup()
