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
import type { TypeData } from "../managers/ProjectDataManager"
import type { ActorManager } from "../managers/actorManager";

export class HotspotManager {
    private scene: Scene;
    private projectManager = ProjectDataManager.getInstance();

    constructor(actorManager: ActorManager, scene: Scene) {
        this.scene = scene;
        console.log("[HotspotManager] Initialized with scene:", scene);
    }

    /** Load hotspots for a type by name */
    public loadHotspotsByTypeName(typeName: string) {
        const type = this.projectManager.getType(typeName);
        if (!type) {
            console.error(`[HotspotManager] Type '${typeName}' not found in project data`);
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
                    })
                );

                console.log(`[HotspotManager] Hotspot ${hotspot.index} created successfully`);
            } catch (err) {
                console.error(`[HotspotManager] Error creating hotspot index ${hotspot.index}:`, err);
            }
        });

        console.log(`[HotspotManager] Finished loading type '${type.typeName}'`);
    }
}
