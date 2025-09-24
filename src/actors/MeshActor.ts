import { Actor } from "./actor";
import { Scene, Vector3, Mesh } from "babylonjs";

export class MeshActor extends Actor {
    public meshes: Mesh[] = [];

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);

        // Optional default mesh
        const defaultMesh = Mesh.CreateBox(name + "_default", 1, scene);
        defaultMesh.parent = this.actorRoot;
        this.meshes.push(defaultMesh);
    }

    /** Add a mesh to this actor */
    public AddMesh(mesh: Mesh) {
        mesh.parent = this.actorRoot;
        this.meshes.push(mesh);
    }

    /** Remove a mesh from this actor */
    public RemoveMesh(mesh: Mesh) {
        mesh.parent = null;
        this.meshes = this.meshes.filter(m => m !== mesh);
    }

    /** Replace all meshes with a new array */
    public SetMeshes(newMeshes: Mesh[]) {
        // Remove old meshes
        this.meshes.forEach(m => (m.parent = null));
        this.meshes = [];

        // Add new meshes
        newMeshes.forEach(m => {
            m.parent = this.actorRoot;
            this.meshes.push(m);
        });
    }

    /** Example update */
    public Update(dt: number) {
        for (const mesh of this.meshes) {
            mesh.rotation.y += dt;
        }
    }
}
