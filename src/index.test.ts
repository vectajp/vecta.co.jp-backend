import { describe, expect, test } from 'bun:test'
import type { D1Database } from '@cloudflare/workers-types'
import { SignJWT, exportJWK, generateKeyPair } from 'jose'
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

let accessFixtureIndex = 0

async function createAccessTokenFixture() {
  accessFixtureIndex += 1
  const teamDomain = `test-${accessFixtureIndex}.cloudflareaccess.com`
  const issuer = `https://${teamDomain}`
  const audience = 'test-aud'
  const jwksUrl = `${issuer}/cdn-cgi/access/certs`
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  const kid = 'test-key'
  const token = await new SignJWT({ sub: 'user@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey)

  return {
    audience,
    issuer,
    jwks: { keys: [{ ...jwk, alg: 'RS256', kid, use: 'sig' }] },
    jwksUrl,
    teamDomain,
    token,
  }
}

type AccessTokenFixture = Awaited<ReturnType<typeof createAccessTokenFixture>>

function installAccessJwksFixture(access: AccessTokenFixture) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    if (input.toString() === access.jwksUrl) {
      return Response.json(access.jwks)
    }
    return originalFetch(input, init)
  }) as typeof fetch

  return () => {
    globalThis.fetch = originalFetch
  }
}

function adminBindings(access: AccessTokenFixture, db: D1Database) {
  return {
    ACCESS_POLICY_AUD: access.audience,
    ACCESS_TEAM_DOMAIN: access.teamDomain,
    DB: db,
    ENVIRONMENT: 'development',
  }
}

