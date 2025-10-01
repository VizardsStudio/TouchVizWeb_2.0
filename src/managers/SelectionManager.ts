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
      if (!this._downPickMesh || !this._downPointerPos) return;

      // ✅ 1. Check movement distance — ignore if it's a drag
      const dx = evt.clientX - this._downPointerPos.x;
      const dy = evt.clientY - this._downPointerPos.y;
      const movedTooMuch = Math.sqrt(dx * dx + dy * dy) > this._moveThreshold;
      if (movedTooMuch) return;

      // ✅ 2. Must release on the same mesh
      if (pickInfo.hit && pickInfo.pickedMesh === this._downPickMesh) {
        const actor = this.actorManager
          .GetAllActors()
          .find(
            (a) =>
              a instanceof UnitActor && a.meshes.includes(pickInfo.pickedMesh as Mesh)
          ) as UnitActor;

        if (actor) {
          console.log(`${actor.name}: ${actor.props.status}`);
          this.SelectUnit(actor);
        }
      }

      // Reset
      this._downPickMesh = null;
      this._downPointerPos = null;
    };
  }

  private SelectUnit(unit: UnitActor) {
    if (this._selectedUnit) {
      this._selectedUnit.SetHighlight(false); // unhighlight previous
    }

    this._selectedUnit = unit;
    this._selectedUnit.SetHighlight(true);

    eventBus.dispatchEvent(
      new CustomEvent("unitSelected", { detail: this._selectedUnit.props })
    );
  }
}
