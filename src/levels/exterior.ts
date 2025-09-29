import { Animatable,Constants, Animation, Color3, ImportMeshAsync, Material, Mesh, SceneLoader, StandardMaterial, Vector3, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { UnitActor, type UnitType } from "../actors/UnitActor";
import { Actor } from "../actors/actor";
import { GLTFFileLoader } from "babylonjs-loaders"
import { EngineManager } from "../core/EngineManager";
import { SelectionManager } from "../managers/SelectionManager";


export class LevelExterior extends LevelBase 
{
    public selectionManager:SelectionManager;
    constructor(engine: Engine) 
    {
        super(engine);
        this.selectionManager = new SelectionManager(this.scene, this.actorManager);
    }

    protected SetupScene() 
    {
        //this.InspectorShow(false);
        //load units and spawn unit actors
        SceneLoader.ImportMeshAsync("", "assets/gltf/exterior/", "Units.glb", this.scene)
            .then(result => 
            {
                // Only take meshes, skip transform nodes like "__root__"
                const unitMeshes: Mesh[] = result.meshes.filter(
                    (m): m is Mesh => m instanceof Mesh
                );

                // Now you can loop through them cleanly
                unitMeshes.forEach(mesh => 
                {
                    if (mesh !== unitMeshes[0]) 
                    {
                        const unitActor: UnitActor = this.actorManager.SpawnActor(UnitActor, `UnitActor_${mesh.name}`, Vector3.Zero());
                        //unitActors.push(unitActor);
                        unitActor.AddMesh(mesh);                    
                    }
                });

                this.SetupUnitActors();
            });
    }

    SetupUnitActors()
    {
        this.actorManager.GetAllActors()
        .filter(actor => actor instanceof UnitActor) // ✅ only MeshActor and subclasses
        .forEach(actor => {
            actor.SetId(0);
        });
    }
    

}