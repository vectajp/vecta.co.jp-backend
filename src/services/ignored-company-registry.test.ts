import { describe, expect, test } from 'bun:test'
import { checkIgnoredCompanyEmail } from './ignored-company-registry'

describe('ignored company Registry client', () => {
  test('posts the original email and validates the response', async () => {
    const calls: Array<{
      body: string
      headers: Record<string, string>
      method: string
      url: string
    }> = []
    const registry = {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({
          body: await new Response(init?.body).text(),
          headers: Object.fromEntries(new Headers(init?.headers).entries()),
          method: init?.method ?? 'GET',
          url: String(input),
        })
        return Response.json({
          success: true,
          data: { domain: 'example.com', ignored: true },
        })
      },
    } as unknown as Fetcher

    await expect(
      checkIgnoredCompanyEmail(registry, 'Sales@EXAMPLE.COM'),
    ).resolves.toEqual({ domain: 'example.com', ignored: true })
    expect(calls).toEqual([
      {
        body: JSON.stringify({ email: 'Sales@EXAMPLE.COM' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        url: 'https://registry.internal/v1/domains/check',
      },
    ])
  })

  test.each([
    ['non-2xx', () => new Response(null, { status: 503 })],
    [
      'malformed schema',
      () => Response.json({ success: true, data: { ignored: 'yes' } }),
    ],
    ['invalid JSON', () => new Response('not-json')],
  ])('rejects %s responses', async (_name, createResponse) => {
    const registry = {
      fetch: async () => createResponse(),
    } as unknown as Fetcher

    await expect(
      checkIgnoredCompanyEmail(registry, 'user@example.com'),
    ).rejects.toThrow()
  })
})
