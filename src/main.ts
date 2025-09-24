import { EngineManager } from "./core/EngineManager";
import { LevelExterior } from "./levels/exterior";

//initialize the engine
const engineManager = EngineManager.getInstance(document.getElementById("renderCanvas") as HTMLCanvasElement);

//Open the Exterior level
const exteriorLevel = new LevelExterior(engineManager.engine);
engineManager.OpenLevel(exteriorLevel);


