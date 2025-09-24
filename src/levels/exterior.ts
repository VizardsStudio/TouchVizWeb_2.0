import { Vector3, type Engine } from "babylonjs";
import { LevelBase } from "../core/LevelBase";
import { MeshActor } from "../actors/MeshActor";
import { Actor } from "../actors/actor";
export class LevelExterior extends LevelBase{
    constructor(engine:Engine){
        super(engine);
    }

    protected SetupScene(){
        this.actorManager.SpawnActor(Actor,"Actor1",new Vector3(0,10,0));
        this.actorManager.SpawnActor(MeshActor,"meshActor1",Vector3.Zero());
    }

}