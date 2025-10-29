import type { ProjectData, TypeData } from "../types/interiorTour";

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

            const raw: any = await response.json();
            // Normalize shape: ensure types exist and interiorTours is optional
            const data: ProjectData = {
                projectName: raw.projectName || "",
                types: Array.isArray(raw.types)
                    ? raw.types.map((t: any) => ({
                        typeName: t.typeName || t.name || "",
                        interiorTours: t.interiorTours || t.InteriorTours || undefined,
                        Plans3d: t.Plans3d || undefined,
                    }))
                    : [],
            };
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
