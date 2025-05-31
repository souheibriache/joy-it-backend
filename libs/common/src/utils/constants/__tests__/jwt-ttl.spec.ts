import {
  REFRESH_TOKEN_TTL,
  ACCESS_TOKEN_TTL,
  RESET_PASSWORD_TOKEN_TTL,
  CONFIRM_ACCOUNT_TOKEN_TTL,
} from '../jwt-ttl'

describe('JWT TTL Constants', () => {
  it('should define REFRESH_TOKEN_TTL as 15 days in seconds', () => {
    const fifteenDaysInSeconds = 60 * 60 * 24 * 15
    expect(REFRESH_TOKEN_TTL).toBe(fifteenDaysInSeconds)
  })

  it('should define ACCESS_TOKEN_TTL as 24 hours in seconds', () => {
    const twentyFourHoursInSeconds = 60 * 60 * 24 * 1
    expect(ACCESS_TOKEN_TTL).toBe(twentyFourHoursInSeconds)
  })

  it('should define RESET_PASSWORD_TOKEN_TTL as 10 minutes in seconds', () => {
    const tenMinutesInSeconds = 60 * 10
    expect(RESET_PASSWORD_TOKEN_TTL).toBe(tenMinutesInSeconds)
  })

  it('should define CONFIRM_ACCOUNT_TOKEN_TTL as 10 minutes in seconds', () => {
    const tenMinutesInSeconds = 60 * 10
    expect(CONFIRM_ACCOUNT_TOKEN_TTL).toBe(tenMinutesInSeconds)
  })

  it('should ensure REFRESH_TOKEN_TTL is greater than ACCESS_TOKEN_TTL', () => {
    expect(REFRESH_TOKEN_TTL).toBeGreaterThan(ACCESS_TOKEN_TTL)
  })

  it('should ensure token TTLs are positive numbers', () => {
    expect(REFRESH_TOKEN_TTL).toBeGreaterThan(0)
    expect(ACCESS_TOKEN_TTL).toBeGreaterThan(0)
    expect(RESET_PASSWORD_TOKEN_TTL).toBeGreaterThan(0)
    expect(CONFIRM_ACCOUNT_TOKEN_TTL).toBeGreaterThan(0)
  })

  it('should ensure RESET_PASSWORD_TOKEN_TTL equals CONFIRM_ACCOUNT_TOKEN_TTL', () => {
    expect(RESET_PASSWORD_TOKEN_TTL).toBe(CONFIRM_ACCOUNT_TOKEN_TTL)
  })
})
