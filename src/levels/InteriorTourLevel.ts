import { MeshBuilder, StandardMaterial, Texture, Vector3, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { HotspotManager } from "../core/HotspotManager";
import { eventBus } from "../core/eventBus";

export class Level_InteriorTour extends LevelBase {
    private hotspotManager: HotspotManager | null = null;
    private currentType: string | null = null;

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

        // Notify UI and others that interior is loaded
        eventBus.dispatchEvent(new CustomEvent('interior:loaded', { detail: { typeName: type } }));
    }

    public async Close() {
        try {
            if (this.hotspotManager) {
                this.hotspotManager.Dispose();
                this.hotspotManager = null;
            }
            // dispose scene resources if needed. LevelBase's scene will be disposed by EngineManager.CloseLevel
            eventBus.dispatchEvent(new CustomEvent('interior:closed', { detail: { typeName: this.currentType } }));
        } catch (err) {
            console.error('[Level_InteriorTour] Error during Close:', err);
        }
    }

}