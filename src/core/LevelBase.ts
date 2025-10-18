import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from "babylonjs";
import { ActorManager } from "../managers/actorManager";

export class LevelBase {
    public scene: Scene;
    public actorManager: ActorManager;
    protected camera!: ArcRotateCamera;
    protected light!: HemisphericLight;

    constructor(engine: Engine) {
        this.scene = new Scene(engine);
        this.actorManager = new ActorManager(this.scene);
        this.SetupCamera();
        this.SetupLights();
        this.SetupScene();
        //EngineManager.getInstance().scene = this.scene;
    }

    protected SetupScene() {
        // Set scene background to white (r, g, b, a)
        this.scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);
    }

    private SetupCamera() {
        this.camera = new ArcRotateCamera(
            'MainCamera',
            Math.PI / 2,
            Math.PI / 3,
            6,
            Vector3.Zero(),
            this.scene
        )
        this.camera.attachControl(true, true);
    }
    private SetupLights() {
        this.light = new HemisphericLight("DefaultSkyLight",
            Vector3.Up(),
            this.scene
        )
    }

    public Update(dt: number) {
        this.actorManager.UpdateAllActors(dt)
    }
    public InspectorShow(embed: boolean) {
        this.scene.debugLayer.show({ embedMode: embed });
    }
    public InspectorHide() {
        this.scene.debugLayer.hide();
    }
}