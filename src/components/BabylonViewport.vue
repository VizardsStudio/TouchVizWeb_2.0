<template>
  <canvas id="renderCanvas" class="viewport"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { EngineManager } from '../core/EngineManager'
import { LevelExterior } from '../levels/exterior'

onMounted(() => {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
  const engineManager = EngineManager.getInstance(canvas)
  const exteriorLevel = new LevelExterior(engineManager.engine)
  engineManager.OpenLevel(exteriorLevel)
})
</script>

<style scoped>
#renderCanvas{
  position: absolute;
}
</style>
