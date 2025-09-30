import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { fetchUnits } from "./core/fetchUnits";

createApp(App).mount("#app"); // lowercase id
loadData();

async function loadData() {
  try {
    const units = await fetchUnits()
    console.log('✅ Loaded units:', units)
  } catch (err) {
    console.error('❌ Error fetching units:', err)
  }
}
