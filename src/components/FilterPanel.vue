<template>
  <div class="filter-panel" :class="{ active: filtering }">
    <!-- Floor -->
    <div class="filter-group">
      <label>{{ $t("Floor") }}</label>
      <VueSlider v-model="floorRange" :min="1" :max="50" range :tooltip="'always'" :dot-size="18" :height="6" />
    </div>

    <!-- Area -->
    <div class="filter-group">
      <label>{{ $t("Area") }}</label>
      <VueSlider v-model="areaRange" :min="110" :max="570" range :tooltip="'always'" :dot-size="18" :height="6" />
    </div>

    <!-- Bedrooms -->
    <div class="filter-group">
      <label>{{ $t("Bedrooms") }}</label>
      <VueSlider v-model="bedRange" :min="1" :max="7" range :tooltip="'always'" :dot-size="18" :height="6" />
    </div>

    <!-- Typology -->
    <div class="filter-group small-section">
      <label>{{ $t("Typology") }}</label>
      <div class="toggle-row">
        <button v-for="t in typologies" :key="t" class="toggle" :class="{ active: selectedTypologies.includes(t) }"
          @click="toggleTypology(t)">
          {{ t }}
        </button>
      </div>
    </div>

    <!-- View -->
    <div class="filter-group small-section">
      <label>{{ $t("View") }}</label>
      <div class="toggle-row">
        <button v-for="v in views" :key="v" class="toggle" :class="{ active: selectedViews.includes(v) }"
          @click="toggleView(v)">
          {{ v }}
        </button>
      </div>
    </div>

    <!-- Reset -->
    <div class="filter-group">
      <button class="reset-btn" @click="resetAll">{{ $t("Reset") }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VueSlider from 'vue-3-slider-component'
import debounce from 'lodash.debounce'
import { eventBus } from '../core/eventBus'
import type { FilterCriteria } from '../types/filteringCriteria'

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
  (e: 'typology-change', value: string[]): void
  (e: 'view-change', value: string[]): void
  (e: 'reset'): void
}>()

// ------------------- Filter State -------------------


const typologies = ['Apartment', 'Duplex', 'Penthouse']
const views = ['Dijlah View', 'City View']


const selectedTypologies = ref<string[]>([...typologies])
const selectedViews = ref<string[]>([...views])

//---------------------- Defaults -----------------------------
const DEFAULT_AREA: [number, number] = [110, 570]
const DEFAULT_FLOOR: [number, number] = [1, 50]
const DEFAULT_BEDROOMS: [number, number] = [1, 7]
const areaRange = ref<[number, number]>([props.areaMin ?? DEFAULT_AREA[0], props.areaMax ?? DEFAULT_AREA[1]])
const floorRange = ref<[number, number]>([props.floorMin ?? DEFAULT_FLOOR[0], props.floorMax ?? DEFAULT_FLOOR[1]])
const bedRange = ref<[number, number]>([props.bedMin ?? DEFAULT_BEDROOMS[0], props.bedMax ?? DEFAULT_BEDROOMS[1]])




// ------------------- Build FilterCriteria -------------------
function buildFilterCriteria(): FilterCriteria {
  return {
    floorRange: [...floorRange.value],
    areaRange: [...areaRange.value],
    bedrooms: [...bedRange.value],
    typology: [...selectedTypologies.value],
    view: [...selectedViews.value],
  }
}

// Debounced filter emit for sliders
const emitFilterCriteria = debounce(() => {
  eventBus.dispatchEvent(
    new CustomEvent('filterUpdated', { detail: buildFilterCriteria() })
  )
}, 10) // 200ms retriggerable

// ------------------- Watchers -------------------
// Emit slider changes with debounce
watch([floorRange, areaRange, bedRange], () => {
  emitFilterCriteria()
}, { deep: true })

// Emit immediate toggle changes
function toggleTypology(t: string) {
  const idx = selectedTypologies.value.indexOf(t)
  if (idx === -1) selectedTypologies.value.push(t)
  else selectedTypologies.value.splice(idx, 1)
  emit('typology-change', selectedTypologies.value)
  eventBus.dispatchEvent(
    new CustomEvent('filterUpdated', { detail: buildFilterCriteria() })
  )
}

function toggleView(v: string) {
  const idx = selectedViews.value.indexOf(v)
  if (idx === -1) selectedViews.value.push(v)
  else selectedViews.value.splice(idx, 1)
  emit('view-change', selectedViews.value)
  eventBus.dispatchEvent(
    new CustomEvent('filterUpdated', { detail: buildFilterCriteria() })
  )
}

// ------------------- Reset -------------------
function resetAll() {
  areaRange.value = [props.areaMin, props.areaMax]
  floorRange.value = [props.floorMin, props.floorMax]
  bedRange.value = [props.bedMin, props.bedMax]

  // Set toggles back to all options
  selectedTypologies.value = [...typologies]
  selectedViews.value = [...views]

  emit('typology-change', selectedTypologies.value)
  emit('view-change', selectedViews.value)
  emit('reset')

  // Trigger filter update immediately
  eventBus.dispatchEvent(
    new CustomEvent('filterUpdated', { detail: buildFilterCriteria() })
  )
}

// ------------------- Sync props -------------------
watch(() => [props.areaMin, props.areaMax], ([min, max]) => areaRange.value = [min, max])
watch(() => [props.floorMin, props.floorMax], ([min, max]) => floorRange.value = [min, max])
watch(() => [props.bedMin, props.bedMax], ([min, max]) => bedRange.value = [min, max])

</script>

<style>
.filter-group label {
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
  background: rgba(72, 72, 72, 0.7);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  overflow: scroll;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-panel::-webkit-scrollbar {
  display: none;
}

.filter-panel.active {
  opacity: 0.9;
  pointer-events: auto;
  visibility: visible;
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

.toggle-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.toggle {
  background: #95a9a6;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: none;
}

.toggle.active {
  background: #c9b59a;
  color: #3b2b1c;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #e9e6e4;
  color: #7a5a2a;
  font-weight: 600;
  cursor: pointer;
}
</style>
