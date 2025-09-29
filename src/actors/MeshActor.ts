import { Actor } from "./actor";
import { Scene, Vector3, Mesh, AbstractMesh, MeshBuilder, Material } from "babylonjs";

export class MeshActor extends Actor {
    public meshes: Mesh[] = [];
    private _defaultMesh!: Mesh;
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);

        // Optional default mesh
        this._defaultMesh = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        this._defaultMesh.parent = this.actorRoot;
        this.meshes.push(this._defaultMesh);
    }

    /** Add a mesh to this actor */
    public AddMesh(mesh: Mesh) {
        mesh.setParent(this.actorRoot, true)
        this.meshes.push(mesh);
        if (this._defaultMesh) {
            this.RemoveMesh(this._defaultMesh)
        }
    }

    /** Remove a mesh from this actor */
    public RemoveMesh(mesh: Mesh) {
        mesh.parent = null;
        this.meshes = this.meshes.filter(m => m !== mesh);
        mesh.dispose();
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

    public SetMaterial(material: Material) 
    {
        this.meshes.forEach(mesh => {
            try {
                if (!mesh) return; // skip undefined
                mesh.material = material;
            } catch (e) {
                console.warn(`Failed to set material on mesh '${mesh?.name}':`, e);
            }
        });
    }


    /** Example update */
    public Update(dt: number) {
    }
}
