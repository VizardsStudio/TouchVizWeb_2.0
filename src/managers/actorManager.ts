import {Scene, Vector3} from "babylonjs";
import {Actor} from "../actors/actor";

export class ActorManager{
    private _scene!:Scene;
    private actors:Actor[] = [];
    constructor(scene:Scene){
        this._scene = scene;
    }
    public SpawnActor<T extends Actor>(
        ActorClass: new (name:string, position:Vector3, scene:Scene) => T,
        name:string,
         position:Vector3
        ):T{
        let newActor = new ActorClass(name,position,this._scene);
        newActor.Start();
        this.actors.push(newActor);
        return newActor;
    }

    public KillActor(actor:Actor){
        actor.actorRoot.dispose();
        this.actors = this.actors.filter(a => a!== actor);
    }

    public GetAllActors() : Actor[]
    {
        return this.actors;
    }
    
    public UpdateAllActors(dt:number){
        this.actors.forEach((actor) => actor.Update(dt));
    }
}