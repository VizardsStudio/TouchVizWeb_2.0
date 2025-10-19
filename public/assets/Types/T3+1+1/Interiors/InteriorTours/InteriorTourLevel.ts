import { MeshBuilder, StandardMaterial, Texture, Vector3, type Engine } from "babylonjs";
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

    constructor(engine: Engine) {
        super(engine);
    }

    protected SetupScene() {
        // camera
        this.camera.fov = 1;
    }

    public async LoadType(type: string) {
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

            // get the type data to pick the first panorama
            const projMgr = (await import("../managers/ProjectDataManager")).ProjectDataManager.getInstance();
            const typeData = projMgr.getType(type as string);
            const firstPano = typeData?.interiorTours?.tours?.find(t => t.index === 0) || typeData?.interiorTours?.tours?.[0];
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
            this.hotspotOpenedHandler = (ev: Event) => {
                try {
                    const ce = ev as CustomEvent;
                    const detail = ce.detail || {};
                    const panoPath = detail.panoPath;
                    const pos = detail.position || detail.position;
                    const hotspotIndex = detail.hotspotIndex;
                    if (panoPath && this.skyMaterial && this.skySphere) {
                        this.skyMaterial.emissiveTexture = new Texture(panoPath, this.scene);
                    }
                    // if position provided, move sky sphere and camera target
                    if (detail && detail.hotspotIndex !== undefined) {
                        // try to find hotspot data from project manager
                        const td = projMgr.getType(type as string);
                        const hs = td?.interiorTours?.tours?.find((t: any) => t.index === detail.hotspotIndex);
                        if (hs) {
                            const p = hs.position;
                            if (this.skySphere) this.skySphere.position = new Vector3(p.x, p.y, p.z);
                            try { this.camera.setTarget(new Vector3(p.x, p.y, p.z)); (this.camera as any).radius = 0.1; } catch (e) { }
                        }
                    }
                } catch (err) { console.error('[Level_InteriorTour] hotspotOpenedHandler error', err); }
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
            // dispose scene resources if needed. LevelBase's scene will be disposed by EngineManager.CloseLevel
            eventBus.dispatchEvent(new CustomEvent('interior:closed', { detail: { typeName: this.currentType } }));
        } catch (err) {
            console.error('[Level_InteriorTour] Error during Close:', err);
        }
    }

}