describe('Admin Leads API', () => {
  test('rejects admin lead requests without Access JWT before querying D1', async () => {
    let prepareCalls = 0
    const db = {
      prepare: () => {
        prepareCalls += 1
        throw new Error('D1 should not be queried')
      },
    } as unknown as D1Database

    const req = new Request('http://localhost/admin/leads')
    const res = await app.fetch(req, {
      ACCESS_POLICY_AUD: 'test-aud',
      ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com',
      DB: db,
      ENVIRONMENT: 'development',
    })

    expect(res.status).toBe(401)
    expect(prepareCalls).toBe(0)
  })

  test('returns normalized contact leads with valid Access JWT', async () => {
    const access = await createAccessTokenFixture()
    const restoreFetch = installAccessJwksFixture(access)

    const rows = [
      {
        id: 'contact-001',
        name: '山田太郎',
        email: 'taro@example.com',
        phone: '03-1234-5678',
        company: 'テスト株式会社',
        subject: '相談',
        message: '問い合わせ本文',
        status: 'in_progress',
        created_at: '2026-07-08 10:11:12',
        updated_at: '2026-07-08 11:12:13',
      },
      {
        id: 'contact-002',
        name: '佐藤花子',
        email: 'hanako@example.com',
        phone: null,
        company: null,
        subject: '対象外の相談',
        message: '営業対象外の問い合わせ本文',
        status: 'ignored',
        created_at: '2026-07-08 12:13:14',
        updated_at: '2026-07-08 13:14:15',
      },
    ]
    const db = {
      prepare: (query: string) => ({
        bind: () => ({
          all: async () => ({ results: rows }),
          first: async () => ({
            count: query.includes('COUNT') ? rows.length : undefined,
          }),
        }),
      }),
    } as unknown as D1Database

    try {
      const req = new Request('http://localhost/admin/leads', {
        headers: {
          'Cf-Access-Jwt-Assertion': access.token,
        },
      })
      const res = await app.fetch(req, {
        ...adminBindings(access, db),
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        success: boolean
        data: Array<{
          id: string
          sourceSite: string
          leadType: string
          companyName?: string
          personName: string
          email: string
          phone?: string
          subject: string
          message: string
          status: string
          receivedAt: string
          updatedAt: string
        }>
        meta: { total: number }
      }
      expect(json.success).toBe(true)
      expect(json.meta.total).toBe(2)
      expect(json.data).toEqual([
        {
          id: 'contact-001',
          sourceSite: 'vecta.co.jp',
          leadType: 'contact',
          companyName: 'テスト株式会社',
          personName: '山田太郎',
          email: 'taro@example.com',
          phone: '03-1234-5678',
          subject: '相談',
          message: '問い合わせ本文',
          status: 'reviewing',
          receivedAt: '2026-07-08T10:11:12+09:00',
          updatedAt: '2026-07-08T11:12:13+09:00',
        },
        {
          id: 'contact-002',
          sourceSite: 'vecta.co.jp',
          leadType: 'contact',
          personName: '佐藤花子',
          email: 'hanako@example.com',
          subject: '対象外の相談',
          message: '営業対象外の問い合わせ本文',
          status: 'ignored',
          receivedAt: '2026-07-08T12:13:14+09:00',
          updatedAt: '2026-07-08T13:14:15+09:00',
        },
      ])
    } finally {
      restoreFetch()
    }
  })

  test('updates an admin lead status to ignored with valid Access JWT', async () => {
    const access = await createAccessTokenFixture()
    const restoreFetch = installAccessJwksFixture(access)
    const updatedRow = {
      id: 'contact-001',
      name: '山田太郎',
      email: 'taro@example.com',
      phone: '03-1234-5678',
      company: 'テスト株式会社',
      subject: '相談',
      message: '問い合わせ本文',
      status: 'ignored',
      created_at: '2026-07-08 10:11:12',
      updated_at: '2026-07-08 12:13:14',
    }
    const updateParams: unknown[][] = []
    const db = {
      prepare: (query: string) => ({
        bind: (...params: unknown[]) => {
          if (query.startsWith('UPDATE contacts')) {
            updateParams.push(params)
            return {
              run: async () => ({ success: true }),
            }
          }

          return {
            first: async () => updatedRow,
          }
        },
      }),
    } as unknown as D1Database

    try {
      const req = new Request(
        'http://localhost/admin/leads/contact-001/status',
        {
          method: 'PATCH',
          headers: {
            'Cf-Access-Jwt-Assertion': access.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'ignored' }),
        },
      )
      const res = await app.fetch(req, {
        ...adminBindings(access, db),
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        success: boolean
        data: {
          id: string
          status: string
          updatedAt: string
        }
      }
      expect(json).toMatchObject({
        success: true,
        data: {
          id: 'contact-001',
          status: 'ignored',
          updatedAt: '2026-07-08T12:13:14+09:00',
        },
      })
      expect(updateParams).toHaveLength(1)
      expect(updateParams[0][0]).toBe('ignored')
      expect(updateParams[0][2]).toBe('contact-001')
    } finally {
      restoreFetch()
    }
  })

  test('rejects unsupported admin lead status values', async () => {
    const access = await createAccessTokenFixture()
    const restoreFetch = installAccessJwksFixture(access)
    let prepareCalls = 0
    const db = {
      prepare: () => {
        prepareCalls += 1
        throw new Error('D1 should not be queried')
      },
    } as unknown as D1Database

    try {
      const req = new Request(
        'http://localhost/admin/leads/contact-001/status',
        {
          method: 'PATCH',
          headers: {
            'Cf-Access-Jwt-Assertion': access.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'archived' }),
        },
      )
      const res = await app.fetch(req, {
        ...adminBindings(access, db),
      })

      expect(res.status).toBe(400)
      expect(prepareCalls).toBe(0)
    } finally {
      restoreFetch()
    }
  })

  test('rejects admin lead status updates without Access JWT before querying D1', async () => {
    let prepareCalls = 0
    const db = {
      prepare: () => {
        prepareCalls += 1
        throw new Error('D1 should not be queried')
      },
    } as unknown as D1Database

    const req = new Request('http://localhost/admin/leads/contact-001/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'ignored' }),
    })
    const res = await app.fetch(req, {
      ACCESS_POLICY_AUD: 'test-aud',
      ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com',
      DB: db,
      ENVIRONMENT: 'development',
    })

    expect(res.status).toBe(401)
    expect(prepareCalls).toBe(0)
  })
})
