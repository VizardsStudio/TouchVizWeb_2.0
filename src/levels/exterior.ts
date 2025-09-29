import { Animatable,Constants, Animation, Color3, ImportMeshAsync, Material, Mesh, SceneLoader, StandardMaterial, Vector3, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { UnitActor, type UnitType } from "../actors/UnitActor";
import { Actor } from "../actors/actor";
import { GLTFFileLoader } from "babylonjs-loaders"
import { EngineManager } from "../core/EngineManager";

export class LevelExterior extends LevelBase 
{
    constructor(engine: Engine) 
    {
        super(engine);
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
    

    // public CreateAnimatedMaterial(name:string, color:Color3):StandardMaterial{
    //     const material = new StandardMaterial(name, this.scene);
    //     material.diffuseColor = color;
    //     material.alpha = 0.8;
    //     material.alphaMode = Constants.ALPHA_ADD;
    //     const alphaAnimation = new Animation("alphaPulse","alpha",30,Animation.ANIMATIONTYPE_FLOAT,Animation.ANIMATIONLOOPMODE_CYCLE);
    //     const keys = [
    //         {frame:0, value:0.8},
    //         {frame:30, value:0.2},
    //         {frame:60, value:0.8}
    //     ];
    //     alphaAnimation.setKeys(keys);
    //     material.animations = [alphaAnimation];
    //     this.scene.beginAnimation(material, 0, 60,true);
    //     return material;
    // }
    

}