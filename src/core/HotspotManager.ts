import {
    ActionManager,
    ExecuteCodeAction,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    Vector3
} from "babylonjs";

interface Position {
    x: number;
    y: number;
    z: number;
}

interface HotSpotData {
    index: number;
    panoPath: string;
    position: Position;
    visible: number[];
}

interface InteriorTour {
    interiorName: string;
    tours: HotSpotData[];
}

interface TypeData {
    typeName: string;
    interiorTours: InteriorTour;
    Plans3d: { glbPath: string };
}

interface ProjectData {
    projectName: string;
    types: TypeData[];
}

export class HotspotLoader {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        console.log("[HotspotLoader] Initialized with scene:", scene);
    }

    public async LoadType(typeName: string) {
        console.log(`[HotspotLoader] Loading type '${typeName}'...`);
        try {
            // Fetch the JSON file
            const response = await fetch("/assets/project.json");
            if (!response.ok) {
                console.error(`[HotspotLoader] Failed to fetch project.json: ${response.status} ${response.statusText}`);
                return;
            }

            const projectData: ProjectData = await response.json();
            console.log("[HotspotLoader] project.json loaded successfully:", projectData);

            // Find the type
            const type = projectData.types.find(t => t.typeName === typeName);
            if (!type) {
                console.error(`[HotspotLoader] Type '${typeName}' not found in project.json`);
                return;
            }
            console.log(`[HotspotLoader] Found type:`, type);

            // Check if tours exist
            if (!type.interiorTours || !type.interiorTours.tours || type.interiorTours.tours.length === 0) {
                console.warn(`[HotspotLoader] No hotspots found for type '${typeName}'`);
                return;
            }

            // Create hotspots
            type.interiorTours.tours.forEach(hotspot => {
                try {
                    console.log(`[HotspotLoader] Creating hotspot index ${hotspot.index} at position`, hotspot.position);

                    const pos = hotspot.position;

                    // Create sphere
                    const sphere = MeshBuilder.CreateSphere(
                        `hotspot_${typeName}_${hotspot.index}`,
                        { diameter: 0.5 },
                        this.scene
                    );

                    if (!sphere) {
                        console.error(`[HotspotLoader] Failed to create sphere for hotspot ${hotspot.index}`);
                        return;
                    }

                    sphere.position = new Vector3(pos.x, pos.y, pos.z);
                    console.log(`[HotspotLoader] Sphere position set to`, sphere.position);

                    // Add material if panoPath exists
                    if (hotspot.panoPath && hotspot.panoPath !== "No Texture found!") {
                        const mat = new StandardMaterial(`mat_${typeName}_${hotspot.index}`, this.scene);
                        mat.diffuseTexture = new Texture(hotspot.panoPath, this.scene, false, false, Texture.BILINEAR_SAMPLINGMODE,
                            () => console.log(`[HotspotLoader] Texture loaded successfully for hotspot ${hotspot.index}`),
                            (msg, exception) => console.error(`[HotspotLoader] Failed to load texture for hotspot ${hotspot.index}:`, msg, exception)
                        );
                        sphere.material = mat;
                    } else {
                        console.warn(`[HotspotLoader] Hotspot ${hotspot.index} has no valid panoPath`);
                    }

                    // Optional: click interaction
                    sphere.actionManager = new ActionManager(this.scene);
                    sphere.actionManager.registerAction(
                        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                            console.log(`Clicked hotspot: Type ${typeName}, Index ${hotspot.index}`);
                        })
                    );

                    console.log(`[HotspotLoader] Hotspot ${hotspot.index} created successfully`);
                } catch (hotspotError) {
                    console.error(`[HotspotLoader] Error creating hotspot index ${hotspot.index}:`, hotspotError);
                }
            });

            console.log(`[HotspotLoader] Loaded type '${typeName}' with ${type.interiorTours.tours.length} hotspots`);
        } catch (err) {
            console.error(`[HotspotLoader] Failed to load type '${typeName}':`, err);
        }
    }
}
