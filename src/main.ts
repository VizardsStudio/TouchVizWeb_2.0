import { EngineManager } from "./core/EngineManager";
import { autoRotate, ChangeSequence } from "./core/imageViewer";
import { LevelExterior } from "./levels/exterior";
import { Level_Interior1 } from "./levels/interior1";

const renderCanvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;

//initialize the engine
const engineManager = EngineManager.getInstance(renderCanvas);

//Open the Exterior level
const exteriorLevel = new LevelExterior(engineManager.engine);
engineManager.OpenLevel(exteriorLevel);


//startup preparation
renderCanvas.style.visibility = "hidden";
//play startup animation
autoRotate({
    startFrame: 0,
    endFrame: 110,
    duration: 2000, // 3 seconds total
    fade: true,
    direction: -1,
    onComplete: () => console.log("Finished!")
});

setTimeout(() => {
    ChangeSequence("src/assets/Orbits/Exterior/Night/Exterior360_2.");
}, 4000);


