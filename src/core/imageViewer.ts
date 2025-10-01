// src/core/imageViewer.ts
// Progressive staged 360 image viewer with robust cancellation/generation guards
// Exports: configure, initImageViewer, destroyViewer, handlePointerDown, handlePointerMove,
// handlePointerUp, setTargetFrame, onHostResize, changeImageSequence

// ---------------------- Configurable parameters ----------------------
let totalFrames = 180;
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
let startX = 0;

let animationId: number | null = null;
let lastDrawnFrame = -1;

// Cache stores ImageBitmap for efficient drawing
const cache: Map<number, ImageBitmap> = new Map();

// Decode queue (array of promises) to limit concurrency
let decodeQueue: Promise<any>[] = [];

// ---------------------- Cancellation / generation control ----------------------
let currentAbortController: AbortController | null = null;
let currentGenerationId = 0;

//------------------------- progress callbacks --------------------------------
let progressCallback: ((loaded: number, total: number) => void) | null = null;

export function onProgress(cb: (loaded: number, total: number) => void) {
    progressCallback = cb;
}

// ---------------------- Path builder ----------------------
let basePath = 'assets/Orbits/Exterior/Day';
function frameUrl(i: number) {
    const idx = String(i).padStart(4, '0');
    return `${basePath}/Exterior360_2.${idx}.jpeg`;
}

// ---------------------- Public API ----------------------
export function configure(options: {
    totalFrames?: number;
    preloadRadius?: number;
    maxCacheSize?: number;
    basePath?: string;
}) {
    if (typeof options.totalFrames === 'number') totalFrames = options.totalFrames;
    if (typeof options.preloadRadius === 'number') preloadRadius = options.preloadRadius;
    if (typeof options.maxCacheSize === 'number') maxCacheSize = options.maxCacheSize;
    if (typeof options.basePath === 'string') basePath = options.basePath;
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
    pointerDown = true;
    startX = e.clientX;
    startFrame = targetFrame;
    try { canvas.setPointerCapture?.(e.pointerId); } catch { }
}

