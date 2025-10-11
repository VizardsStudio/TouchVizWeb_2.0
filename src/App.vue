<template>
  <!-- 3D + Image Canvases -->
  <BabylonViewport v-show="show3dViewport" ref="babylonCanvas" />
  <ImageViewerCanvas v-show="show2dViewport" ref="imageViewerRef" />
  <Transition name="fade">
    <PdfViewer pdfUrl="assets/detail.pdf" v-show="showPdf" />
  </Transition>
  <MapViewer v-show="showMap" />
  <!-- UI Components -->
  <TopBar :time="time" @update:time="onTimeChange" :showTime="showTime" />
  <FilterPanel v-model:filtering="filtering" v-model:areaMin="areaMin" v-model:areaMax="areaMax"
    v-model:floorMin="floorMin" v-model:floorMax="floorMax" v-model:bedMin="bedMin" v-model:bedMax="bedMax" />
  <BottomNav ref="bottomNav" :activeTab="activeTab" @update:activeTab="activeTab = $event"
    @toggleFilter="toggleFilter" />
  <Transition name="fade">
    <PopupPromp :visible="showInitUnit" :message="welcomeMessage" @yes="onConfirm" @no="onCancel" />
  </Transition>
  <Transition name="fade" v-if="selectedApartmentUnit">
    <UnitDetails :apartmentUnit="selectedApartmentUnit" @open-tour="onInteriorTour" ref="unitDetailsRef" />
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import BabylonViewport from './components/BabylonViewport.vue'
import ImageViewerCanvas from './components/ImageViewerCanvas.vue'
import pdfViewer from './components/pdfViewer.vue'
import TopBar from './components/TopBar.vue'
import FilterPanel from './components/FilterPanel.vue'
import BottomNav from './components/BottomNav.vue'
import "./style.css"
import PdfViewer from './components/pdfViewer.vue'
import MapViewer from './components/mapViewer.vue'
import PopupPromp from './components/PopupPromp.vue'
import UnitDetails from './components/UnitDetails.vue'
import type { ApartmentProperties } from './types/apartment.ts'
import { eventBus } from './core/eventBus.ts'




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
const babylonCanvas = ref<InstanceType<typeof BabylonViewport> | null>(null)
const bottomNav = ref<InstanceType<typeof BottomNav> | null>(null)
const unitDetailsRef = ref<InstanceType<typeof UnitDetails> | null>(null)

//url queries
const urlQueryName = ref("")
const urlQueryID = ref(-1)
const showInitUnit = ref(false)
const welcomeMessage = computed(() => `Welcome dear ${urlQueryName.value}, would you like to see your apartment?`)
const selectedApartmentUnit = ref<ApartmentProperties | null>(null)

//filtering input
const areaMin = ref(110)
const areaMax = ref(570)
const floorMin = ref(1)
const floorMax = ref(50)
const bedMin = ref(1)
const bedMax = ref(7)

// ===== Methods =====
function toggleFilter() {
  activeTab.value = 'filter'
  filtering.value = !filtering.value
}

function onTimeChange(newTime: 'day' | 'night') {
  time.value = newTime
  toggleTime(newTime)
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

function GetUrlQuery() {
  const query = new URLSearchParams(window.location.search)

  // Example: ?tab=filter&unit=A-302
  const iDParam = query.get('ID')
  const nameParam = query.get('Name')

  if (nameParam) {
    //set the name here
    urlQueryName.value = nameParam
  }
  if (iDParam) {
    urlQueryID.value = Number(iDParam)
  }

  console.log("Name: " + urlQueryName.value + "_ID: " + urlQueryID.value)
  if (urlQueryID.value !== -1) {
    showInitUnit.value = true
  }
}

function onConfirm() {
  console.log("User clicked YES")
  showInitUnit.value = false
  bottomNav.value?.ActivateFiltering()
  activeTab.value = "filter"
  babylonCanvas.value?.OpenExteriorLevel();
  show3dViewport.value = true
}

function onCancel() {
  console.log("User clicked NO")
  showInitUnit.value = false
}

function onInteriorTour() {
  unitDetailsRef.value.togglePanel()
  console.log("interior tour clicked")
  babylonCanvas.value.OpenInteriorTourLevel("A")
}

watch(activeTab, async (newTab, oldTab) => {
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
      //open exterior level
      //babylonCanvas.value?.OpenExteriorLevel();
      filtering.value = false
      showPdf.value = false
      showTime.value = false
      showMap.value = false
      show2dViewport.value = false
      show3dViewport.value = true
      await setTimeout(() => filtering.value = true, 500)
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
  GetUrlQuery()
  selectedApartmentUnit.value = {
    id: -1,
    type: 'No units selected',
    floor: 0,
    area: 0,
    typology: '---',
    view: '---',
    status: 'Available',
    bedrooms: 0
  }
  eventBus.addEventListener("unitSelected", HandleUnitSelection as EventListener)
  eventBus.addEventListener("deselected", HandleUnitDeselect as EventListener)
})

onBeforeUnmount(() => { })

function HandleUnitSelection(event: CustomEvent) {
  selectedApartmentUnit.value = event.detail
  unitDetailsRef.value.openPanel();
}
function HandleUnitDeselect(event: CustomEvent) {
  filtering.value = false;
  unitDetailsRef.value.closePanel();
}
</script>

<style>
#app {
  position: absolute;
  width: 100%;
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
