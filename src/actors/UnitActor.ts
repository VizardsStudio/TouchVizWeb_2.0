import { Scene, Vector3, Mesh, Space,Animation, StandardMaterial, Color3, Constants,HighlightLayer } from "babylonjs";
import { MeshActor } from "./MeshActor";
import type { ApartmentProperties } from "../types/apartment";

export type UnitStatus = "available" | "sold" | "reserved";
export type UnitType = "apartment" | "duplex" | "penthouse";
export type UnitView = "Dijlah" | "city" ;

export class UnitActor extends MeshActor {
    public id: number = -1;
    public props:ApartmentProperties;
    private highlightLayer:HighlightLayer;

  constructor(
    name: string,
    position: Vector3,
    scene: Scene,
  ) {
    super(name, position, scene);
    this.highlightLayer = new HighlightLayer("hl1",this.actorRoot._scene);
    this.props = {
      id:-1,
      type:"Undefined",
      floor:-1,
      area:-1,
      typology:"Undefined",
      view:"Undefined",
      status:"Available",
      bedrooms:-1
    }
  }

    public matAvailable:StandardMaterial = this.CreateAnimatedMaterial("Available", Color3.Blue());;
    public matSold:StandardMaterial = this.CreateAnimatedMaterial("Sold",Color3.Red());
    public matReserved:StandardMaterial = this.CreateAnimatedMaterial("Reseved",Color3.Yellow());

  public SetId(id:number)
  {
    this.id = id;
    this.fetchData();
  }
  private fetchData()
  {
    //simulating getting data from the DB
    const random = Math.random()
    if (random<0.3) {
        this.props.status = "Available"
    }
    else if(random>0.3 && random<0.6)
    {
        this.props.status = "Reserved";
    }
    else this.props.status = "Sold";

    this.UpdateMaterial();

  }

  private UpdateMaterial()
  {
    let material;
    if (this.props.status==="Available") 
        {
            material = this.matAvailable;
        }
        else if(this.props.status==="Reserved")
        {
            material = this.matReserved;
        }
        else material = this.matSold;
    this.SetMaterial(material);
  }

    public CreateAnimatedMaterial(name:string, color:Color3):StandardMaterial
    {
        const material = new StandardMaterial(name, this.actorRoot._scene);
        material.diffuseColor = color;
        material.alpha = 0.8;
        material.alphaMode = Constants.ALPHA_ADD;
        const alphaAnimation = new Animation("alphaPulse","alpha",30,Animation.ANIMATIONTYPE_FLOAT,Animation.ANIMATIONLOOPMODE_CYCLE);
        const keys = [
            {frame:0, value:0.8},
            {frame:30, value:0.2},
            {frame:60, value:0.8}
        ];
        alphaAnimation.setKeys(keys);
        material.animations = [alphaAnimation];
        this.actorRoot._scene.beginAnimation(material, 0, 60,true);
        return material;
    }

  public SetHighlight(active: boolean) {
    if (active) {
        this.meshes.forEach(m => this.highlightLayer.addMesh(m, Color3.White()));
    } else {
        this.meshes.forEach(m => this.highlightLayer.removeMesh(m));
    }
  }

  /** Override update if you want special behavior */
  public override Update(dt: number) {
    super.Update(dt);
    // You could animate based on unit status, etc.
  }
  public Start(): void {
    super.Start();
  }
  public SetMeshes(newMeshes: Mesh[]): void {
    this.SetPickable(true);
  }
}
