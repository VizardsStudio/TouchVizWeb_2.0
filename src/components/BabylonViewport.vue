<template>
  <canvas id="renderCanvas" ref="renderCanvas"></canvas>

</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { EngineManager } from '../core/EngineManager'
import { LevelExterior } from '../levels/exterior'
import { Level_InteriorTour } from '../levels/InteriorTourLevel'
import { eventBus } from '../core/eventBus'
import { useAppStore } from '../Stores/AppStore'

const renderCanvas = ref<HTMLCanvasElement | null>(null)
let engineManager: EngineManager | null = null
let exteriorLevel: LevelExterior | null = null
const interiorLevel = ref<Level_InteriorTour | null>(null)

onMounted(() => {
  if (!renderCanvas.value) return

  // Force canvas to take full size of parent
  renderCanvas.value.width = renderCanvas.value.clientWidth
  renderCanvas.value.height = renderCanvas.value.clientHeight

  //initializing the 3d Engine
  engineManager = EngineManager.getInstance(renderCanvas.value)
  engineManager.engine.resize()
  setTimeout(() => {
    OpenExteriorLevel();
  }, 2000);
  // listen for interior exit requests from inside levels or UI
  eventBus.addEventListener('interior:exit', ExitInteriorTour as EventListener)
})

onUnmounted(() => {
  try { eventBus.removeEventListener('interior:exit', ExitInteriorTour as EventListener) } catch (e) { }
})

function OpenExteriorLevel() {
  if (!engineManager) return
  exteriorLevel = new LevelExterior(engineManager.engine)
  engineManager.OpenLevel(exteriorLevel)
}
function OpenInteriorTourLevel(type: string) {
  if (!engineManager) return
  interiorLevel.value = new Level_InteriorTour(engineManager.engine)
  engineManager.CloseLevel(exteriorLevel)
  engineManager.OpenLevel(interiorLevel.value as any)
  interiorLevel.value.LoadType(type, useAppStore().duplexLevel)
}

function ExitInteriorTour() {
  if (!engineManager) return
  try {
    if (interiorLevel.value) {
      engineManager.CloseLevel(interiorLevel.value as any)
      interiorLevel.value = null
    }
  } catch (e) { console.warn('Failed to close interior level', e) }

  // recreate exterior and open it
  exteriorLevel = new LevelExterior(engineManager.engine)
  engineManager.OpenLevel(exteriorLevel)
}

//expose methods
defineExpose({ OpenExteriorLevel, OpenInteriorTourLevel, ExitInteriorTour })

</script>

<style>
#renderCanvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
