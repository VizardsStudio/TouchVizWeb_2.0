// src/core/imageViewer.ts
// Progressive staged 360 image viewer with robust cancellation/generation guards
// Exports: configure, initImageViewer, destroyViewer, handlePointerDown, handlePointerMove,
// handlePointerUp, setTargetFrame, onHostResize, changeImageSequence
import { useAppStore } from "../Stores/AppStore";

// ---------------------- Configurable parameters ----------------------
let totalFrames = 180;
let frameStep = 1; // 1 = load every frame, 2 = load every 2nd frame
let logicalTotalFrames = totalFrames; // original full sequence
let preloadRadius = 10;
let maxCacheSize = totalFrames;

// concurrency for decoding (createImageBitmap)
const MAX_CONCURRENT_DECODE = 6;

// ---------------------- Rendering state ----------------------
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

let currentFrameFloat = 0;
let targetFrame = 0;
let startFrame = 0;

let pointerDown = false;
let highRes = false; // default low-res
let startX = 0;

let animationId: number | null = null;
let lastDrawnFrame = -1;

// Cache stores ImageBitmap for efficient drawing
const cache: Map<number, ImageBitmap> = new Map();
const highResCache: Map<number, ImageBitmap> = new Map();


// Decode queue (array of promises) to limit concurrency
let decodeQueue: Promise<any>[] = [];

// ---------------------- Cancellation / generation control ----------------------
let currentAbortController: AbortController | null = null;
let highResAbortController: AbortController | null = null;
let currentGenerationId = 0;

//------------------------- progress callbacks --------------------------------
let progressCallback: ((loaded: number, total: number) => void) | null = null;

setFrameStep(4); // initialize totalFrames based on frameStep

export function onProgress(cb: (loaded: number, total: number) => void) {
    progressCallback = cb;
}

// ---------------------- Path builder ----------------------
let basePath = 'assets/Orbits/Exterior/Day';
let ext = 'webp';
function frameUrl(i: number, ext: string) {
    const actualIdx = i * frameStep; // map to original full sequence
    const idx = String(actualIdx).padStart(4, '0');
    const suffix = highRes ? '' : '_LD';
    return `${basePath}/${idx}${suffix}.${ext}`;
}

