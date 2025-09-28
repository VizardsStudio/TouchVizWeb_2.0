<template>
  <canvas id="renderCanvas" ref="renderCanvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { EngineManager } from '../core/EngineManager'
import { LevelExterior } from '../levels/exterior'

const renderCanvas = ref<HTMLCanvasElement | null>(null)
let engineManager:EngineManager | null = null
let exteriorLevel:LevelExterior | null = null

onMounted(() => {
  if (!renderCanvas.value) return

  // Force canvas to take full size of parent
  renderCanvas.value.width = renderCanvas.value.clientWidth
  renderCanvas.value.height = renderCanvas.value.clientHeight

  //initializing the 3d Engine
  engineManager = EngineManager.getInstance(renderCanvas.value)
  engineManager.engine.resize()
})

function OpenExteriorLevel(){
  console.log("the function is being called!!!")
  if(!engineManager) return
  exteriorLevel = new LevelExterior(engineManager.engine)
  engineManager.OpenLevel(exteriorLevel)
}

//expose methods
defineExpose({OpenExteriorLevel})

</script>

<style >
#renderCanvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
