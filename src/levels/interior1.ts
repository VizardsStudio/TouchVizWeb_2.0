import { MeshBuilder, StandardMaterial, Texture, Vector3, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
export class Level_Interior1 extends LevelBase {
    constructor(engine: Engine) {
        super(engine);
    }

    protected SetupScene() {
        const SkySphere = this.actorManager.SpawnActor(MeshActor, "SkySphere", Vector3.Zero());
        const sphereMesh = MeshBuilder.CreateSphere("sphere", { segments: 32, diameter: 1000, sideOrientation: 1 });
        SkySphere.AddMesh(sphereMesh);
        const skyMaterial = new StandardMaterial("skymat", this.scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.disableLighting = true;
        skyMaterial.emissiveTexture = new Texture("./assets/panos/1+1A/0.jpeg")
        sphereMesh.material = skyMaterial;
        SkySphere.actorRoot.scaling = new Vector3(1, -1, 1);

        //camera
        this.camera.fov = 1;
        console.log("[Level_Interior1] Scene setup complete");
    }

}