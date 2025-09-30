import { Animatable, Constants, Animation, Color3, ImportMeshAsync, Material, Mesh, SceneLoader, StandardMaterial, Vector3, type Engine, SceneLoaderAnimationGroupLoadingMode, AbstractMesh, BaseTexture, Color4, DirectionalLight, ShadowGenerator, PBRMaterial } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { UnitActor, type UnitType } from "../actors/UnitActor";
import { Actor } from "../actors/actor";
import { GLTFFileLoader } from "babylonjs-loaders"
import { EngineManager } from "../core/EngineManager";
import { SelectionManager } from "../managers/SelectionManager";



export class LevelExterior extends LevelBase {
    public selectionManager: SelectionManager;
    constructor(engine: Engine) {
        super(engine);
        this.selectionManager = new SelectionManager(this.scene, this.actorManager);
    }

    protected SetupScene() {
        this.InspectorShow(false);
        //load units and spawn unit actors
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/", "Units.glb", this.scene)
            .then(result => {
                // Only take meshes, skip transform nodes like "__root__"
                const unitMeshes: Mesh[] = result.meshes.filter(
                    (m): m is Mesh => m instanceof Mesh
                );

                // Now you can loop through them cleanly
                unitMeshes.forEach(mesh => {
                    if (mesh !== unitMeshes[0]) {
                        const unitActor: UnitActor = this.actorManager.SpawnActor(UnitActor, `UnitActor_${mesh.name}`, Vector3.Zero());
                        //unitActors.push(unitActor);
                        unitActor.AddMesh(mesh);
                    }
                });

                this.SetupUnitActors();
            });

        //prepare required materials
        const matSolid: StandardMaterial = new StandardMaterial("Solid", this.scene);
        matSolid.diffuseColor = Color3.White();
        const matGlass = new StandardMaterial("Glass", this.scene);
        matGlass.diffuseColor = Color3.Black();
        matGlass.alpha = 0.85;
        const matContext = new StandardMaterial("Context", this.scene);
        matContext.diffuseColor = new Color3(0.902, 0.902, 0.902);
        const matGreen = new StandardMaterial("Green", this.scene);
        matGreen.diffuseColor = new Color3(0.784, 0.89, 0.784);
        const matWater = new StandardMaterial("Water", this.scene);
        matWater.diffuseColor = new Color3(0.714, 0.855, 0.878);
        const matRoad = new StandardMaterial("Road", this.scene);
        matRoad.diffuseColor = new Color3(0.6, 0.6, 0.6);
        const matGold = new PBRMaterial("Gold",this.scene);
        matGold.metallic = 1;
        matGold.albedoColor = new Color3(0.729, 0.529, 0.298);
        matGold.roughness = 0.05;

        //load and import other 3d models
        const meshes:AbstractMesh[] = [];
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "tower LOD 0.glb", this.scene).then((result) => {this.SetMaterial(result.meshes, matSolid); meshes.concat(result.meshes)});
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "context.glb", this.scene).then((result) => {this.SetMaterial(result.meshes, matContext); meshes.concat(result.meshes)});
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "glass.glb", this.scene).then((result) => this.SetMaterial(result.meshes, matGlass));
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "greens.glb", this.scene).then((result) => this.SetMaterial(result.meshes, matGreen));
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "roads.glb", this.scene).then((result) => this.SetMaterial(result.meshes, matRoad));
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "water.glb", this.scene).then((result) => this.SetMaterial(result.meshes, matWater));
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/3dModels/", "dome.glb", this.scene).then((result) => this.SetMaterial(result.meshes, matSolid));

        //reposition the camera
        this.camera.target.x = -23.5;
        this.camera.target.y = 102.88;
        this.camera.target.z = 33.4;
        this.camera.radius = 320;
        this.camera.upperRadiusLimit = 400;
        this.camera.lowerRadiusLimit = 260;
        this.camera.upperBetaLimit = 1.5;   

        //environment and lighting
        this.light.specular = Color3.Black();
        this.light.intensity = 1;
        this.scene.clearColor = new Color4(1,1,1,1);
        this.scene.fogEnabled = true;
        this.scene.fogMode = 3; 
        this.scene.fogColor = Color3.White();
        this.scene.fogStart = 550;
        this.scene.fogEnd = 600;


    }

    SetupUnitActors() {
        this.actorManager.GetAllActors()
            .filter(actor => actor instanceof UnitActor) // ✅ only MeshActor and subclasses
            .forEach(actor => {
                actor.SetId(0);
            });
    }
    SetMaterial(meshes: AbstractMesh[], material: Material) {
        try {
            if (!meshes || meshes.length === 0) {
                console.warn("No meshes provided to SetMaterial.");
                return;
            }

            for (const mesh of meshes) {
                if (mesh && mesh.material !== undefined) {
                    mesh.material = material;
                } else {
                    console.warn("Skipped an invalid mesh:", mesh);
                }
            }

            console.log(`✅ Material applied to ${meshes.length} meshes.`);
        } catch (error) {
            console.error("❌ Failed to apply material to meshes:", error);
        }
    }



}