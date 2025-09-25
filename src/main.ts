import { EngineManager } from "./core/EngineManager";
import { LevelExterior } from "./levels/exterior";
import { Level_Interior1 } from "./levels/interior1";

const renderCanvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;

//initialize the engine
const engineManager = EngineManager.getInstance(renderCanvas);

//Open the Exterior level
const exteriorLevel = new LevelExterior(engineManager.engine);
engineManager.OpenLevel(exteriorLevel);


//startup preparation
renderCanvas.hidden = true;


