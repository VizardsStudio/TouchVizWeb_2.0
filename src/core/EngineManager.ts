import { Color4, Engine, Scene } from "babylonjs"
import { LevelBase } from "./LevelBase";

export class EngineManager {
    private static _instance: EngineManager;

    public engine: Engine;
    private Level!: LevelBase;

    private constructor(canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas, true);
        this.Level = new LevelBase(this.engine);
        //handle resize
        window.addEventListener("resize", () => { this.engine.resize() });
    }

    public static getInstance(canvas?: HTMLCanvasElement) {
        if (!EngineManager._instance) {
            if (!canvas) {
                throw new Error("Canvas must be provided for the first Initialization!");
            }
            EngineManager._instance = new EngineManager(canvas);
        }
        return EngineManager._instance;
    }

    public OpenLevel<T extends LevelBase>(level: T) {
        this.Level = level;
        this.RunRenderLoop(level);
    }
    public CloseLevel<T extends LevelBase>(level: T) {
        if (!level?.scene) return;
        this.engine.stopRenderLoop();
        level.scene.dispose();
        this.engine.clear(new Color4(1, 1, 1, 1), true, true);
        level = null;
    }

    private RunRenderLoop(level: LevelBase) {
        this.engine.runRenderLoop(() => {
            let dt = this.engine.getDeltaTime() / 1000 //converting to seconds
            level.Update(dt)
            level.scene.render();
        });
    }
}