async function loadHighResCurrentFrame() {
    if (!canvas) return;


    // Cancel any previous high-res request
    if (highResAbortController) {
        highResAbortController.abort();
    }

    highResAbortController = new AbortController();
    const signal = highResAbortController.signal;

    highRes = true;
    const store = useAppStore();
    const frame = Math.round(currentFrameFloat) % totalFrames;

    // Check cache first
    if (highResCache.has(frame)) {
        drawImageCover(highResCache.get(frame)!);
        lastDrawnFrame = frame;
        store.setHighResLoaded(true);
        return;
    }

    try {
        const idx = frame * frameStep;
        const url = `${basePath}/${String(idx).padStart(4, '0')}.${ext}`;

        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Failed to fetch high-res frame ${frame}`);

        const blob = await res.blob();
        if (signal.aborted) return; // stop if aborted mid-way

        const bitmap = await createImageBitmap(blob);

        if (signal.aborted) {
            bitmap.close?.();
            return;
        }

        highResCache.set(frame, bitmap);
        console.log(`High-res frame ${frame} loaded`);
        drawImageCover(bitmap);
        lastDrawnFrame = frame;
        store.setHighResLoaded(true);
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            // expected cancellation, ignore
        } else {
            console.warn("High-res load failed", err);
        }
    }
}




// ---------------------- Public API ----------------------
export function configure(options: {
    totalFrames?: number;
    preloadRadius?: number;
    maxCacheSize?: number;
    basePath?: string;
    frameStep?: number;
}) {
    if (typeof options.totalFrames === 'number') {
        totalFrames = options.totalFrames;
        logicalTotalFrames = totalFrames; // save original count
    }
    if (typeof options.preloadRadius === 'number') preloadRadius = options.preloadRadius;
    if (typeof options.maxCacheSize === 'number') maxCacheSize = options.maxCacheSize;
    if (typeof options.basePath === 'string') basePath = options.basePath;
    if (typeof options.frameStep === 'number') frameStep = Math.max(1, options.frameStep);

    // Adjust totalFrames to reflect skipped frames
    totalFrames = Math.ceil(logicalTotalFrames / frameStep);
}

/**
 * Initialize viewer with a canvas element and initial frame.
 * Starts staged preload in background.
 */
export async function initImageViewer(canvasEl: HTMLCanvasElement, initialFrame: number) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');

    canvas.style.touchAction = 'none';
    resizeCanvas();

    // Reset generation/controller for a fresh start
    if (currentAbortController) currentAbortController.abort();
    currentGenerationId++;
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    const generation = currentGenerationId;

    currentFrameFloat = initialFrame;
    targetFrame = initialFrame;

    // Stage 1: load and draw first frame synchronously (await so user sees something)
    try {
        await loadFrame(initialFrame, signal, generation);
    } catch (err) {
        // Ignored — still try to continue
    }
    const img = cache.get(initialFrame);
    if (img) drawImageCover(img);
    // Kick off Stage 2 + 3 in background (non-blocking)
    stagedPreload(initialFrame, signal, generation).catch(() => { /* swallow */ });
    loadHighResCurrentFrame().then(() => {
        // Optional: reset highRes to false for normal drag frames
        highRes = false;
    });
    // Start render loop
    animationLoop();
}

export function destroyViewer() {
    if (animationId !== null) cancelAnimationFrame(animationId);
    animationId = null;

    if (currentAbortController) currentAbortController.abort();
    currentAbortController = null;
    currentGenerationId++;

    cache.forEach(b => b.close && b.close()); // ImageBitmap has close() in some contexts
    cache.clear();
    decodeQueue = [];

    canvas = null;
    ctx = null;
    lastDrawnFrame = -1;
}

// Pointer handlers
export function handlePointerDown(e: PointerEvent) {
    if (!canvas) return;

    // abort high-res loading on drag
    if (highResAbortController) highResAbortController.abort();

    highResCache.forEach(b => b.close?.());
    highResCache.clear();

    pointerDown = true;
    startX = e.clientX;
    startFrame = targetFrame;
    highRes = false;
    canvas.setPointerCapture?.(e.pointerId);
}


export function handlePointerMove(e: PointerEvent) {
    if (!pointerDown || !canvas) return;
    let deltaX = e.clientX - startX;
    deltaX = deltaX * 0.5;
    const pixelsPerRotation = Math.max(1, canvas.clientWidth * 0.6);
    const maxFramesPerMove = totalFrames;
    const framesMoved = Math.max(
        -maxFramesPerMove,
        Math.min(maxFramesPerMove, Math.floor((deltaX / pixelsPerRotation) * totalFrames))
    );
    targetFrame = (startFrame + framesMoved) % totalFrames;
    if (targetFrame < 0) targetFrame += totalFrames;
}

export function handlePointerUp(e: PointerEvent) {
    pointerDown = false;
    if (!canvas) return;
    try { canvas.releasePointerCapture?.(e.pointerId); } catch { }
    // Upgrade to high-res image for the final frame

    setTimeout(() => {
        loadHighResCurrentFrame();
    }, 50);
}

/**
 * Programmatic frame set (keeps behavior consistent)
 */
export function setTargetFrame(frame: number) {
    targetFrame = ((frame % totalFrames) + totalFrames) % totalFrames;
}

// Resize handler
export function onHostResize() {
    resizeCanvas();
}

// ---------------------- Change image sequence ----------------------
/**
 * Switch to a new basePath/sequence (e.g., Day -> Night).
 * Cancels any pending loads from previous sequence and restarts staged preload.
 */
export async function changeImageSequence(newBasePath: string, extention: string, startFrame: number = Math.round(currentFrameFloat)) {
    if (!canvas) return;
    highRes = false; // reset to low-res
    // Cancel previous loads
    if (currentAbortController) currentAbortController.abort();


    // New generation + controller
    currentGenerationId++;
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    const generation = currentGenerationId;

    // Reset visual state
    cache.forEach(b => b.close && b.close());
    cache.clear();
    highResCache.forEach(b => b.close && b.close());
    highResCache.clear();
    decodeQueue = [];

    currentFrameFloat = startFrame;
    targetFrame = startFrame;
    basePath = newBasePath;
    ext = extention;

    // Stage 1: load and draw first frame immediately as high-res
    try {
        await loadFrame(startFrame, signal, generation, true); // forceHighRes = true
    } catch (err) { /* swallow */ }

    const img = highResCache.get(startFrame) ?? cache.get(startFrame);
    if (img) {
        drawImageCover(img);
        lastDrawnFrame = -1;
    }
    // Kick off staged preload in background (auto-cancelled if switched again)
    stagedPreload(startFrame, signal, generation).catch(() => { /* swallow */ });
}

// ---------------------- Internal: staged preload (sparse + progressive midpoint) ----------------------
async function stagedPreload(initialFrame: number, signal: AbortSignal, generationId: number) {
    const sparseFrames: number[] = [];
    for (let i = 0; i < totalFrames; i++) { // already reduced by frameStep
        if (i !== initialFrame) sparseFrames.push(i);
    }

    const loadedFrames = new Set<number>();
    if (cache.has(initialFrame)) loadedFrames.add(initialFrame);

    sparseFrames.forEach(f => {
        loadFrame(f, signal, generationId)
            .then(() => { if (generationId === currentGenerationId) loadedFrames.add(f); })
            .catch(() => { /* ignore */ });
    });

    await delay(50);
    if (signal.aborted || generationId !== currentGenerationId) return;

    for (const key of cache.keys()) loadedFrames.add(key);

    while (loadedFrames.size < totalFrames) {
        if (signal.aborted || generationId !== currentGenerationId) return;

        const sorted = Array.from(loadedFrames).sort((a, b) => a - b);
        if (sorted.length === 0) {
            await delay(100);
            for (const key of cache.keys()) loadedFrames.add(key);
            continue;
        }

        const newFrames: number[] = [];
        for (let i = 0; i < sorted.length; i++) {
            const start = sorted[i];
            const end = sorted[(i + 1) % sorted.length];
            const gap = (end - start + totalFrames) % totalFrames;
            if (gap > 1) {
                const midpoint = (start + Math.floor(gap / 2)) % totalFrames;
                if (!loadedFrames.has(midpoint)) newFrames.push(midpoint);
            }
        }

        await Promise.all(
            newFrames.map(f => loadFrame(f, signal, generationId).then(() => {
                if (generationId === currentGenerationId) loadedFrames.add(f);
            }).catch(() => { }))
        );

        await delay(20);
    }
}

export function setFrameStep(n: number) {
    frameStep = Math.max(1, n);
    totalFrames = Math.ceil(logicalTotalFrames / frameStep);
}


// ---------------------- Internal: loadFrame (fetch + createImageBitmap) ----------------------
/**
 * Loads a frame index and stores it in cache as ImageBitmap.
 * Respects AbortSignal and generationId. Also enforces MAX_CONCURRENT_DECODE
 */
async function loadFrame(i: number, signal: AbortSignal, generationId: number, forceHighRes = false): Promise<ImageBitmap> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const idx = ((i % totalFrames) + totalFrames) % totalFrames;

    // Decide which cache & suffix to use
    const useHighRes = forceHighRes || highRes;
    const frameCache = useHighRes ? highResCache : cache;

    if (frameCache.has(idx)) return frameCache.get(idx)!;

    const loadPromise = (async () => {
        const actualIdx = idx * frameStep;
        const suffix = useHighRes ? '' : '_LD';
        const url = `${basePath}/${String(actualIdx).padStart(4, '0')}${suffix}.${ext}`;

        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Failed to fetch frame ${idx}`);

        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);
        return bitmap;
    })();

    decodeQueue.push(loadPromise);
    try {
        if (decodeQueue.length > MAX_CONCURRENT_DECODE) {
            await Promise.race(decodeQueue);
        }

        const bitmap = await loadPromise;

        if (generationId !== currentGenerationId || signal.aborted) {
            try { bitmap.close && bitmap.close(); } catch { }
            throw new DOMException('Aborted', 'AbortError');
        }

        frameCache.set(idx, bitmap);
        enforceCacheLimit();
        return bitmap;
    } finally {
        decodeQueue = decodeQueue.filter(p => p !== loadPromise);
        if (progressCallback) progressCallback(cache.size, totalFrames);
    }
}


