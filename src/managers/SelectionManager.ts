import { type Mesh, type Scene} from "babylonjs";
import { UnitActor } from "../actors/UnitActor";
import type { ActorManager } from "./actorManager";
import type { ApartmentProperties } from "../types/apartment";
import { eventBus } from "../core/eventBus";

export class SelectionManager {
    public onSelect?: (unit: UnitActor) => void;
    private scene:Scene;
    private actorManager:ActorManager;
    private _selectedUnit:UnitActor;
  

  constructor(scene: Scene, actorManager:ActorManager) {
    this.scene = scene;
    this.actorManager = actorManager;
    this.registerPointerEvents();
  }

  private registerPointerEvents() {
    this.scene.onPointerDown = (evt, pickInfo) => 
    {
    if (pickInfo.hit && pickInfo.pickedMesh) 
    {
        const pickedMesh = pickInfo.pickedMesh;

        // Try to find which UnitActor owns this mesh
        const actor = this.actorManager
            .GetAllActors()
            .find(a => a instanceof UnitActor && a.meshes.includes(pickedMesh as Mesh)) as UnitActor;

        if (actor) {
            console.log(`${actor.name}: ${actor.props.status}`);
            this.SelectUnit(actor);
        }
    }
    };
  }

  private SelectUnit(unit:UnitActor){
        if (this._selectedUnit) {
        this._selectedUnit.SetHighlight(false); // unhighlight previous
    }

    this._selectedUnit = unit;
    this._selectedUnit.SetHighlight(true);

    eventBus.dispatchEvent(new CustomEvent("unitSelected",{detail:this._selectedUnit.props}));

    // Update UI widget with unit data
    //this.unitWidget.ShowUnitInfo(unit.metadata);
  }

}
