export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface HotSpotData {
    index: number;
    panoPath: string;
    position: Position;
    visible?: number[];
    label?: string;
}

export interface InteriorTour {
    interiorName: string;
    tours: HotSpotData[];
}

export interface TypeData {
    typeName: string;
    interiorTours?: InteriorTour; // keep optional for backward compatibility
    Plans3d?: { glbPath: string };
}

export interface ProjectData {
    projectName: string;
    types: TypeData[];
}
