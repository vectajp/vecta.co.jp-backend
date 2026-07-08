import type { MiddlewareHandler } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion'
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function normalizeTeamDomain(teamDomain: string): string {
  const trimmed = teamDomain.trim().replace(/\/+$/, '')
  return trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`
}

function getJwks(url: string) {
  const cached = jwksCache.get(url)
  if (cached) {
    return cached
  }

  const jwks = createRemoteJWKSet(new URL(url))
  jwksCache.set(url, jwks)
  return jwks
}

export const cloudflareAccessAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header(ACCESS_JWT_HEADER)
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const teamDomain = c.env.ACCESS_TEAM_DOMAIN
  const audience = c.env.ACCESS_POLICY_AUD
  if (!teamDomain || !audience) {
    return c.json(
      { success: false, error: 'Access configuration missing' },
      500,
    )
  }

  const issuer = normalizeTeamDomain(teamDomain)
  const jwksUrl = c.env.ACCESS_JWKS_URL ?? `${issuer}/cdn-cgi/access/certs`

  try {
    await jwtVerify(token, getJwks(jwksUrl), {
      audience,
      issuer,
    })
  } catch {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  await next()
}
