import {
    ActionManager,
    ExecuteCodeAction,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
    Mesh,
    AbstractMesh
} from "babylonjs";
import { ProjectDataManager } from "../managers/ProjectDataManager";
import type { TypeData } from "../types/interiorTour";
import type { ActorManager } from "../managers/actorManager";
import { eventBus } from "./eventBus";

export class HotspotManager {
    private scene: Scene;
    private projectManager = ProjectDataManager.getInstance();
    public createdMeshes: AbstractMesh[] = [];
    // store registered beforeRender observers so we can remove them on dispose
    private beforeRenderObserverHandles: Array<{ mesh: AbstractMesh; fn: () => void }> = [];
    public visibilityDict: { [key: number]: number[] } = {};
    public selectedIndex: number = 0;

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

                // Create a plane that will always face the camera (billboard behavior)
                const plane = MeshBuilder.CreatePlane(
                    `hotspot_${type.typeName}_${hotspot.index}`,
                    { size: 1 },
                    this.scene
                );
                this.createdMeshes.push(plane);
                plane.position = new Vector3(hotspot.position.x, hotspot.position.y, hotspot.position.z);
                this.visibilityDict[hotspot.index] = hotspot.visibleHotspots;
                plane.metadata = { index: hotspot.index };


                // make the plane face the camera
                // using billboardMode makes the mesh always face the active camera
                // (value 7 matches BABYLON.Mesh.BILLBOARDMODE_ALL)
                // but since we import Mesh above we can reference the constant
                // however to avoid relying on enum values, use the property directly
                // (TypeScript knows BILLBOARDMODE_ALL exists on AbstractMesh)
                try {
                    // @ts-ignore -- some BABYLON typings expose BILLBOARDMODE_* on Mesh
                    (plane as any).billboardMode = Mesh.BILLBOARDMODE_ALL || 7;
                } catch (e) {
                    (plane as any).billboardMode = 7;
                }

                // Apply hotspot PNG texture (separate small icon), fallback to a default small circle if none
                const mat = new StandardMaterial(`mat_${type.typeName}_${hotspot.index}`, this.scene);
                // hotspot data may not include a custom hotspot texture; fall back to a default icon
                const hotspotTexturePath = (hotspot as any).hotspotTexture || '/assets/default_hotspot.png';
                mat.diffuseTexture = new Texture(
                    hotspotTexturePath,
                    this.scene,
                    false,
                    false,
                    Texture.TRILINEAR_SAMPLINGMODE,
                    () => console.log(`[HotspotManager] Hotspot texture loaded for ${hotspot.index}`),
                    (msg, ex) => console.error(`[HotspotManager] Failed to load hotspot texture for ${hotspot.index}:`, msg, ex)
                );
                // ensure the plane is rendered with transparency if PNG has alpha
                try {
                    // prefer setting the texture's hasAlpha flag if available
                    if (mat.diffuseTexture) {
                        (mat.diffuseTexture as any).hasAlpha = true;
                    }
                    mat.backFaceCulling = false;
                } catch (e) {
                    mat.backFaceCulling = false;
                }
                plane.material = mat;

                // scale down to a comfortable clickable size
                plane.scaling = new Vector3(0.6, 0.6, 0.6);

                // Optional: pulsing scale animation via beforeRender observer
                let pulseDirection = 1; // 1 = growing, -1 = shrinking
                const baseScale = 0.3;
                const pulseRange = 0.04; // how much to scale up/down
                const pulseSpeed = 0.2; // how fast the pulse oscillates

                const pulseFn = () => {
                    try {
                        const dt = (this.scene.getEngine().getDeltaTime() || 16) / 1000; // seconds
                        const scaleChange = pulseDirection * pulseSpeed * dt * 0.5;
                        const cur = plane.scaling.x;
                        let next = cur + scaleChange;
                        if (next > baseScale + pulseRange) { next = baseScale + pulseRange; pulseDirection = -1; }
                        if (next < baseScale - pulseRange) { next = baseScale - pulseRange; pulseDirection = 1; }
                        plane.scaling.set(next, next, next);
                    } catch (e) {
                        console.warn('[HotspotManager] pulseFn error', e);
                    }
                };
                this.beforeRenderObserverHandles.push({ mesh: plane, fn: pulseFn });
                this.scene.onBeforeRenderObservable.add(pulseFn);

                // Click interaction
                plane.actionManager = new ActionManager(this.scene);
                plane.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                        console.log(`Clicked hotspot: Type ${type.typeName}, Index ${hotspot.index}`);
                        this.selectedIndex = hotspot.index;
                        //try hidding all hotspot meshes just to test
                        console.log(this.visibilityDict);
                        console.log("selected index:", this.selectedIndex);
                        this.createdMeshes.forEach(mesh => {
                            if (this.visibilityDict[this.selectedIndex].includes(mesh.metadata.index)) {
                                mesh.isVisible = true;
                            } else {
                                mesh.isVisible = false;
                            }
                        });
                        eventBus.dispatchEvent(new CustomEvent('interior:hotspot:opened', {
                            detail: {
                                typeName: type.typeName,
                                hotspotIndex: hotspot.index,
                                panoPath: hotspot.panoPath
                            }
                        }));
                    })
                );

                console.log(`[HotspotManager] Hotspot ${hotspot.index} created successfully (plane)`);
            } catch (err) {
                console.error(`[HotspotManager] Error creating hotspot index ${hotspot.index}:`, err);
            }
        });

        this.createdMeshes.forEach(mesh => {
            if (this.visibilityDict[this.selectedIndex].includes(mesh.metadata.index)) {
                mesh.isVisible = true;
            } else {
                mesh.isVisible = false;
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
