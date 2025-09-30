// fetchUnits.ts
import { UnitObject } from "../types/unitObject"

export async function fetchUnits(): Promise<UnitObject[]> {
  const url = 'https://nawas-tower-default-rtdb.firebaseio.com/.json'

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`)
  }

  const data = await response.json()

  // Ensure Apartments exists and is an array
  if (!data || !Array.isArray(data.Apartments)) {
    throw new Error('Invalid database structure: "Apartments" not found')
  }

  // Map to UnitObject instances
  return data.Apartments.map((apt: any) => new UnitObject(apt))
}