export function handlePointerMove(e: PointerEvent) {
    if (!pointerDown || !canvas) return;
    let deltaX = e.clientX - startX;
    deltaX = deltaX * 0.25;
    const pixelsPerRotation = Math.max(1, canvas.clientWidth * 0.6);
    const maxFramesPerMove = 30;
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
export async function changeImageSequence(newBasePath: string, startFrame: number = Math.round(currentFrameFloat)) {
    if (!canvas) return;

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
    decodeQueue = [];

    currentFrameFloat = startFrame;
    targetFrame = startFrame;
    basePath = newBasePath;

    // Stage 1: load and draw first frame immediately
    try {
        await loadFrame(startFrame, signal, generation);
    } catch (err) {
        // swallow errors (e.g., abort)
    }
    const img = cache.get(startFrame);
    if (img) {
        drawImageCover(img);
        lastDrawnFrame = -1; // 🔁 Force next animation loop iteration to redraw too
    }
    // Kick off staged preload in background (auto-cancelled if switched again)
    stagedPreload(startFrame, signal, generation).catch(() => { /* swallow */ });
}

// ---------------------- Internal: staged preload (sparse + progressive midpoint) ----------------------
async function stagedPreload(initialFrame: number, signal: AbortSignal, generationId: number) {
    // STAGE 2: sparse frames (fire-and-forget but respect generation/signal)
    const step = getDynamicStep();
    const sparseFrames: number[] = [];
    for (let i = 0; i < totalFrames; i += step) {
        if (i !== initialFrame) sparseFrames.push(i);
    }

    // Mark loadedFrames with initialFrame loaded already (if it is)
    const loadedFrames = new Set<number>();
    if (cache.has(initialFrame)) loadedFrames.add(initialFrame);

    // Fire off sparse loads in parallel but non-blocking
    sparseFrames.forEach(f => {
        loadFrame(f, signal, generationId)
            .then(() => { if (generationId === currentGenerationId) loadedFrames.add(f); })
            .catch(() => { /* ignore */ });
    });

    // Wait a short time to allow some sparse frames to complete and populate loadedFrames
    // but do NOT block the UI. This gives the user immediate interactivity while sparse frames arrive.
    await delay(50);
    if (signal.aborted || generationId !== currentGenerationId) return;

    // Ensure loadedFrames contains what cache has so far (in case some resolved quickly)
    for (const key of cache.keys()) loadedFrames.add(key);

    // STAGE 3: progressive midpoint refinement that evenly fills gaps
    // We'll loop until all frames are loaded or sequence/generation is canceled.
    while (loadedFrames.size < totalFrames) {
        if (signal.aborted || generationId !== currentGenerationId) return;

        const sorted = Array.from(loadedFrames).sort((a, b) => a - b);

        // If nothing is currently loaded (rare but possible), include initialFrame and some sparse frames
        if (sorted.length === 0) {
            // wait a bit for sparse frames to come in
            await delay(100);
            for (const key of cache.keys()) loadedFrames.add(key);
            continue;
        }

        // Find midpoints for each gap, collect unique midpoints
        const newFrames: number[] = [];
        for (let i = 0; i < sorted.length; i++) {
            const start = sorted[i];
            const end = sorted[(i + 1) % sorted.length]; // wrap
            const gap = (end - start + totalFrames) % totalFrames;
            if (gap > 1) {
                const midpoint = (start + Math.floor(gap / 2)) % totalFrames;
                if (!loadedFrames.has(midpoint)) newFrames.push(midpoint);
            }
        }

        // if (newFrames.length === 0) {
        //   // No more midpoints: maybe some remaining single-frame gaps — load them sequentially
        //   for (let i = 0; i < totalFrames; i++) {
        //     if (signal.aborted || generationId !== currentGenerationId) return;
        //     if (!cache.has(i)) {
        //       try { await loadFrame(i, signal, generationId); loadedFrames.add(i); } catch { }
        //     }
        //   }
        //   return;
        // }

        // Load the newFrames in parallel but respect concurrency via loadFrame implementation
        await Promise.all(
            newFrames.map(f => loadFrame(f, signal, generationId).then(() => {
                if (generationId === currentGenerationId) loadedFrames.add(f);
            }).catch(() => { /* ignore */ }))
        );

        // Small pacing delay so we don't spam network/decoder on very fast networks
        await delay(20);
    }
}

// ---------------------- Internal: loadFrame (fetch + createImageBitmap) ----------------------
/**
 * Loads a frame index and stores it in cache as ImageBitmap.
 * Respects AbortSignal and generationId. Also enforces MAX_CONCURRENT_DECODE
 */
async function loadFrame(i: number, signal: AbortSignal, generationId: number): Promise<ImageBitmap> {
    // Abort quickly if the caller already cancelled
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const idx = ((i % totalFrames) + totalFrames) % totalFrames;
    if (cache.has(idx)) return cache.get(idx)!;

    // Create a promise that will perform fetch -> blob -> createImageBitmap
    const loadPromise = (async () => {
        const url = frameUrl(idx);
        // Fetch with abort support
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Failed to fetch frame ${idx}: ${res.status}`);

        const blob = await res.blob();

        // createImageBitmap may be CPU heavy, so we treat it as a decode operation to throttle
        const bitmap = await createImageBitmap(blob);
        return bitmap;
    })();

    // Add to decode queue and throttle if necessary
    decodeQueue.push(loadPromise);
    try {
        if (decodeQueue.length > MAX_CONCURRENT_DECODE) {
            // Wait for any of the currently active decodes to finish before proceeding
            await Promise.race(decodeQueue);
        }

        // Await this load (it might reject due to abort)
        const bitmap = await loadPromise;

        // If this load belongs to a stale generation, discard result
        if (generationId !== currentGenerationId || signal.aborted) {
            // close bitmap if possible
            try { bitmap.close && bitmap.close(); } catch { /* ignore */ }
            throw new DOMException('Aborted', 'AbortError');
        }

        // Store into cache (evict if necessary)
        cache.set(idx, bitmap);
        enforceCacheLimit();

        return bitmap;
    } finally {
        // Remove this promise from decodeQueue when finished/failed
        decodeQueue = decodeQueue.filter(p => p !== loadPromise);
        // report progress
        if (progressCallback) {
            progressCallback(cache.size, totalFrames);
        }
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
    console.log(delta);
    return delta;
}

function animationLoop() {
    if (!canvas) return;

    const shortestDelta = getShortestDelta(currentFrameFloat, targetFrame, totalFrames);
    currentFrameFloat += shortestDelta;
    currentFrameFloat = (currentFrameFloat + totalFrames) % totalFrames;

    const frameIdx = Math.round((currentFrameFloat + totalFrames) % totalFrames);

    if (frameIdx !== lastDrawnFrame) {
        const img = cache.get(frameIdx);
        if (img) {
            drawImageCover(img);
            lastDrawnFrame = frameIdx;
        } else {
            // If frame not loaded yet, don't draw (keeps last image visible)
        }
    }

    animationId = requestAnimationFrame(animationLoop);
}

function delay(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}
