import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rateLimit'

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test-key-1')
    expect(result.success).toBe(true)
  })

  it('allows requests within limit', () => {
    const key = 'test-key-2'
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5)
      expect(result.success).toBe(true)
    }
  })

  it('blocks requests over limit', () => {
    const key = 'test-key-3'
    // Use up all attempts
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000)
    }
    // Next should be blocked
    const result = checkRateLimit(key, 3, 60000)
    expect(result.success).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('returns retryAfter in seconds', () => {
    const key = 'test-key-4'
    for (let i = 0; i < 2; i++) {
      checkRateLimit(key, 2, 30000)
    }
    const result = checkRateLimit(key, 2, 30000)
    expect(result.success).toBe(false)
    expect(result.retryAfter).toBeLessThanOrEqual(30)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('uses separate counters for different keys', () => {
    const key1 = 'test-key-5a'
    const key2 = 'test-key-5b'
    // Exhaust key1
    for (let i = 0; i < 2; i++) checkRateLimit(key1, 2, 60000)
    // key2 should still work
    const result = checkRateLimit(key2, 2, 60000)
    expect(result.success).toBe(true)
  })
})
