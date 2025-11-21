import { type Mesh, type Scene } from "babylonjs";
import { UnitActor } from "../actors/UnitActor";
import type { ActorManager } from "./actorManager";
import { eventBus } from "../core/eventBus";

export class SelectionManager {
  public onSelect?: (unit: UnitActor) => void;
  private scene: Scene;
  private actorManager: ActorManager;
  private _selectedUnit: UnitActor | null = null;

  private _downPickMesh: Mesh | null = null;
  private _downPointerPos: { x: number; y: number } | null = null;
  private _moveThreshold = 5; // px tolerance so orbit/drags don't trigger selection

  constructor(scene: Scene, actorManager: ActorManager) {
    this.scene = scene;
    this.actorManager = actorManager;
    this.registerPointerEvents();
  }

  private registerPointerEvents() {
    this.scene.onPointerDown = (evt, pickInfo) => {
      if (pickInfo.hit && pickInfo.pickedMesh) {
        this._downPickMesh = pickInfo.pickedMesh as Mesh;
        this._downPointerPos = { x: evt.clientX, y: evt.clientY };
      } else {
        this._downPickMesh = null;
        this._downPointerPos = null;
      }
    };

    this.scene.onPointerUp = (evt, pickInfo) => {
      // Ignore if moved too much (drag)
      const dx = this._downPointerPos ? evt.clientX - this._downPointerPos.x : 0;
      const dy = this._downPointerPos ? evt.clientY - this._downPointerPos.y : 0;
      const movedTooMuch = Math.sqrt(dx * dx + dy * dy) > this._moveThreshold;
      if (movedTooMuch) return;

      // Only select if the pointer went down and up on the same mesh
      if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh === this._downPickMesh) {
        const actor = this.actorManager
          .GetAllActors()
          .find(
            (a) =>
              a instanceof UnitActor && a.meshes.includes(pickInfo.pickedMesh as Mesh)
          ) as UnitActor;

        if (actor) {
          this.SelectUnit(actor);
        }
      } else {
        // Clicked empty space or released on a different mesh → deselect
        this.DeselectUnit();
      }

      // Reset
      this._downPickMesh = null;
      this._downPointerPos = null;
    };

    eventBus.addEventListener('unitSelectEvent', (event) => {
      // `event` is a CustomEvent
      const num = (event as CustomEvent<number>).detail;
      console.log('Selecting Unit:', num);
      this.SelectUnitByID(num);
    });
  }

  DeselectUnit() {
    console.log("deselect");
    eventBus.dispatchEvent(
      new CustomEvent("deselected")
    );
  }

  public SelectUnit(unit: UnitActor) {
    if (this._selectedUnit) {
      this._selectedUnit.SetHighlight(false); // unhighlight previous
    }

    this._selectedUnit = unit;
    this._selectedUnit.SetHighlight(true);

    eventBus.dispatchEvent(
      new CustomEvent("unitSelected", { detail: this._selectedUnit.props })
    );
  }
  public SelectUnitByID(unitId: number) {
    console.log("SelectUnitByID:", unitId);
    const unit = this.actorManager
      .GetAllActors()
      .find(
        (a) =>
          a instanceof UnitActor && a.props.id == unitId
      ) as UnitActor | undefined;
    if (unit) {
      this.SelectUnit(unit);
      console.log("found unit!:", unit);
    } else {
      console.warn("unit not found for id:", unitId);
    }
  }


}
