// // src/core/imageViewer.ts
// // Progressive staged 360 image viewer: instant first frame, sparse preload, then full refinement.

// let totalFrames = 180;
// let preloadRadius = 10;
// let maxCacheSize = 180;

// let canvas: HTMLCanvasElement | null = null;
// let ctx: CanvasRenderingContext2D | null = null;

// let currentFrameFloat = 0;
// let targetFrame = 0;
// let startFrame = 0;

// let pointerDown = false;
// let startX = 0;

// const cache: Map<number, HTMLImageElement> = new Map();
// let animationId: number | null = null;
// let previousImage: HTMLImageElement | null = null;

// const MAX_CONCURRENT_DECODE = 6; // slightly higher for faster stage 2
// let decodeQueue: Promise<any>[] = [];

// let basePath = 'assets/Orbits/Exterior/Day';
// function frameUrl(i: number) {
//     const idx = String(i).padStart(4, '0');
//     return `${basePath}/Exterior360_2.${idx}.jpeg`;
// }

// // ----------------- Public API -----------------
// export function configure(options: {
//     totalFrames?: number;
//     preloadRadius?: number;
//     maxCacheSize?: number;
//     basePath?: string;
// }) {
//     if (options.totalFrames) totalFrames = options.totalFrames;
//     if (options.preloadRadius !== undefined) preloadRadius = options.preloadRadius;
//     if (options.maxCacheSize !== undefined) maxCacheSize = options.maxCacheSize;
//     if (options.basePath !== undefined) basePath = options.basePath;
// }

// export async function initImageViewer(canvasEl: HTMLCanvasElement, initialFrame: number) {
//     canvas = canvasEl;
//     ctx = canvas.getContext('2d');
//     if (!ctx) throw new Error('2D context not available');

//     canvas.style.touchAction = 'none';
//     resizeCanvas();

//     currentFrameFloat = initialFrame;
//     targetFrame = initialFrame;

//     // 🪄 Stage 1: Draw first frame instantly
//     await loadFrame(initialFrame);
//     const img = cache.get(initialFrame);
//     if (img) drawImageCover(img);

//     // 🚀 Stage 2 + 3: kick off progressive loading
//     stagedPreload(initialFrame).catch(console.error);

//     animationLoop();
// }

// export function destroyViewer() {
//     if (animationId !== null) cancelAnimationFrame(animationId);
//     animationId = null;
//     cache.clear();
//     canvas = null;
//     ctx = null;
// }

// // ----------------- Pointer Handlers -----------------
// export function handlePointerDown(e: PointerEvent) {
//     if (!canvas) return;
//     pointerDown = true;
//     startX = e.clientX;
//     startFrame = targetFrame;
//     try { canvas.setPointerCapture?.(e.pointerId); } catch { }
// }

// export function handlePointerMove(e: PointerEvent) {
//     if (!pointerDown || !canvas) return;
//     let deltaX = e.clientX - startX;
//     deltaX = deltaX * 0.25;
//     const pixelsPerRotation = Math.max(1, canvas.clientWidth * 0.6);
//     const maxFramesPerMove = 30;
//     const framesMoved = Math.max(
//         -maxFramesPerMove,
//         Math.min(maxFramesPerMove, Math.floor((deltaX / pixelsPerRotation) * totalFrames))
//     );
//     targetFrame = (startFrame + framesMoved) % totalFrames;
//     if (targetFrame < 0) targetFrame += totalFrames;
// }

// export function handlePointerUp(e: PointerEvent) {
//     pointerDown = false;
//     if (!canvas) return;
//     try { canvas.releasePointerCapture?.(e.pointerId); } catch { }
// }

// // ----------------- Progressive Preload Logic -----------------

// /**
//  * Progressive 3-stage preload:
//  * 1️⃣ First frame drawn immediately (already done in init)
//  * 2️⃣ Sparse preload: load every Nth frame
//  * 3️⃣ Full refinement: load remaining frames in background
//  */
// async function stagedPreload(initialFrame: number) {
//     // Stage 2: Sparse frames
//     const step = getDynamicStep();
//     const sparseFrames: number[] = [];
//     for (let i = 0; i < totalFrames; i += step) {
//         if (i !== initialFrame) sparseFrames.push(i);
//     }

//     // Fire sparse loads without awaiting them all
//     sparseFrames.forEach(f => loadFrame(f).catch(() => { }));

