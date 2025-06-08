import { describe, expect, test } from 'bun:test'
import type { D1Database } from '@cloudflare/workers-types'
import app from './index'

// Mock D1 database with proper typing
const mockDB = {
  prepare: () => ({
    bind: () => ({
      all: async () => ({ results: [] }),
      first: async () => null,
      run: async () => ({ success: true }),
    }),
  }),
} as unknown as D1Database

describe('Vecta Backend API', () => {
  test('responds with OpenAPI docs at root', async () => {
    const req = new Request('http://localhost/')
    const res = await app.fetch(req, {
      DB: mockDB,
      ENVIRONMENT: 'development',
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  test('allows access to tasks endpoint without API key in development', async () => {
    const req = new Request('http://localhost/tasks')
    const res = await app.fetch(req, {
      DB: mockDB,
      ENVIRONMENT: 'development',
    })

    expect(res.status).toBe(200)
  })

  test('requires API key for tasks endpoint in production', async () => {
    const req = new Request('http://localhost/tasks')
    const res = await app.fetch(req, {
      DB: mockDB,
      ENVIRONMENT: 'production',
    })

    expect(res.status).toBe(401)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Unauthorized')
  })

  test('accepts valid API key in production', async () => {
    const req = new Request('http://localhost/tasks', {
      headers: {
        'X-API-Key': 'test-api-key',
      },
    })
    const res = await app.fetch(req, {
      DB: mockDB,
      ENVIRONMENT: 'production',
      API_KEY: 'test-api-key',
    })

    expect(res.status).toBe(200)
  })
})
