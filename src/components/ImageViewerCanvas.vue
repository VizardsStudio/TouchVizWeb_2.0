<template>
  <div class="canvas-container">
    <canvas ref="imageCanvas" class="image-canvas" :class="{ blurred: !AppStore.highResLoaded }"
      @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @touchstart="onTouchStart"
      @touchmove="onTouchMove" @touchend="onTouchEnd">
    </canvas>
    <div v-if="isLoading" class="loadingWidget">
      <div class="spinner"></div>
      <label>{{ progressText }} </label>
    </div>
    <div class="demo-swipe">
      <div class="finger"></div>
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
import { useAppStore } from '../Stores/AppStore';

// Optional: configure basePath or preload radius before init
// configure({ basePath: '/Orbits/Exterior/Day', preloadRadius: 40 });

const imageCanvas = ref<HTMLCanvasElement | null>(null);
const isMoving = ref(false)
const progressText = ref("Loading ")
const isLoading = ref(true)

const AppStore = useAppStore();

//zoom variables 
const scale = ref(1); // current zoom level
let initialDistance = 0;
let lastScale = 1;

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
  const ctx = imageCanvas.value.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "black"; // any CSS color: hex, rgb, rgba, etc.
    ctx.fillRect(0, 0, imageCanvas.value.width, imageCanvas.value.height);
  }
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

let isOrbiting = ref(false);

// Vue-layer pointer handlers simply forward the event to the core
function onPointerDown(e: PointerEvent) {
  if (touchActive.value) return; // ignore if touch active
  isOrbiting.value = true;
  //isMoving.value = true;
  AppStore.highResLoaded = false;
  handlePointerDown(e);
}

function onPointerMove(e: PointerEvent) {
  if (touchActive.value) return; // ignore if touch active
  isOrbiting.value = true;
  handlePointerMove(e);

}

function onPointerUp(e: PointerEvent) {
  //if (touchActive.value) return; // ignore if touch active
  isOrbiting.value = false;
  isMoving.value = false;
  handlePointerUp(e);
}

//handing zoom
let lastTap = 0;

function onDoubleTap() {
  scale.value = 1;
  if (imageCanvas.value) {
    imageCanvas.value.style.transform = `scale(${scale.value})`;
  }
}

const touchActive = ref(false);

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    touchActive.value = true;
    initialDistance = getDistance(e.touches);
  } else if (e.touches.length === 1) {
    const now = Date.now();
    if (now - lastTap < 300) { // 300ms for double tap
      onDoubleTap();
    }
    lastTap = now;
  }
}

const MIN_SCALE = 1;
const MAX_SCALE = 2;

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    //if (isOrbiting.value === true) return; // prevent zooming before high res loaded
    const currentDistance = getDistance(e.touches);
    const pinchScale = currentDistance / initialDistance;
    AppStore.highResLoaded = true;

    scale.value *= pinchScale / lastScale;
    lastScale = pinchScale;

    // clamp
    scale.value = Math.min(Math.max(scale.value, MIN_SCALE), MAX_SCALE);

    if (imageCanvas.value) {
      imageCanvas.value.style.transform = `scale(${scale.value})`;
    }

    e.preventDefault();
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) {
    lastScale = 1;
  }
  if (e.touches.length === 0) {
    touchActive.value = false;
  }
}

function getDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}



function ChangeImageSequence(path: string, extention: string) {
  console.log("changing to: " + path)
  changeImageSequence(path, extention);
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
  transition: filter 0.3s ease;
}

.image-canvas.blurred {
  filter: blur(7px);
}

/* portrait orientation */
@media (orientation: portrait) {
  .image-canvas {
    width: auto;
    height: 100%;
  }
}

.demo-swipe {
  position: absolute;
  bottom: 20%;
  /* adjust based on your UI */
  left: 50%;
  transform: translateX(-50%);
  width: 10%;
  height: 10%;
  opacity: 0.5;
  pointer-events: none;
  /* so it doesn’t block user input */
}

.finger {
  position: absolute;
  width: 10vw;
  height: 10vh;
  background: url('/assets/swipe.png') no-repeat center center;
  background-size: contain;
  opacity: 0;
  animation: swipe 2s ease-in-out 2;
  animation-delay: 0.5s;
}

@keyframes swipe {
  0% {
    transform: translateX(0) translateY(0) rotate(0deg);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  50% {
    transform: translateX(100px) translateY(0) rotate(0deg);
  }

  90% {
    opacity: 1;
  }

  100% {
    transform: translateX(0) translateY(0) rotate(0deg);
    opacity: 0;
  }
}
</style>
