import { Scene, Vector3, Mesh, Space,Animation, StandardMaterial, Color3, Constants } from "babylonjs";
import { MeshActor } from "./MeshActor";

export type UnitStatus = "available" | "sold" | "reserved";
export type UnitType = "apartment" | "duplex" | "penthouse";
export type UnitView = "Dijlah" | "city" ;

export interface UnitActorOptions {
    id?: number;
    status?: UnitStatus;
    area?: number;
    floor?: number;
    type?: UnitType;
    typology?: string;
    view?: UnitView;
    numberOfBedrooms?: number;
}

export class UnitActor extends MeshActor {
    public id: number;
    public status: UnitStatus;
    public area: number;
    public floor: number;
    public type: UnitType;
    public typology: string;
    public view: UnitView;
    public numberOfBedrooms: number;
    public price: number;

  constructor(
    name: string,
    position: Vector3,
    scene: Scene,
    options: UnitActorOptions = {}
  ) {
    super(name, position, scene);

    this.status = options.status ?? "available";
    this.area = options.area ?? 0;
    this.floor = options.floor ?? 0;
    this.type = options.type ?? "apartment";
    this.typology = options.typology ?? "";
    this.view = options.view ?? "city";
    this.numberOfBedrooms = options.numberOfBedrooms ?? 1;
  }

    public matAvailable:StandardMaterial = this.CreateAnimatedMaterial("Available", Color3.Blue());;
    public matSold:StandardMaterial = this.CreateAnimatedMaterial("Sold",Color3.Red());
    public matReserved:StandardMaterial = this.CreateAnimatedMaterial("Reseved",Color3.Yellow());

  /** Optional: Update unit status at runtime */
  public SetStatus(newStatus: UnitStatus) {
    this.status = newStatus;
    // You can add visual feedback here (e.g., change mesh color)
  }

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
        this.status = "available"
    }
    else if(random>0.3 && random<0.6)
    {
        this.status = "reserved";
    }
    else this.status = "sold";

    this.UpdateMaterial();

  }

  private UpdateMaterial()
  {
    let material;
    if (this.status==="available") 
        {
            material = this.matAvailable;
        }
        else if(this.status==="reserved")
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

  /** Optional: Useful helper for displaying unit info */
  public GetInfo(): string {
    return `${this.typology} - ${this.area} m² - ${this.numberOfBedrooms} BR - Floor ${this.floor} - ${this.view} view`;
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
