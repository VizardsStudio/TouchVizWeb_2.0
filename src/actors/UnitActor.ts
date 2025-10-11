import { Scene, Vector3, Mesh, Space, Animation, StandardMaterial, Color3, Constants, HighlightLayer, Material } from "babylonjs";
import { MeshActor } from "./MeshActor";
import type { ApartmentProperties } from "../types/apartment";

export type UnitStatus = "available" | "sold" | "reserved";
export type UnitType = "apartment" | "duplex" | "penthouse";
export type UnitView = "Dijlah" | "city";

export class UnitActor extends MeshActor {
  public id: number = -1;
  public props: ApartmentProperties;
  private highlightLayer: HighlightLayer;

  constructor(
    name: string,
    position: Vector3,
    scene: Scene,
  ) {
    super(name, position, scene);
    this.highlightLayer = new HighlightLayer("hl1", this.actorRoot._scene);
    this.props = {
      id: -1,
      type: "Undefined",
      floor: -1,
      area: -1,
      typology: "Undefined",
      view: "Undefined",
      status: "Sold",
      bedrooms: -1
    }
  }

  public matAvailable: Material;
  public matSold: Material;
  public matReserved: Material;

  public SetId(id: number) {
    this.id = id;
    this.fetchData();
  }
  private fetchData() {
    //simulating getting data from the DB
    // const random = Math.random()
    // if (random < 0.3) {
    //   this.props.status = "Available"
    // }
    // else if (random > 0.3 && random < 0.6) {
    //   this.props.status = "Reserved";
    // }
    // else this.props.status = "Sold";

    this.UpdateMaterial();

  }

  public SetProps(newProps: Partial<ApartmentProperties>): void {
    this.props = { ...this.props, ...newProps };
    this.UpdateMaterial(); // Apply new material if status changed
  }

  private UpdateMaterial() {
    let material;
    if (this.props.status === "Available") {
      material = this.matAvailable;
    }
    else if (this.props.status === "Reserved") {
      material = this.matReserved;
    }
    else material = this.matSold;
    this.SetMaterial(material);
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
