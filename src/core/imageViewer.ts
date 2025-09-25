// imageViewer.ts

// ===== CONFIG =====
const totalFrames = 180;
const preloadRadius = 40; // how many frames around target to preload
const maxCacheSize = totalFrames;  // max frames kept in memory

const canvas = document.getElementById("imageCanvas") as HTMLCanvasElement;
const body = document.body as HTMLBodyElement;
const ctx = canvas.getContext("2d")!;
canvas.style.touchAction = "none"; // prevent scrolling

// ===== FRAME STATE =====
let currentFrameFloat = 0;
let targetFrame = 0;

// ===== POINTER STATE =====
let pointerDown = false;
let startX = 0;
let startFrame = 0;


// ===== URL GENERATION =====
let urls: string[] = Array.from({ length: totalFrames }, (_, i) => 
    `src/assets/Orbits/Exterior/Day/Exterior360_2.${String(i).padStart(4,'0')}.jpeg`
);

export function ChangeSequence(baseUrl:string){
    GenerateUrls(baseUrl);
    cache.clear();
    preloadRange(0);
animate();
}

function GenerateUrls(baseUrl:string){
        urls = Array.from({ length: totalFrames }, (_, i) => 
    baseUrl+`${String(i).padStart(4,'0')}.jpeg`
);
}

// ===== LRU IMAGE CACHE =====
const cache: Map<number, HTMLImageElement> = new Map();

async function loadFrame(i: number): Promise<HTMLImageElement> {
    i = (i + totalFrames) % totalFrames; // wrap-around
    if (cache.has(i)) return cache.get(i)!;

    const img = new Image();
    img.src = urls[i];

    try {
        await img.decode(); // decode before drawing
    } catch (err) {
        console.warn(`Failed to decode image ${i}`, err);
        // fallback: resolve anyway so we don’t break the loop
        return img;
    }

    cache.set(i, img);
    if (cache.size > maxCacheSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
    }

    return img;
}

function preloadRange(center: number) {
    for (let offset = -preloadRadius; offset <= preloadRadius; offset++) {
        loadFrame((center + offset + totalFrames) % totalFrames);
    }
}

// ===== CANVAS RESIZE =====
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    
    if (body.clientWidth/body.clientHeight < 1) {
        canvas.style.width = "auto";
        canvas.style.height = "100%";
    }else{
        canvas.style.width = "100%";
        canvas.style.height = "auto";
    }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===== POINTER HANDLERS =====
canvas.addEventListener("pointerdown", (e: PointerEvent) => {
    pointerDown = true;
    startX = e.clientX;
    startFrame = targetFrame;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e: PointerEvent) => {
    if (!pointerDown) return;
    const deltaX = e.clientX - startX;
    const pixelsPerRotation = canvas.clientWidth * 1.5; // tweak for sensitivity
    const framesMoved = Math.floor((deltaX / pixelsPerRotation) * totalFrames);
    targetFrame = (startFrame + framesMoved + totalFrames) % totalFrames;
    preloadRange(targetFrame);
});

canvas.addEventListener("pointerup", (e: PointerEvent) => {
    pointerDown = false;
    canvas.releasePointerCapture(e.pointerId);
});

// ===== IMAGE DRAWING FUNCTION WITH ASPECT COVER =====
// function drawImageCover(img: HTMLImageElement) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // draw the image stretched to the full canvas size
//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
// }
let previousImage: HTMLImageElement | null = null;

function drawImageCover(img: HTMLImageElement) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (previousImage) {
        // draw previous frame at full opacity
        ctx.globalAlpha = 1;
        ctx.drawImage(previousImage, 0, 0, canvas.width, canvas.height);
    }

    // draw current frame with some alpha for smooth fade
    ctx.globalAlpha = 0.2; // tweak 0–1 for speed of fade
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // reset alpha for next draw
    ctx.globalAlpha = 1;

    previousImage = img;
}


function getShortestDelta(current: number, target: number, total: number): number {
    let delta = (target - current) % total;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    return delta;
}


// ===== RENDER LOOP =====

async function animate() {
    const shortestDelta = getShortestDelta(currentFrameFloat, targetFrame, totalFrames);
    currentFrameFloat += shortestDelta * 0.12; // lerp factor
    const frameIndex = Math.round((currentFrameFloat + totalFrames) % totalFrames);

    const img = await loadFrame(frameIndex);
    drawImageCover(img);

    requestAnimationFrame(animate);
}
type AutoRotateOptions = {
    startFrame: number;
    endFrame: number;
    duration?: number;       // total animation time in ms
    fade?: boolean;          // enable ease-in/out speed
    direction?: 1 | -1;      // 1 = forward, -1 = backward
    onComplete?: () => void; // optional callback
};

function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 3 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function autoRotate({
    startFrame,
    endFrame,
    duration = 2000,
    fade = true,
    direction = 1,
    onComplete
}: AutoRotateOptions) {
    const startTime = performance.now();
    const totalFramesToMove =
        direction === 1
            ? (endFrame - startFrame + totalFrames) % totalFrames
            : (startFrame - endFrame + totalFrames) % totalFrames;

    function step(now: number) {
        const elapsed = now - startTime;
        let t = Math.min(elapsed / duration, 1); // normalized 0 → 1

        if (fade) t = easeInOutCubic(t); // apply easing

        const frameProgress = totalFramesToMove * t;
        targetFrame =
            direction === 1
                ? (startFrame + frameProgress) % totalFrames
                : (startFrame - frameProgress + totalFrames) % totalFrames;

        if (t < 1) {
            requestAnimationFrame(step);
        } else if (onComplete) {
            onComplete();
        }
    }

    requestAnimationFrame(step);
}


// initial preload and start
preloadRange(0);
animate();
