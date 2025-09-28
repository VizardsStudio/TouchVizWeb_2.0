import { ImportMeshAsync, Mesh, SceneLoader, Vector3, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { Actor } from "../actors/actor";
import { GLTFFileLoader } from "babylonjs-loaders"
export class LevelExterior extends LevelBase {
    constructor(engine: Engine) {
        super(engine);
    }

    protected async SetupScene() {

        this.InspectorShow(false);

        let unitActors: MeshActor[];

        // ImportMeshAsync("assets/gltf/exterior/Units.glb", this.scene).then(result => {
        //     const meshesOnly: Mesh[] = result.meshes.filter(m => m instanceof Mesh) as Mesh[];
        //     console.log(meshesOnly[0]);
        //     meshesOnly.forEach(mesh => {
        //         let unitActor: MeshActor = this.actorManager.SpawnActor(MeshActor, "Unit", Vector3.Zero());
        //         unitActor.AddMesh(mesh);
        //         unitActors.push(unitActor);
        //     });
        //     console.log(`total number of meshes in meshesOnly: ${meshesOnly.length}`);
        // })

        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/", "Units.glb", this.scene)
            .then(result => {
                // Only take meshes, skip transform nodes like "__root__"
                const unitMeshes: Mesh[] = result.meshes.filter(
                    (m): m is Mesh => m instanceof Mesh
                );

                // Now you can loop through them cleanly
                unitMeshes.forEach(mesh => {
                    if (mesh !== unitMeshes[0]) {
                        let unitActor: MeshActor = this.actorManager.SpawnActor(MeshActor, `UnitActor_${mesh.name}`, Vector3.Zero());
                        unitActor.AddMesh(mesh);
                    }
                });

            });

    }

}