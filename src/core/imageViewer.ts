// src/core/imageViewer.ts
// Fully self-contained image viewer core that exposes init/destroy and pointer handlers.
// Adjust `basePath` if your images are located elsewhere (public/ or CDN).

const totalFrames = 180;
let preloadRadius = 40;
let maxCacheSize = totalFrames;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

let currentFrameFloat = 0;
let targetFrame = 0;
let startFrame = 0;

// pointer drag state (kept internal, but updated from Vue handlers)
let pointerDown = false;
let startX = 0;

// rendering/cache
const cache: Map<number, HTMLImageElement> = new Map();
let animationId: number | null = null;

// base path for frames — change if needed
let basePath = 'src/assets/Orbits/Exterior/Day';
function frameUrl(i: number) {
    const idx = String(i).padStart(4, '0');
    return `${basePath}/Exterior360_2.${idx}.jpeg`;
}

// ----------------- Public API -----------------
export function configure(options: {
    totalFrames?: number;
    preloadRadius?: number;
    maxCacheSize?: number;
    basePath?: string;
}) {
    if (options.totalFrames) {
        // NOTE: this simple implementation assumes totalFrames set before init
        // For dynamic totalFrames you'd need to adapt a few internals.
        // We keep it simple for current use-case.
        // (If needed later we can make totalFrames a variable.)
    }
    if (options.preloadRadius !== undefined) preloadRadius = options.preloadRadius;
    if (options.maxCacheSize !== undefined) maxCacheSize = options.maxCacheSize;
    if (options.basePath !== undefined) basePath = options.basePath;
}

export function initImageViewer(canvasEl: HTMLCanvasElement, initialFrame: number) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('2D context not available');

    // visual settings
    canvas.style.touchAction = 'none';
    resizeCanvas();

    // start by preloading frame 0 and kick off animation
    preloadRange(initialFrame);
    currentFrameFloat = initialFrame;
    targetFrame = initialFrame;
    animationLoop();
}

/**
 * Change the current image sequence (e.g., time of day)
 * newBasePath: folder containing the new frames
 * startFrame: which frame to show initially
 */
export async function changeImageSequence(newBasePath: string, startFrame: number = currentFrameFloat) {
    if (!canvas) return;

    // Cancel any ongoing custom animation
    if (customAnimId !== null) cancelAnimationFrame(customAnimId);
    customAnimId = null;

    // Update base path
    basePath = newBasePath;

    // Clear cached frames
    cache.clear();
    previousImage = null;

    // Update current and target frame
    currentFrameFloat = startFrame;
    targetFrame = startFrame;

    // Preload the new frame
    await loadFrame(startFrame);

    // Draw the first frame immediately
    const img = cache.get(startFrame);
    if (img) drawImageCover(img);
}


let customAnimId: number | null = null;

/**
 * Animate from startFrame to endFrame over duration (ms).
 * direction: 1 = forward, -1 = backward
 */
export async function animateFrames(
    startFrame: number,
    endFrame: number,
    duration: number,
    direction: 1 | -1 = 1,
    startEase: number = 0.1, // fraction of duration for fade-in
    endEase: number = 0.1    // fraction of duration for fade-out
) {
    if (!canvas) return;
    if (customAnimId !== null) cancelAnimationFrame(customAnimId);

    // Preload all frames in range
    const framesToLoad: number[] = [];
    if (direction === 1) {
        for (let f = startFrame; f !== (endFrame + 1) % totalFrames; f = (f + 1) % totalFrames) {
            framesToLoad.push(f);
            if (f === endFrame) break;
        }
    } else {
        for (let f = startFrame; f !== (endFrame - 1 + totalFrames) % totalFrames; f = (f - 1 + totalFrames) % totalFrames) {
            framesToLoad.push(f);
            if (f === endFrame) break;
        }
    }
    await Promise.all(framesToLoad.map(f => loadFrame(f)));

    const totalFramesToAnimate = framesToLoad.length;
    const startTime = performance.now();

    function speedEase(t: number): number {
        // Sine-based easing: starts slow, speeds up, slows down
        return Math.sin(Math.PI * t / 2); // simple ease-in
    }

    function stepAnimation(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0..1

        // Compute eased progress using speed ramp
        let easedProgress: number;
        if (progress < startEase) {
            easedProgress = (progress / startEase) ** 2 * startEase; // accelerate from 0
        } else if (progress > 1 - endEase) {
            const t = (progress - (1 - endEase)) / endEase;
            easedProgress = 1 - (1 - t) ** 2 * endEase; // decelerate to 1
        } else {
            // middle linear section
            const middleProgress = (progress - startEase) / (1 - startEase - endEase);
            easedProgress = startEase + middleProgress * (1 - startEase - endEase);
        }

        // Map easedProgress to actual frame index
        const frameIndex = Math.floor(easedProgress * (totalFramesToAnimate - 1));
        targetFrame = framesToLoad[frameIndex];

        const img = cache.get(targetFrame);
        if (img) drawImageCover(img);

        if (progress < 1) {
            customAnimId = requestAnimationFrame(stepAnimation);
        } else {
            customAnimId = null; // done
        }
    }

    customAnimId = requestAnimationFrame(stepAnimation);
}


