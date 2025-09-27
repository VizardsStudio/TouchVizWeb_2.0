<template>
  <div class="canvas-container">
    <canvas
      ref="imageCanvas"
      class="image-canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, defineExpose } from 'vue';
import {
  initImageViewer,
  destroyViewer,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  onHostResize,
  configure,
  animateFrames,
  changeImageSequence
} from '../core/imageViewer';

// Optional: configure basePath or preload radius before init
// configure({ basePath: '/Orbits/Exterior/Day', preloadRadius: 40 });

const imageCanvas = ref<HTMLCanvasElement | null>(null);

// Forward resize to core
function onResize() {
  onHostResize();
}

onMounted(() => {
  if (!imageCanvas.value) return;
  // init
  initImageViewer(imageCanvas.value, 100);
  //play initial animation
  animateFrames(100,150,1000,1,0.5,0.5)

  // listen for host resize
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  destroyViewer();
  window.removeEventListener('resize', onResize);
});

// Vue-layer pointer handlers simply forward the event to the core
function onPointerDown(e: PointerEvent) {
  handlePointerDown(e);
}

function onPointerMove(e: PointerEvent) {
  handlePointerMove(e);
}

function onPointerUp(e: PointerEvent) {
  handlePointerUp(e);
}

function ChangeImageSequence(path:string){
  console.log("changing to: " + path)
  changeImageSequence(path);
}

//expose functions
defineExpose({

  ChangeImageSequence

})

</script>

<style scoped>
.canvas-container {
  position: absolute; /* container for centering */
  width: 100%;
  height: 100vh; /* or parent height */
  overflow: hidden; /* hide the overshoot */
  display: flex;
  justify-content: center; /* horizontal centering */
  align-items: center;     /* vertical centering */
}

.image-canvas {
  display: block;
  opacity: 1;
  aspect-ratio: 1/1;
  pointer-events: auto;
  /* default: landscape-like */
  width: 100%;
  height: auto;

}

/* portrait orientation */
@media (orientation: portrait) {
  .image-canvas {
    width: auto;
    height: 100%;
  }
}

</style>
