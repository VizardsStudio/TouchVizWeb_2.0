<template>
  <div class="unit-details" :class="{ open: isOpen }">
    <!-- Toggle Tab -->
    <div class="toggle-tab" @click="togglePanel">
      <span :class="{ flipped: isOpen }">›</span>
    </div>

    <!-- Panel Content -->
    <div class="unit-details-inner">
      <div class="unit-details-header">
        <h2>{{ props.apartmentUnit.type }}</h2>
        <!-- <button class="close-btn" @click="$emit('close')">×</button> -->
      </div>

      <div class="unit-details-content">
        <div class="info-row"><span class="label">Area:</span><span class="value">{{ props.apartmentUnit.area }}
            m²</span></div>
        <div class="info-row"><span class="label">Floor:</span><span class="value">{{ props.apartmentUnit.floor
        }}</span></div>
        <div class="info-row"><span class="label">Typology:</span><span class="value">{{ props.apartmentUnit.typology
        }}</span></div>
        <div class="info-row"><span class="label">View:</span><span class="value">{{ props.apartmentUnit.view }}</span>
        </div>
        <div class="info-row"><span class="label">Status:</span>
          <span class="value"
            :class="{ available: props.apartmentUnit.status === 'Available', sold: props.apartmentUnit.status === 'Sold', reserved: props.apartmentUnit.status === 'Reserved' }">{{
              props.apartmentUnit.status }}</span>
        </div>
        <div class="info-row"><span class="label">Bedrooms:</span><span class="value">{{ props.apartmentUnit.bedrooms
        }}</span></div>
      </div>
      <LvlSelector v-if="props.showLevelSelector" @first-action="onLevelUp" @second-action="onLevelDown" />
      <div class="unit-details-actions">
        <button class="main-btn" @click="$emit('open-3d')">3D Plans</button>
        <button class="main-btn" @click="$emit('open-tour')">Interior Tour</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ApartmentProperties } from "../types/apartment.ts"
import LvlSelector from './LvlSelector.vue'


const props = defineProps<{
  apartmentUnit: ApartmentProperties,
  showLevelSelector: boolean
}>()


defineEmits(['close', 'open-3d', 'open-tour'])

const isOpen = ref(false)

function togglePanel() {
  isOpen.value = !isOpen.value
}

function openPanel() {
  isOpen.value = true
}
function closePanel() {
  isOpen.value = false
}

function onLevelUp() {
  console.log("Level Up clicked from UnitDetails")
  // Implement level up logic here
}
function onLevelDown() {
  console.log("Level Down clicked from UnitDetails")
  // Implement level down logic here
}

defineExpose({ togglePanel, openPanel, closePanel })
</script>

<style scoped>
.unit-details {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%) translateX(-100%);
  width: 270px;
  background: rgba(255, 255, 255, 0.95);
  color: #000;
  border-radius: 0 20px 20px 0;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease;
  pointer-events: auto;
  z-index: 20;
}

.unit-details.open {
  transform: translateY(-50%) translateX(0);
}

/* Toggle tab */
.toggle-tab {
  position: absolute;
  top: 50%;
  right: -24px;
  transform: translateY(-50%);
  background: var(--theme-color);
  color: #000;
  width: 24px;
  height: 60px;
  border-radius: 0 10px 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.4rem;
  transition: background 0.2s;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
}

.toggle-tab:hover {
  background: #3e8764;
}

.toggle-tab span {
  display: inline-block;
  transform: rotate(0deg);
  transition: transform 0.3s ease;
}

.toggle-tab span.flipped {
  transform: rotate(180deg);
}

.unit-details-inner {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
}

.unit-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.unit-details-header h2 {
  font-size: 1.3rem;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  color: #333;
}

.unit-details-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.label {
  font-weight: 600;
  color: #444;
}

.value {
  font-weight: 500;
}

.value.available {
  color: var(--theme-color);
}

.value.sold {
  color: #b33;
}

.unit-details-actions {
  display: flex;
  gap: 0.6rem;
}

.main-btn {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 10px;
  background: var(--theme-color);
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.main-btn:hover {
  background: #3e8764;
}

@media (max-width: 600px) {
  .unit-details {
    width: 85%;
    transform: translateY(-50%) translateX(-100%);
  }

  .unit-details.open {
    transform: translateY(-50%) translateX(0);
  }
}
</style>
