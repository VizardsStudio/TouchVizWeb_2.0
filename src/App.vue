<template>
    <!-- 3D + Image Canvases -->
    <BabylonViewport />
    <ImageViewerCanvas ref="imageViewerRef" />

    <!-- UI Components -->
    <TopBar   :time="time" @update:time="onTimeChange"  />
    <FilterPanel
      v-model:filtering="filtering"
      v-model:areaMin="areaMin"
      v-model:areaMax="areaMax"
      v-model:floorMin="floorMin"
      v-model:floorMax="floorMax"
      v-model:bedMin="bedMin"
      v-model:bedMax="bedMax"
    />
    <UnitWidget v-if="unitSelected" :unit="unit" :unitSelected="unitSelected" @close="unitSelected = false" />
    <BottomNav
      :activeTab="activeTab"
      @update:activeTab="activeTab = $event"
      @toggleFilter="toggleFilter"
    />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BabylonViewport from './components/BabylonViewport.vue'
import ImageViewerCanvas from './components/ImageViewerCanvas.vue'
import TopBar from './components/TopBar.vue'
import FilterPanel from './components/FilterPanel.vue'
import UnitWidget from './components/UnitWidget.vue'
import BottomNav from './components/BottomNav.vue'
import "./style.css"

// ===== State =====
const time = ref<'day' | 'night'>('day')
const activeTab = ref('home')
const filtering = ref(false)
const unitSelected = ref(false)
const unit = ref({ name: 'A-302', area: 125, floor: 12, bedrooms: 3 })
const imageViewerRef = ref<InstanceType<typeof ImageViewerCanvas> | null>(null)

const areaMin = ref(80)
const areaMax = ref(250)
const floorMin = ref(1)
const floorMax = ref(20)
const bedMin = ref(1)
const bedMax = ref(4)

// ===== Methods =====
function toggleFilter() {
  activeTab.value = 'filter'
  filtering.value = !filtering.value
}

function onTimeChange(newTime: 'day' | 'night') {
  time.value = newTime
  toggleTime( newTime)
}


function toggleTime(newTime: 'day' | 'night') {
  console.log(newTime)
  if (newTime === 'night') {
    // Switch to night frames
    imageViewerRef.value?.ChangeImageSequence('src/assets/Orbits/Exterior/Night')
  } else {
    // Switch back to day frames
    imageViewerRef.value?.ChangeImageSequence('src/assets/Orbits/Exterior/Day')
  }
}

// ===== Lifecycle =====
onMounted(() => {
  // demo: show unit widget after 3s
  setTimeout(() => (unitSelected.value = false), 3000)
  
})
</script>

<style>
#app{
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
