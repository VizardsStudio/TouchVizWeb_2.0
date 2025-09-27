// src/core/imageViewer.ts
// Fully self-contained image viewer core that exposes init/destroy and pointer handlers.
// Adjust `basePath` if your images are located elsewhere (public/ or CDN).

const totalFrames = 180;
let preloadRadius = 10;
let maxCacheSize = 60;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

let currentFrameFloat = 0;
let targetFrame = 0;
let startFrame = 0;

// pointer drag state
let pointerDown = false;
let startX = 0;

// rendering/cache
const cache: Map<number, HTMLImageElement> = new Map();
let animationId: number | null = null;
let previousImage: HTMLImageElement | null = null;

// concurrency control for decoding
const MAX_CONCURRENT_DECODE = 3;
let decodeQueue: Promise<any>[] = [];

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
    }
    if (options.preloadRadius !== undefined) preloadRadius = options.preloadRadius;
    if (options.maxCacheSize !== undefined) maxCacheSize = options.maxCacheSize;
    if (options.basePath !== undefined) basePath = options.basePath;
}

export function initImageViewer(canvasEl: HTMLCanvasElement, initialFrame: number) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('2D context not available');

    canvas.style.touchAction = 'none';
    resizeCanvas();

    preloadRange(initialFrame);
    currentFrameFloat = initialFrame;
    targetFrame = initialFrame;
    animationLoop();
}

/**
 * Change the current image sequence (e.g., time of day)
 */
export async function changeImageSequence(newBasePath: string, startFrame: number = Math.round(currentFrameFloat)) {
    if (!canvas) return;

    if (customAnimId !== null) cancelAnimationFrame(customAnimId);
    customAnimId = null;

    basePath = newBasePath;
    cache.clear();
    previousImage = null;

    currentFrameFloat = startFrame;
    targetFrame = startFrame;

    await loadFrame(startFrame);
    const img = cache.get(startFrame);
    if (img) drawImageCover(img);
}

let customAnimId: number | null = null;

export async function animateFrames(
    startFrame: number,
    endFrame: number,
    duration: number,
    direction: 1 | -1 = 1,
    startEase: number = 0.1,
    endEase: number = 0.1
) {
    if (!canvas) return;
    if (customAnimId !== null) cancelAnimationFrame(customAnimId);

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

    // preload sequentially for stability
    for (const f of framesToLoad) {
        await loadFrame(f);
    }

    const totalFramesToAnimate = framesToLoad.length;
    const startTime = performance.now();

    function stepAnimation(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        let easedProgress: number;
        if (progress < startEase) {
            easedProgress = (progress / startEase) ** 2 * startEase;
        } else if (progress > 1 - endEase) {
            const t = (progress - (1 - endEase)) / endEase;
            easedProgress = 1 - (1 - t) ** 2 * endEase;
        } else {
            const middleProgress = (progress - startEase) / (1 - startEase - endEase);
            easedProgress = startEase + middleProgress * (1 - startEase - endEase);
        }

        const frameIndex = Math.floor(easedProgress * (totalFramesToAnimate - 1));
        targetFrame = framesToLoad[frameIndex];

        const img = cache.get(targetFrame);
        if (img) drawImageCover(img);

        if (progress < 1) {
            customAnimId = requestAnimationFrame(stepAnimation);
        } else {
            customAnimId = null;
        }
        //console.log("final frame", frameIndex, framesToLoad.length - 1)

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

// Pointer handlers
export function handlePointerDown(e: PointerEvent) {
    if (!canvas) return;
    pointerDown = true;
    startX = e.clientX;
    startFrame = targetFrame;
    try { canvas.setPointerCapture?.(e.pointerId); } catch { }
}

export function handlePointerMove(e: PointerEvent) {
    if (!pointerDown || !canvas) return;
    let deltaX = e.clientX - startX;
    deltaX = deltaX * 0.25
    const pixelsPerRotation = Math.max(1, canvas.clientWidth * 0.6);
    const maxFramesPerMove = 30;
    const framesMoved = Math.max(-maxFramesPerMove, Math.min(maxFramesPerMove, Math.floor((deltaX / pixelsPerRotation) * totalFrames)));
    targetFrame = (startFrame + framesMoved) % totalFrames;
    if (targetFrame < 0) targetFrame += totalFrames;

    preloadRange(targetFrame);
}

export function handlePointerUp(e: PointerEvent) {
    pointerDown = false;
    if (!canvas) return;
    try { canvas.releasePointerCapture?.(e.pointerId); } catch { }
}

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

    const decodePromise = img.decode()
        .catch(() => console.warn('Failed to decode frame', idx, img.src))
        .then(() => {
            cache.set(idx, img);
            decodeQueue = decodeQueue.filter(p => p !== decodePromise);
        });

    decodeQueue.push(decodePromise);

    if (decodeQueue.length > MAX_CONCURRENT_DECODE) {
        await Promise.race(decodeQueue);
    }

    if (cache.size > maxCacheSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
    }

    await decodePromise;
    return img;
}

function preloadRange(center: number) {
    const framesToPreload: number[] = [];
    for (let offset = -preloadRadius; offset <= preloadRadius; offset++) {
        const idx = (center + offset + totalFrames) % totalFrames;
        framesToPreload.push(idx);
    }
    for (const f of framesToPreload) loadFrame(f).catch(() => { });
}

function resizeCanvas() {
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
}

function drawImageCover(img: HTMLImageElement) {
    if (!ctx || !canvas) return;
    // remove clearing to avoid flicker
    //ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    //previousImage = img;
}

function getShortestDelta(curr: number, targ: number, total: number) {
    let delta = (targ - curr) % total;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    return delta;
}

function animationLoop() {
    if (!canvas) return;
    const shortestDelta = getShortestDelta(currentFrameFloat, targetFrame, totalFrames);
    currentFrameFloat += shortestDelta;

    const frameIdx = Math.round((currentFrameFloat + totalFrames) % totalFrames);
    loadFrame(frameIdx).then(img => drawImageCover(img)).catch(() => { });

    animationId = requestAnimationFrame(animationLoop);
}

export function onHostResize() {
    resizeCanvas();
}
