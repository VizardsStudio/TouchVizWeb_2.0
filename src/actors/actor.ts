import {Vector3, TransformNode, Scene, Space} from "babylonjs"

export class Actor{
    public name:string = "Actor_";
    public actorRoot!: TransformNode;
    constructor(name:string,position:Vector3,scene:Scene){
        this.name = name;
        this.actorRoot = new TransformNode(name,scene);
        this.actorRoot.setAbsolutePosition(position);
    }
    public Update(dt:number){

    }
    public Start(){
    }
}