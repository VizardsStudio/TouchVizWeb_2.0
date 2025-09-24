import { EngineManager } from "./core/EngineManager";
import { LevelExterior } from "./levels/exterior";
import { Level_Interior1 } from "./levels/interior1";

//initialize the engine
const engineManager = EngineManager.getInstance(document.getElementById("renderCanvas") as HTMLCanvasElement);

//Open the Exterior level
//const exteriorLevel = new LevelExterior(engineManager.engine);
const levelInterior1 = new Level_Interior1(engineManager.engine);
engineManager.OpenLevel(levelInterior1);


