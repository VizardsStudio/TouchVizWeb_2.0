export interface FilterCriteria {
    type?: string[]            // e.g. ["apartment", "penthouse"]
    floorRange?: [number, number]
    areaRange?: [number, number]
    typology?: string[]        // e.g. ["studio", "2BR"]
    view?: string[]            // e.g. ["sea", "city"]
    status?: string[]          // e.g. ["available", "sold"]
    bedrooms?: number[]        // e.g. [1, 2, 3]
}
