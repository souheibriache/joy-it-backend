import { wilayas, Wilaya } from '../wilayas'

describe('Wilayas Constants', () => {
  it('should define wilayas as an array', () => {
    expect(Array.isArray(wilayas)).toBe(true)
    expect(wilayas.length).toBeGreaterThan(0)
  })

  it('should have correct structure for each wilaya', () => {
    wilayas.forEach((wilaya: Wilaya) => {
      expect(wilaya).toHaveProperty('id')
      expect(wilaya).toHaveProperty('code')
      expect(wilaya).toHaveProperty('name')
      expect(wilaya).toHaveProperty('ar_name')
      expect(wilaya).toHaveProperty('longitude')
      expect(wilaya).toHaveProperty('latitude')
    })
  })

  it('should have valid data types for each wilaya property', () => {
    wilayas.forEach((wilaya: Wilaya) => {
      expect(typeof wilaya.id).toBe('string')
      expect(typeof wilaya.code).toBe('string')
      expect(typeof wilaya.name).toBe('string')
      expect(typeof wilaya.ar_name).toBe('string')
      expect(typeof wilaya.longitude).toBe('string')
      expect(typeof wilaya.latitude).toBe('string')
    })
  })

  it('should have unique IDs and codes', () => {
    const ids = new Set(wilayas.map((w) => w.id))
    const codes = new Set(wilayas.map((w) => w.code))
    expect(ids.size).toBe(wilayas.length)
    expect(codes.size).toBe(wilayas.length)
  })

  it('should have valid coordinates', () => {
    wilayas.forEach((wilaya: Wilaya) => {
      const longitude = parseFloat(wilaya.longitude)
      const latitude = parseFloat(wilaya.latitude)

      expect(isNaN(longitude)).toBe(false)
      expect(isNaN(latitude)).toBe(false)

      // Valid longitude range is -180 to +180
      expect(longitude).toBeGreaterThanOrEqual(-180)
      expect(longitude).toBeLessThanOrEqual(180)

      // Valid latitude range is -90 to +90
      expect(latitude).toBeGreaterThanOrEqual(-90)
      expect(latitude).toBeLessThanOrEqual(90)
    })
  })

  it('should contain major Algerian cities', () => {
    const majorCities = ['Alger', 'Oran', 'Constantine', 'Annaba']
    const wilayaNames = wilayas.map((w) => w.name)

    majorCities.forEach((city) => {
      expect(wilayaNames).toContain(city)
    })
  })

  it('should have matching IDs and codes', () => {
    wilayas.forEach((wilaya: Wilaya) => {
      expect(wilaya.id).toBe(wilaya.code)
    })
  })
})
