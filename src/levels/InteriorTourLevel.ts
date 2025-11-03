import { MeshBuilder, StandardMaterial, Texture, Vector3, Animation, CubicEase, EasingFunction, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { HotspotManager } from "../core/HotspotManager";
import { eventBus } from "../core/eventBus";

export class Level_InteriorTour extends LevelBase {
    private hotspotManager: HotspotManager | null = null;
    private currentType: string | null = null;
    private skySphere: import("babylonjs").Mesh | null = null;
    private skyMaterial: import("babylonjs").StandardMaterial | null = null;
    private hotspotOpenedHandler: ((e: Event) => void) | null = null;
    private isTransitioning: boolean = false;
    // wheel handler added for FOV zoom (only for interior tour levels)
    private _wheelHandler: ((e: WheelEvent) => void) | null = null;

    constructor(engine: Engine) {
        super(engine);
    }

    /** Request exit from interior tour back to exterior. This dispatches a global event handled by BabylonViewport. */
    public ExitTour() {
        try { eventBus.dispatchEvent(new CustomEvent('interior:exit')); } catch (e) { }
    }

    protected SetupScene() {
        // camera
        this.camera.fov = 1;
        // Remove default radius-based mousewheel zoom for this camera and add FOV-based zoom
        try {
            const attached = (this.camera.inputs as any).attached;
            if (attached && attached.mousewheel) {
                this.camera.inputs.remove(attached.mousewheel);
            }
        } catch (e) {
            console.warn('[Level_InteriorTour] could not remove default mousewheel input', e);
        }

        // attach a wheel listener to the canvas to change fov (clamped)
        try {
            const canvas = this.scene.getEngine().getRenderingCanvas();
            if (canvas) {
                const minFov = 0.8;
                const maxFov = 1.9;
                const speed = 0.0015;
                this._wheelHandler = (ev: WheelEvent) => {
                    ev.preventDefault();
                    const delta = ev.deltaY;
                    const newFov = Math.max(minFov, Math.min(maxFov, this.camera.fov + delta * speed));
                    this.camera.fov = newFov;
                };
                canvas.addEventListener('wheel', this._wheelHandler as EventListener, { passive: false });
            }
        } catch (e) {
            console.warn('[Level_InteriorTour] failed to attach wheel listener', e);
        }
        // Set scene background to white (r, g, b, a)
        this.scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);
    }

    public async LoadType(type: string, duplexLevel: number = 1) {
        // Dispose any existing hotspots
        if (this.hotspotManager) {
            this.hotspotManager.Dispose();
            this.hotspotManager = null;
        }

        this.currentType = type;
        this.hotspotManager = new HotspotManager(this.actorManager, this.scene);
        await this.hotspotManager.loadHotspotsByTypeName(type);

        // Create sky sphere (panorama) and set to first hotspot if available
        try {
            // dispose existing sky if any
            if (this.skySphere) {
                try { this.skySphere.dispose(); } catch (e) { /* ignore */ }
                this.skySphere = null;
            }

            // create big sphere
            this.skySphere = MeshBuilder.CreateSphere("skySphere", { segments: 32, diameter: 1000 }, this.scene);
            this.skyMaterial = new StandardMaterial("skymat", this.scene);
            this.skyMaterial.backFaceCulling = false;
            this.skyMaterial.disableLighting = true;
            this.skySphere.material = this.skyMaterial;
            this.skySphere.scaling = new Vector3(1, -1, 1);
            let firstIndex = 0;


            // get the type data to pick the first panorama
            const projMgr = (await import("../managers/ProjectDataManager")).ProjectDataManager.getInstance();
            const typeData = projMgr.getType(type as string);
            let firstPano = typeData?.interiorTours?.tours?.find(t => t.index === 0) || typeData?.interiorTours?.tours?.[0];
            if (duplexLevel === 2) {
                firstPano = typeData?.interiorTours?.tours?.find(t => t.isDuplexStartingPoint) || firstPano;
                console.log("opening level 2 interior tour pano", firstPano);
            } else {
                console.log("opening level 1 interior tour pano", firstPano);
            }
            if (firstPano && firstPano.panoPath) {
                this.skyMaterial.emissiveTexture = new Texture(firstPano.panoPath, this.scene);
                // position sky sphere and camera to first hotspot
                this.skySphere.position = new Vector3(firstPano.position.x, firstPano.position.y, firstPano.position.z);
                try {
                    // move camera target to the hotspot and place camera very near it
                    this.camera.setTarget(new Vector3(firstPano.position.x, firstPano.position.y, firstPano.position.z));
                    // for ArcRotateCamera, set radius small so camera is at the point
                    // @ts-ignore - radius is public
                    (this.camera as any).radius = 0.1;
                } catch (e) { /* ignore */ }
            }

            // listen for hotspot opened events to switch panorama
            this.hotspotOpenedHandler = async (ev: Event) => {
                if (this.isTransitioning) return; // ignore spurious events during transition
                this.isTransitioning = true;
                try {
                    const ce = ev as CustomEvent;
                    const detail = ce.detail || {};
                    const panoPath = detail.panoPath;
                    const hotspotIndex = detail.hotspotIndex;

                    // notify UI to fade to white, then animate FOV to zoom in
                    try { eventBus.dispatchEvent(new CustomEvent('interior:transition:start')); } catch (e) { }
                    // animate FOV to zoom in
                    await this.animateFOV(0.3, 1000);

                    // swap panorama texture
                    if (panoPath && this.skyMaterial && this.skySphere) {
                        this.skyMaterial.emissiveTexture = new Texture(panoPath, this.scene);
                    }

                    // if hotspot index provided, move sky sphere and camera target
                    if (hotspotIndex !== undefined) {
                        const td = projMgr.getType(type as string);
                        const hs = td?.interiorTours?.tours?.find((t: any) => t.index === hotspotIndex);
                        if (hs) {
                            const p = hs.position;
                            if (this.skySphere) this.skySphere.position = new Vector3(p.x, p.y, p.z);
                            try { this.camera.setTarget(new Vector3(p.x, p.y, p.z)); (this.camera as any).radius = 0.1; } catch (e) { }
                        }
                    }

                    // animate FOV back out
                    this.animateFOV(1.0, 1000);
                    try { eventBus.dispatchEvent(new CustomEvent('interior:transition:end')); } catch (e) { }
                } catch (err) {
                    console.error('[Level_InteriorTour] hotspotOpenedHandler error', err);
                } finally {
                    this.isTransitioning = false;
                }
            };
            eventBus.addEventListener('interior:hotspot:opened', this.hotspotOpenedHandler as EventListener);
        } catch (err) {
            console.error('[Level_InteriorTour] Error creating sky sphere:', err);
        }

        // Notify UI and others that interior is loaded
        eventBus.dispatchEvent(new CustomEvent('interior:loaded', { detail: { typeName: type } }));
    }

    public async Close() {
        try {
            if (this.hotspotManager) {
                this.hotspotManager.Dispose();
                this.hotspotManager = null;
            }
            // dispose sky sphere and material
            try { if (this.skySphere) { this.skySphere.dispose(); this.skySphere = null; } } catch (e) { }
            try { if (this.skyMaterial) { this.skyMaterial.dispose(); this.skyMaterial = null; } } catch (e) { }
            if (this.hotspotOpenedHandler) {
                try { eventBus.removeEventListener('interior:hotspot:opened', this.hotspotOpenedHandler as EventListener); } catch (e) { }
                this.hotspotOpenedHandler = null;
            }
            // remove wheel listener if added
            try {
                const canvas = this.scene.getEngine().getRenderingCanvas();
                if (canvas && this._wheelHandler) {
                    canvas.removeEventListener('wheel', this._wheelHandler as EventListener);
                    this._wheelHandler = null;
                }
            } catch (e) { /* ignore */ }
            // dispose scene resources if needed. LevelBase's scene will be disposed by EngineManager.CloseLevel
            eventBus.dispatchEvent(new CustomEvent('interior:closed', { detail: { typeName: this.currentType } }));
        } catch (err) {
            console.error('[Level_InteriorTour] Error during Close:', err);
        }
    }

    /** Animate camera FOV to target value over duration (ms) */
    private animateFOV(targetFov: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            try {
                const anim = new Animation('fovAnim', 'fov', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                const keys = [
                    { frame: 0, value: this.camera.fov },
                    { frame: 100, value: targetFov }
                ];
                anim.setKeys(keys);
                // apply easing: ease-in when zooming in (target smaller), ease-out when zooming out
                try {
                    const ease = new CubicEase();
                    const isZoomIn = targetFov < this.camera.fov;
                    ease.setEasingMode(isZoomIn ? EasingFunction.EASINGMODE_EASEIN : EasingFunction.EASINGMODE_EASEOUT);
                    anim.setEasingFunction(ease);
                } catch (e) {
                    // ignore if easing not supported
                }
                this.camera.animations = this.camera.animations || [];
                this.camera.animations.push(anim);
                const fps = 60;
                const totalFrames = Math.max(1, Math.round((duration / 1000) * fps));
                // adjust key frames to duration
                anim.setKeys([
                    { frame: 0, value: this.camera.fov },
                    { frame: totalFrames, value: targetFov }
                ]);
                this.scene.beginAnimation(this.camera, 0, totalFrames, false, 1, () => {
                    // cleanup animations array
                    try { this.camera.animations = this.camera.animations?.filter(a => a !== anim) || []; } catch (e) { }
                    resolve();
                });
            } catch (err) {
                console.warn('[Level_InteriorTour] animateFOV failed, falling back', err);
                try { this.camera.fov = targetFov; } catch (e) { }
                resolve();
            }
        });
    }

}