// ---------------------- Helpers ----------------------
function getDynamicStep(): number {
    if (totalFrames <= 180) return 10;
    if (totalFrames <= 360) return 15;
    return Math.max(5, Math.floor(totalFrames / 24));
}

function enforceCacheLimit() {
    while (cache.size > maxCacheSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey === undefined) break;
        const bmp = cache.get(firstKey);
        if (bmp) try { bmp.close && bmp.close(); } catch { /* ignore */ }
        cache.delete(firstKey);
    }
}

function resizeCanvas() {
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawnFrame = -1;
}

function drawImageCover(bitmap: ImageBitmap) {
    if (!ctx || !canvas) return;
    // drawImage accepts ImageBitmap; automatically handles scaling
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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
    currentFrameFloat = (currentFrameFloat + totalFrames) % totalFrames;

    const frameIdx = Math.round((currentFrameFloat + totalFrames) % totalFrames);

    // if (frameIdx !== lastDrawnFrame) {
    //     const img = cache.get(frameIdx);
    //     if (img) {
    //         drawImageCover(img);
    //         lastDrawnFrame = frameIdx;
    //     } else {
    //         // If frame not loaded yet, don't draw (keeps last image visible)
    //     }
    // }

    if (frameIdx !== lastDrawnFrame) {
        // Prefer high-res if available
        const highImg = highResCache.get(frameIdx);
        if (highImg) {
            drawImageCover(highImg);
            lastDrawnFrame = frameIdx;
        } else {
            const lowImg = cache.get(frameIdx);
            if (lowImg) {
                drawImageCover(lowImg);
                lastDrawnFrame = frameIdx;
            } else {
                // frame not loaded yet, keep last image visible
            }
        }
    }

    animationId = requestAnimationFrame(animationLoop);
}

function delay(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}
