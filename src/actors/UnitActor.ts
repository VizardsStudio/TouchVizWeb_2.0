import { Scene, Vector3, Mesh, Space, Animation, StandardMaterial, Color3, Constants, HighlightLayer, Material } from "babylonjs";
import { MeshActor } from "./MeshActor";
import type { ApartmentProperties } from "../types/apartment";
import type { FilterCriteria } from "../types/filteringCriteria";


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

  meetsCriteria(filters: FilterCriteria): boolean {
    const p = this.props

    // Range checks
    const floorOK =
      !filters.floorRange ||
      (p.floor >= filters.floorRange[0] && p.floor <= filters.floorRange[1])

    const areaOK =
      !filters.areaRange ||
      (p.area >= filters.areaRange[0] && p.area <= filters.areaRange[1])

    // List inclusion checks
    const typeOK = !filters.type || filters.type.includes(p.type)
    const typologyOK = !filters.typology || filters.typology.includes(p.typology)
    const viewOK = !filters.view || filters.view.includes(p.view)
    const statusOK = !filters.status || filters.status.includes(p.status)
    const bedroomsOK = !filters.bedrooms || filters.bedrooms.includes(p.bedrooms)

    return floorOK && areaOK && typeOK && typologyOK && viewOK && statusOK && bedroomsOK
  }

  applyVisibility(filters: FilterCriteria) {
    this.meshes[0].isVisible = this.meetsCriteria(filters)
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
