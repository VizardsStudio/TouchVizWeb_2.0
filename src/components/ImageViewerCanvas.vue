<template>
  <div class="canvas-container">
    <canvas ref="imageCanvas" class="image-canvas" @pointerdown="onPointerDown" @pointermove="onPointerMove"
      @pointerup="onPointerUp"></canvas>
    <div v-if="isLoading" class="loadingWidget">
      <div class="spinner"></div>
      <label>{{ progressText }} </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, defineExpose, watch } from 'vue';
import {
  initImageViewer,
  destroyViewer,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  onHostResize,
  configure,
  changeImageSequence,
  onProgress
} from '../core/imageViewer';

// Optional: configure basePath or preload radius before init
// configure({ basePath: '/Orbits/Exterior/Day', preloadRadius: 40 });

const imageCanvas = ref<HTMLCanvasElement | null>(null);
const isMoving = ref(false)
const progressText = ref("Loading ")
const isLoading = ref(true)

// Forward resize to core
function onResize() {
  onHostResize();
}

// Hook up progress reporting
onProgress((loaded, total) => {
  const percent = ((loaded / total) * 100).toFixed(1);
  //console.log(`Progress: ${loaded}/${total} frames (${percent}%)`);
  isLoading.value = true;
  if (loaded >= total - 1) {
    isLoading.value = false;
  }
  progressText.value = `Loading ${loaded}/${total} frames (${percent}%)`;
});

onMounted(() => {
  //return //temporarily disabled to work on other features
  if (!imageCanvas.value) return;
  // init
  initImageViewer(imageCanvas.value, 100);
  //play initial animation
  //animateFrames(100,150,1000,1,0.5,0.5)

  // listen for host resize
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  destroyViewer();
  window.removeEventListener('resize', onResize);
});

// Vue-layer pointer handlers simply forward the event to the core
function onPointerDown(e: PointerEvent) {
  isMoving.value = true;
  handlePointerDown(e);
}

function onPointerMove(e: PointerEvent) {
  handlePointerMove(e);
}

function onPointerUp(e: PointerEvent) {
  isMoving.value = false;
  handlePointerUp(e);
}

function ChangeImageSequence(path: string) {
  console.log("changing to: " + path)
  changeImageSequence(path);
}

//expose functions
defineExpose({

  ChangeImageSequence

})

watch(isMoving, (newVal, oldVal) => {
  if (newVal === true) {
    imageCanvas.value.style.cursor = "grabbing";
  } else imageCanvas.value.style.cursor = "grab";
})

</script>

<style scoped>
.loadingWidget {
  position: absolute;
  left: 10px;
  top: 80px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
}

.loadingWidget label {
  color: white;
  margin: 5px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 4px solid #ccc;
  border-top-color: #4cafef;
  /* accent color */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.canvas-container {
  position: absolute;
  /* container for centering */
  width: 100%;
  height: 100vh;
  /* or parent height */
  overflow: hidden;
  /* hide the overshoot */
  display: flex;
  justify-content: center;
  /* horizontal centering */
  align-items: center;
  /* vertical centering */
}

.image-canvas {
  display: block;
  opacity: 1;
  aspect-ratio: 1/1;
  pointer-events: auto;
  /* default: landscape-like */
  width: 100%;
  height: auto;
  cursor: grab;

}

/* portrait orientation */
@media (orientation: portrait) {
  .image-canvas {
    width: auto;
    height: 100%;
  }
}
</style>
