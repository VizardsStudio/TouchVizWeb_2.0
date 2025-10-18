import {
    ActionManager,
    ExecuteCodeAction,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    Vector3
} from "babylonjs";
import { ProjectDataManager } from "../managers/ProjectDataManager";
import type { TypeData } from "../types/interiorTour";
import type { ActorManager } from "../managers/actorManager";
import { eventBus } from "./eventBus";

export class HotspotManager {
    private scene: Scene;
    private projectManager = ProjectDataManager.getInstance();
    private createdMeshes: import("babylonjs").AbstractMesh[] = [];

    constructor(actorManager: ActorManager, scene: Scene) {
        this.scene = scene;
        console.log("[HotspotManager] Initialized with scene:", scene);
    }

    /** Load hotspots for a type by name. If project JSON isn't loaded, attempt to load it from /assets/project.json */
    public async loadHotspotsByTypeName(typeName: string) {
        let type = this.projectManager.getType(typeName);
        if (!type) {
            console.warn(`[HotspotManager] Type '${typeName}' not found in project data. Checking if project data is loaded...`);
            // Try to load default project JSON if manager has no data
            if (!this.projectManager.getProjectData()) {
                try {
                    console.log('[HotspotManager] Project data not loaded, attempting to load /assets/project.json');
                    // relative path from app root
                    await this.projectManager.load('/assets/project.json');
                } catch (err) {
                    console.error('[HotspotManager] Failed to load project.json fallback:', err);
                }
            }

            type = this.projectManager.getType(typeName);
        }

        if (!type) {
            console.error(`[HotspotManager] Type '${typeName}' still not found after attempting to load project data`);
            try {
                eventBus.dispatchEvent(new CustomEvent('interior:error', { detail: { message: `Type '${typeName}' not found` } }));
            } catch (e) { /* ignore */ }
            return;
        }

        this.loadHotspots(type);
    }

    /** Load hotspots from a TypeData object */
    public loadHotspots(type: TypeData) {
        console.log(`[HotspotManager] Loading hotspots for type '${type.typeName}'`);

        const tours = type.interiorTours?.tours;
        if (!tours || tours.length === 0) {
            console.warn(`[HotspotManager] No hotspots found for type '${type.typeName}'`);
            return;
        }

        tours.forEach(hotspot => {
            try {
                console.log(`[HotspotManager] Creating hotspot index ${hotspot.index} at position`, hotspot.position);

                const sphere = MeshBuilder.CreateSphere(
                    `hotspot_${type.typeName}_${hotspot.index}`,
                    { diameter: 0.5 },
                    this.scene
                );
                this.createdMeshes.push(sphere);
                sphere.position = new Vector3(hotspot.position.x, hotspot.position.y, hotspot.position.z);

                if (hotspot.panoPath && hotspot.panoPath !== "No Texture found!") {
                    const mat = new StandardMaterial(`mat_${type.typeName}_${hotspot.index}`, this.scene);
                    mat.diffuseTexture = new Texture(
                        hotspot.panoPath,
                        this.scene,
                        false,
                        false,
                        Texture.BILINEAR_SAMPLINGMODE,
                        () => console.log(`[HotspotManager] Texture loaded for hotspot ${hotspot.index}`),
                        (msg, ex) => console.error(`[HotspotManager] Failed to load texture for hotspot ${hotspot.index}:`, msg, ex)
                    );
                    sphere.material = mat;
                } else {
                    console.warn(`[HotspotManager] Hotspot ${hotspot.index} has no valid panoPath`);
                }

                // Optional: click interaction
                sphere.actionManager = new ActionManager(this.scene);
                sphere.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                        console.log(`Clicked hotspot: Type ${type.typeName}, Index ${hotspot.index}`);
                        // Emit an event for UI and other systems to react
                        eventBus.dispatchEvent(new CustomEvent('interior:hotspot:opened', {
                            detail: {
                                typeName: type.typeName,
                                hotspotIndex: hotspot.index,
                                panoPath: hotspot.panoPath
                            }
                        }));
                    })
                );

                console.log(`[HotspotManager] Hotspot ${hotspot.index} created successfully`);
            } catch (err) {
                console.error(`[HotspotManager] Error creating hotspot index ${hotspot.index}:`, err);
            }
        });

        console.log(`[HotspotManager] Finished loading type '${type.typeName}'`);
    }

    /** Dispose created hotspot meshes and handlers */
    public Dispose() {
        try {
            this.createdMeshes.forEach(m => {
                try { m.dispose(); } catch (e) { console.warn('[HotspotManager] mesh dispose failed', e); }
            })
            this.createdMeshes = [];
            console.log('[HotspotManager] Disposed all hotspot meshes');
        } catch (err) {
            console.error('[HotspotManager] Error during dispose:', err);
        }
    }
}
