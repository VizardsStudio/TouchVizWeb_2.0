<template>
  <canvas id="renderCanvas" ref="renderCanvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { EngineManager } from '../core/EngineManager'
import { LevelExterior } from '../levels/exterior'
import { Level_InteriorTour } from '../levels/InteriorTourLevel'

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
  setTimeout(() => {
    OpenExteriorLevel();
  }, 2000);
})

function OpenExteriorLevel(){
  if(!engineManager) return
  exteriorLevel = new LevelExterior(engineManager.engine)
  engineManager.OpenLevel(exteriorLevel)
}
function OpenInteriorTourLevel(type:string){
  if(!engineManager) return
  let interiorTourLevel = new Level_InteriorTour(engineManager.engine)
  engineManager.OpenLevel(interiorTourLevel)
  interiorTourLevel.LoadType("A")
}

//expose methods
defineExpose({OpenExteriorLevel, OpenInteriorTourLevel})

</script>

<style >
#renderCanvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
