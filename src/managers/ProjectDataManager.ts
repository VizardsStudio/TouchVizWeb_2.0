interface Position {
    x: number;
    y: number;
    z: number;
}

interface HotSpotData {
    index: number;
    panoPath: string;
    position: Position;
    visible: number[];
}

interface InteriorTour {
    interiorName: string;
    tours: HotSpotData[];
}

export interface TypeData {
    typeName: string;
    interiorTours: InteriorTour;
    Plans3d: { glbPath: string };
}

interface ProjectData {
    projectName: string;
    types: TypeData[];
}

export class ProjectDataManager {
    private static instance: ProjectDataManager;
    private projectData: ProjectData | null = null;

    private constructor() { } // private to enforce singleton

    public static getInstance(): ProjectDataManager {
        if (!ProjectDataManager.instance) {
            ProjectDataManager.instance = new ProjectDataManager();
        }
        return ProjectDataManager.instance;
    }

    /** Load project JSON from a URL and store internally */
    public async load(url: string): Promise<ProjectData | null> {
        if (this.projectData) {
            console.log("[ProjectDataManager] Project data already loaded, returning cached data");
            return this.projectData;
        }

        try {
            console.log("[ProjectDataManager] Loading project data from", url);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`[ProjectDataManager] Failed to fetch: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error("[ProjectDataManager] Response content:", text);
                return null;
            }

            const data: ProjectData = await response.json();
            this.projectData = data;
            console.log("[ProjectDataManager] Project data loaded successfully");
            return data;
        } catch (err) {
            console.error("[ProjectDataManager] Error loading project data:", err);
            return null;
        }
    }

    /** Get the loaded project data */
    public getProjectData(): ProjectData | null {
        return this.projectData;
    }

    /** Get a specific type by name */
    public getType(typeName: string): TypeData | undefined {
        return this.projectData?.types.find(t => t.typeName === typeName);
    }
}