export function destroyViewer() {
    if (animationId !== null) cancelAnimationFrame(animationId);
    animationId = null;
    cache.clear();
    canvas = null;
    ctx = null;
}

// Pointer handlers to be called from Vue component (or any other host)
export function handlePointerDown(e: PointerEvent) {
    if (!canvas) return;
    pointerDown = true;
    startX = e.clientX;
    startFrame = targetFrame;
    // capture pointer to keep receiving move/up even if pointer leaves canvas
    try {
        canvas.setPointerCapture?.(e.pointerId);
    } catch (err) {
        /* ignore */
    }
}

export function handlePointerMove(e: PointerEvent) {
    if (!pointerDown || !canvas) return;
    const deltaX = e.clientX - startX;
    // smaller multiplier = more responsive dragging; tweak as needed
    const pixelsPerRotation = Math.max(1, canvas.clientWidth * 0.6);
    const framesMoved = Math.floor((deltaX / pixelsPerRotation) * totalFrames);
    targetFrame = (startFrame + framesMoved) % totalFrames;
    if (targetFrame < 0) targetFrame += totalFrames;
    // prefetch nearby frames
    preloadRange(targetFrame);
}

export function handlePointerUp(e: PointerEvent) {
    pointerDown = false;
    if (!canvas) return;
    try {
        canvas.releasePointerCapture?.(e.pointerId);
    } catch (err) {
        /* ignore */
    }
}

// Optional: directly set target frame (0..totalFrames-1)
export function setTargetFrame(frame: number) {
    targetFrame = ((frame % totalFrames) + totalFrames) % totalFrames;
    preloadRange(targetFrame);
}

// ----------------- Internal helpers -----------------
async function loadFrame(i: number): Promise<HTMLImageElement> {
    const idx = ((i % totalFrames) + totalFrames) % totalFrames;
    if (cache.has(idx)) return cache.get(idx)!;

    const img = new Image();
    img.src = frameUrl(idx);
    // don't throw on decode failure — warn instead
    await img.decode().catch(() => console.warn('Failed to decode frame', idx, img.src));
    cache.set(idx, img);

    if (cache.size > maxCacheSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
    }

    return img;
}

function preloadRange(center: number) {
    for (let offset = -preloadRadius; offset <= preloadRadius; offset++) {
        const idx = (center + offset + totalFrames) % totalFrames;
        // fire-and-forget preload
        loadFrame(idx).catch(() => { });
    }
}

function resizeCanvas() {
    //return;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);

    // keep CSS sizing; this ensures drawImage uses proper resolution
    // optional: adapt CSS fit logic here if you want letterbox behavior
}

let previousImage: HTMLImageElement | null = null;

function drawImageCover(img: HTMLImageElement) {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw previous as background for subtle smoothing (optional)
    if (previousImage) {
        ctx.globalAlpha = 1;
        ctx.drawImage(previousImage, 0, 0, canvas.width, canvas.height);
    }
    ctx.globalAlpha = 1;
    // draw current frame fully (change alpha logic if you want crossfade)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    previousImage = img;
}

function getShortestDelta(curr: number, targ: number, total: number) {
    let delta = (targ - curr) % total;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    return delta;
}

function animationLoop() {
    if (!canvas) return;
    // interpolation smoothing
    const shortestDelta = getShortestDelta(currentFrameFloat, targetFrame, totalFrames);
    // damping factor controls smoothing speed: 0.2 is snappy, 0.08 is smoother
    currentFrameFloat += shortestDelta * 0.12;

    const frameIdx = Math.round((currentFrameFloat + totalFrames) % totalFrames);
    // load and draw that frame
    loadFrame(frameIdx)
        .then(img => drawImageCover(img))
        .catch(() => { /* ignore */ });

    animationId = requestAnimationFrame(animationLoop);
}

// Expose a resize adapter so parent can call on window resize
export function onHostResize() {
    resizeCanvas();
}
