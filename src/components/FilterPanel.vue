<template>
  <div class="filter-panel" :class="{ active: filtering }">
    <!-- Area -->
    <div class="filter-group">
      <label>Area (m²)</label>
      <VueSlider
        v-model="areaRange"
        :min="50"
        :max="300"
        range
        :tooltip="'always'"
        :dot-size="18"
        :height="6"
        @change="onRangeChange('area', areaRange)"
      />
      <!-- <div class="range-values"><span>{{ areaRange[0] }}</span><span>{{ areaRange[1] }}</span></div> -->
    </div>

    <!-- Floor -->
    <div class="filter-group">
      <label>Floor</label>
      <VueSlider
        v-model="floorRange"
        :min="1"
        :max="30"
        range
        :tooltip="'always'"
        :dot-size="18"
        :height="6"
        @change="onRangeChange('floor', floorRange)"
      />
      <!-- <div class="range-values"><span>{{ floorRange[0] }}</span><span>{{ floorRange[1] }}</span></div> -->
    </div>

    <!-- Bedrooms -->
    <div class="filter-group">
      <label class="sliderLabel">Bedrooms</label>
      <VueSlider
        v-model="bedRange"
        :min="1"
        :max="5"
        range
        :tooltip="'always'"
        :dot-size="18"
        :height="6"
        @change="onRangeChange('bed', bedRange)"
      />
      <!-- <div class="range-values"><span>{{ bedRange[0] }}</span><span>{{ bedRange[1] }}</span></div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VueSlider from 'vue-3-slider-component'
//import 'vue-3-slider-component/dist/css/index.css'

// Props
const props = defineProps<{
  filtering: boolean
  areaMin: number
  areaMax: number
  floorMin: number
  floorMax: number
  bedMin: number
  bedMax: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:areaMin', value: number): void
  (e: 'update:areaMax', value: number): void
  (e: 'update:floorMin', value: number): void
  (e: 'update:floorMax', value: number): void
  (e: 'update:bedMin', value: number): void
  (e: 'update:bedMax', value: number): void
}>()

// Range refs
const areaRange = ref<[number, number]>([props.areaMin, props.areaMax])
const floorRange = ref<[number, number]>([props.floorMin, props.floorMax])
const bedRange = ref<[number, number]>([props.bedMin, props.bedMax])

// Watch for prop changes
watch(() => [props.areaMin, props.areaMax], ([min, max]) => areaRange.value = [min, max])
watch(() => [props.floorMin, props.floorMax], ([min, max]) => floorRange.value = [min, max])
watch(() => [props.bedMin, props.bedMax], ([min, max]) => bedRange.value = [min, max])

// Emit changes
function onRangeChange(type: 'area' | 'floor' | 'bed', range: [number, number]) {
  switch(type) {
    case 'area':
      emit('update:areaMin', range[0])
      emit('update:areaMax', range[1])
      break
    case 'floor':
      emit('update:floorMin', range[0])
      emit('update:floorMax', range[1])
      break
    case 'bed':
      emit('update:bedMin', range[0])
      emit('update:bedMax', range[1])
      break
  }
}
</script>

<style >
/* ====== Filtering Panel ====== */
.filter-group label{
  text-align: center;
}
.filter-panel {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  width: 90%;
  max-width: 480px;
  max-height: 60%;
  background: rgba(0, 0, 0, 0.85);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  overflow: scroll;
  opacity: 0;
  pointer-events: none;
  visibility: hidden; /* hides from layout but keeps it for transitions */
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;

  scrollbar-width: none;
  -ms-overflow-style: none;
}
.filter-panel::-webkit-scrollbar {
  display: none;
}

.filter-panel.active {
  opacity: 1;
  pointer-events: auto;
  visibility: visible; /* now it’s visible */
  transform: translateX(-50%) translateY(0);
}


.filter-group {
  margin-bottom: 1.2rem;
}

.filter-group label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.range-values {
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
  margin-top: 0.3rem;
}

input[type=range] {
  width: 100%;
  pointer-events: auto;
}

</style>
