<template>
    <!-- 3D + Image Canvases -->
    <BabylonViewport v-show="show3dViewport" />
    <ImageViewerCanvas v-show="show2dViewport" ref="imageViewerRef" />
    <Transition name="fade">
      <PdfViewer pdfUrl="assets/detail.pdf" v-show="showPdf"/>
    </Transition>
    <MapViewer v-show="showMap"/>
    <!-- UI Components -->
    <TopBar   :time="time" @update:time="onTimeChange" :showTime="showTime" />
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
import { ref, onMounted, watch } from 'vue'
import BabylonViewport from './components/BabylonViewport.vue'
import ImageViewerCanvas from './components/ImageViewerCanvas.vue'
import pdfViewer from './components/pdfViewer.vue'  
import TopBar from './components/TopBar.vue'
import FilterPanel from './components/FilterPanel.vue'
import UnitWidget from './components/UnitWidget.vue'
import BottomNav from './components/BottomNav.vue'
import "./style.css"
import PdfViewer from './components/pdfViewer.vue'
import MapViewer from './components/mapViewer.vue'

// ===== State =====
const time = ref<'day' | 'night'>('day')
const activeTab = ref('home')
const show2dViewport = ref(true)
const show3dViewport = ref(true)
const filtering = ref(false)
const showPdf = ref(false)
const showTime = ref(true)
const showMap = ref(false)
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
    imageViewerRef.value?.ChangeImageSequence('assets/Orbits/Exterior/Night')
  } else {
    // Switch back to day frames
    imageViewerRef.value?.ChangeImageSequence('assets/Orbits/Exterior/Day')
  }
}
watch(activeTab, (newTab, oldTab) => {
  switch (newTab) {
    case 'details':
      showPdf.value = true
      filtering.value = false
      showTime.value = false
      showMap.value = false
      show2dViewport.value = true
      show3dViewport.value = false
      break
    case 'home':
      showPdf.value = false
      filtering.value = false
      showTime.value = true
      showMap.value = false
      show2dViewport.value = true
      show3dViewport.value = false
      break
    case 'filter':
      showPdf.value = false
      filtering.value = true
      showTime.value = false
      showMap.value = false
      show2dViewport.value = false
      show3dViewport.value = true
      break
    case 'surroundings':
      showMap.value = true
      showPdf.value = false
      filtering.value = false
      showTime.value = false
      show2dViewport.value = true
      show3dViewport.value = false
      break
    default:
      showPdf.value = false
      filtering.value = false
      showTime.value = false
      show2dViewport.value = true
      show3dViewport.value = false
      break
  }
})

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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
