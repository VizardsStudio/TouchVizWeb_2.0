import { fetchUnits } from '../core/fetchUnits'
import { UnitObject } from '../types/unitObject'

class UnitManager {
    private static _instance: UnitManager
    private _units: UnitObject[] = []
    private _isLoaded = false
    private _isLoading = false

    private constructor() { } // prevent external instantiation

    static get instance() {
        if (!this._instance) {
            this._instance = new UnitManager()
        }
        return this._instance
    }

    /** Load units once during app startup */
    async load(): Promise<UnitObject[]> {
        if (this._isLoaded) return this._units
        if (this._isLoading) {
            // if already loading, wait for it
            return new Promise((resolve) => {
                const check = setInterval(() => {
                    if (this._isLoaded) {
                        clearInterval(check)
                        resolve(this._units)
                    }
                }, 100)
            })
        }

        try {
            this._isLoading = true
            this._units = await fetchUnits()
            this._isLoaded = true
            return this._units
        } catch (err) {
            console.error('❌ Failed to load units:', err)
            throw err
        } finally {
            this._isLoading = false
        }
    }

    /** Access all loaded units */
    get all(): UnitObject[] {
        if (!this._isLoaded)
            console.warn('⚠️ UnitManager accessed before data loaded.')
        return this._units
    }

    /** Get a unit by its numeric ID (if you extracted one) */
    getById(id: number): UnitObject | undefined {
        return this._units.find(u => u.ID === id)
    }
}

export const unitManager = UnitManager.instance
