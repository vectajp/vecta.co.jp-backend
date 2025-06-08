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

describe('Contacts API', () => {
  test('allows access to contacts endpoint without API key in development', async () => {
    const req = new Request('http://localhost/contacts')
    const res = await app.fetch(req, {
      DB: mockDB,
      ENVIRONMENT: 'development',
    })

    expect(res.status).toBe(200)
  })

  test('creates a new contact in development', async () => {
    const mockRunSuccess = {
      prepare: () => ({
        bind: () => ({
          run: async () => ({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('http://localhost/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '山田太郎',
        email: 'taro@example.com',
        subject: 'お問い合わせテスト',
        message: 'これはテストメッセージです。',
      }),
    })

    const res = await app.fetch(req, {
      DB: mockRunSuccess,
      ENVIRONMENT: 'development',
    })

    expect(res.status).toBe(201)
    const json = (await res.json()) as {
      success: boolean
      data: {
        id: string
        name: string
        email: string
        phone: string | null
        company: string | null
        subject: string
        message: string
        status: string
        created_at: string
        updated_at: string
      }
    }
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('山田太郎')
    expect(json.data.email).toBe('taro@example.com')
  })

  test('requires API key for contacts endpoint in production', async () => {
    const req = new Request('http://localhost/contacts')
    const res = await app.fetch(req, {
      DB: mockDB,
      ENVIRONMENT: 'production',
    })

    expect(res.status).toBe(401)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Unauthorized')
  })

  test('accepts valid API key for contacts in production', async () => {
    const req = new Request('http://localhost/contacts', {
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
