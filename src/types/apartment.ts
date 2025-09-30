export interface ApartmentProperties {
    id:number
    type: string
    floor: number
    area: number
    typology: string
    view: string
    status: 'Available' | 'Sold' | 'Reserved'
    bedrooms: number
}