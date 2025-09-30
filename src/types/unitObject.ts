// unitObject.ts
export class UnitObject {
  ApartmentArea: number
  ApartmentBedrooms: number
  ApartmentFloor: number
  ApartmentStatus: string
  ApartmentType: string
  ApartmentTypology: string
  ApartmentUnitCode: number
  ApartmentView: string
  ID: number

  constructor(data: any) {
    this.ApartmentArea = data.ApartmentArea
    this.ApartmentBedrooms = data.ApartmentBedrooms
    this.ApartmentFloor = data.ApartmentFloor
    this.ApartmentStatus = data.ApartmentStatus
    this.ApartmentType = data.ApartmentType
    this.ApartmentTypology = data.ApartmentTypology
    this.ApartmentUnitCode = data.ApartmentUnitCode
    this.ApartmentView = data.ApartmentView
    this.ID = data.ID
  }
}
