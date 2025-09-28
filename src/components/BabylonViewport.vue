<template>
  <canvas id="renderCanvas" ref="renderCanvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { EngineManager } from '../core/EngineManager'
import { LevelExterior } from '../levels/exterior'

onMounted(() => {
  const renderCanvas = ref<HTMLCanvasElement | null>(null)
  if (!renderCanvas.value) return

  // Force canvas to take full size of parent
  renderCanvas.value.width = renderCanvas.value.clientWidth
  renderCanvas.value.height = renderCanvas.value.clientHeight

  //initializing the 3d Engine
  const engineManager = EngineManager.getInstance(renderCanvas.value)
  const exteriorLevel = new LevelExterior(engineManager.engine)
  engineManager.OpenLevel(exteriorLevel)
  engineManager.engine.resize()

})
</script>

<style >
#renderCanvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