//     // Track loaded frames
//     const loadedFrames = new Set<number>([initialFrame, ...sparseFrames]);

//     // Stage 3: progressive midpoint refinement
//     (async () => {
//         while (loadedFrames.size < totalFrames) {
//             // Sort loaded frames
//             const sorted = Array.from(loadedFrames).sort((a, b) => a - b);

//             const newFrames: number[] = [];
//             for (let i = 0; i < sorted.length; i++) {
//                 const start = sorted[i];
//                 const end = sorted[(i + 1) % sorted.length]; // wrap around
//                 let gap = (end - start + totalFrames) % totalFrames;

//                 if (gap > 1) {
//                     const midpoint = (start + Math.floor(gap / 2)) % totalFrames;
//                     if (!loadedFrames.has(midpoint)) {
//                         newFrames.push(midpoint);
//                     }
//                 }
//             }

//             if (newFrames.length === 0) break;

//             // Fire off new frames in parallel (respect concurrency)
//             await Promise.all(newFrames.map(f => loadFrame(f).then(() => loadedFrames.add(f)).catch(() => { })));

//             // Optional small delay to prevent network/CPU spikes
//             await new Promise(r => setTimeout(r, 20));
//         }
//     })();
// }


// function getDynamicStep(): number {
//     if (totalFrames <= 180) return 10;
//     if (totalFrames <= 360) return 15;
//     return Math.max(5, Math.floor(totalFrames / 24));
// }

// // ----------------- Internals -----------------
// async function loadFrame(i: number): Promise<HTMLImageElement> {
//     const idx = ((i % totalFrames) + totalFrames) % totalFrames;
//     if (cache.has(idx)) return cache.get(idx)!;

//     const img = new Image();
//     img.src = frameUrl(idx);

//     const decodePromise = new Promise<void>((resolve, reject) => {
//         img.onload = () => resolve();
//         img.onerror = reject;
//     }).then(() => {
//         cache.set(idx, img);
//         decodeQueue = decodeQueue.filter(p => p !== decodePromise);
//     });

//     decodeQueue.push(decodePromise);
//     if (decodeQueue.length > MAX_CONCURRENT_DECODE) {
//         await Promise.race(decodeQueue);
//     }

//     if (cache.size > maxCacheSize) {
//         const firstKey = cache.keys().next().value;
//         if (firstKey !== undefined) cache.delete(firstKey);
//     }

//     await decodePromise;
//     return img;
// }

// function resizeCanvas() {
//     if (!canvas) return;
//     const dpr = Math.max(1, window.devicePixelRatio || 1);
//     canvas.width = Math.round(canvas.clientWidth * dpr);
//     canvas.height = Math.round(canvas.clientHeight * dpr);
// }

// function drawImageCover(img: HTMLImageElement) {
//     if (!ctx || !canvas) return;
//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
// }

// function getShortestDelta(curr: number, targ: number, total: number) {
//     let delta = (targ - curr) % total;
//     if (delta > total / 2) delta -= total;
//     if (delta < -total / 2) delta += total;
//     return delta;
// }

// let lastDrawnFrame = -1;
// function animationLoop() {
//     if (!canvas) return;

//     const shortestDelta = getShortestDelta(currentFrameFloat, targetFrame, totalFrames);
//     currentFrameFloat += shortestDelta;

//     const frameIdx = Math.round((currentFrameFloat + totalFrames) % totalFrames);

//     if (frameIdx !== lastDrawnFrame) {
//         const img = cache.get(frameIdx);
//         if (img) {
//             drawImageCover(img);
//             lastDrawnFrame = frameIdx;
//         }
//     }

//     animationId = requestAnimationFrame(animationLoop);
// }

// export function onHostResize() {
//     resizeCanvas();
// }
// export async function changeImageSequence(newBasePath: string, startFrame: number = Math.round(currentFrameFloat)) {
//     if (!canvas) return;

//     // Clear previous state
//     cache.clear();
//     previousImage = null;
//     currentFrameFloat = startFrame;
//     targetFrame = startFrame;

//     // Update base path
//     basePath = newBasePath;

//     // Stage 1: draw first frame immediately
//     await loadFrame(startFrame);
//     const img = cache.get(startFrame);
//     if (img) drawImageCover(img);

//     // Stage 2 + 3: progressive preload
//     stagedPreload(startFrame).catch(console.error);
// }
