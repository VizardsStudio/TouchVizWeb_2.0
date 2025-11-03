export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Tour {
    index: number;
    isDuplexStartingPoint: boolean;
    spaceName: string;
    panoPath: string;
    position: Position;
    visibleHotspots: number[];
}

export interface InteriorTours {
    interiorName: string;
    tours: Tour[];
}

export interface Plans3D {
    isDuplex: boolean;
    pathLvl1: string;
    pathLvl2: string;
}

export interface TypeData {
    typeName: string;
    interiorTours?: InteriorTours;
    Plans3d?: Plans3D;
}

export interface ProjectData {
    projectName: string;
    types: TypeData[];
}
