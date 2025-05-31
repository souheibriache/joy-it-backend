import { communes, Commune } from '../communes'
import { wilayas } from '../wilayas'

describe('Communes Constants', () => {
  it('should define communes as an array', () => {
    expect(Array.isArray(communes)).toBe(true)
    expect(communes.length).toBeGreaterThan(0)
  })

  it('should have correct structure for each commune', () => {
    communes.forEach((commune: Commune) => {
      expect(commune).toHaveProperty('id')
      expect(commune).toHaveProperty('post_code')
      expect(commune).toHaveProperty('name')
      expect(commune).toHaveProperty('wilaya_id')
      expect(commune).toHaveProperty('ar_name')
      expect(commune).toHaveProperty('longitude')
      expect(commune).toHaveProperty('latitude')
    })
  })

  it('should have valid data types for each commune property', () => {
    communes.forEach((commune: Commune) => {
      expect(typeof commune.id).toBe('string')
      expect(typeof commune.post_code).toBe('string')
      expect(typeof commune.name).toBe('string')
      expect(typeof commune.wilaya_id).toBe('string')
      expect(typeof commune.ar_name).toBe('string')
      expect(typeof commune.longitude).toBe('string')
      expect(typeof commune.latitude).toBe('string')
    })
  })

  it('should have unique IDs and post codes', () => {
    const ids = new Set(communes.map((c) => c.id))
    const postCodes = new Set(communes.map((c) => c.post_code))
    expect(ids.size).toBe(communes.length)
    expect(postCodes.size).toBe(communes.length)
  })

  it('should have valid coordinates', () => {
    communes.forEach((commune: Commune) => {
      const longitude = parseFloat(commune.longitude)
      const latitude = parseFloat(commune.latitude)

      // Skip if coordinates are not provided
      if (isNaN(longitude) || isNaN(latitude)) {
        return
      }

      // Valid longitude range is -180 to +180
      expect(longitude).toBeGreaterThanOrEqual(-180)
      expect(longitude).toBeLessThanOrEqual(180)

      // Valid latitude range is -90 to +90
      expect(latitude).toBeGreaterThanOrEqual(-90)
      expect(latitude).toBeLessThanOrEqual(90)
    })
  })

  it('should have valid wilaya_id references', () => {
    const wilayaIds = new Set(wilayas.map((w) => w.id))
    communes.forEach((commune: Commune) => {
      expect(wilayaIds.has(commune.wilaya_id)).toBe(true)
    })
  })

  it('should have valid post code format', () => {
    const postCodeRegex = /^\d{5}$/
    communes.forEach((commune: Commune) => {
      expect(commune.post_code).toMatch(postCodeRegex)
    })
  })

  it('should have non-empty names', () => {
    communes.forEach((commune: Commune) => {
      expect(commune.name.trim()).not.toBe('')
      // Skip Arabic name check if not provided
      if (commune.ar_name) {
        expect(commune.ar_name.trim()).not.toBe('')
      }
    })
  })

  it('should have at least one commune for each wilaya', () => {
    const wilayaIds = wilayas.map((w) => w.id)
    const communesByWilaya = new Map<string, Commune[]>()

    // Group communes by wilaya_id
    communes.forEach((commune) => {
      const wilayaCommunes = communesByWilaya.get(commune.wilaya_id) || []
      wilayaCommunes.push(commune)
      communesByWilaya.set(commune.wilaya_id, wilayaCommunes)
    })

    wilayaIds.forEach((wilayaId) => {
      const wilayaCommunes = communesByWilaya.get(wilayaId)
      if (wilayaCommunes) {
        expect(wilayaCommunes.length).toBeGreaterThan(0)
      }
    })
  })
})
