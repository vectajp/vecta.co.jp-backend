import type { MiddlewareHandler } from 'hono'

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('Origin')

  // 環境変数からCORS許可オリジンを取得（カンマ区切り）
  const corsOrigins = c.env.CORS_ALLOWED_ORIGINS
  const adminCorsOrigins = c.env.ADMIN_CORS_ALLOWED_ORIGINS
  let isAllowed = false
  let allowsCredentials = false

  if (corsOrigins && origin) {
    // 環境変数が設定されている場合のみ、指定されたオリジンを許可
    const allowedOrigins = corsOrigins.split(',').map((o: string) => o.trim())
    if (allowedOrigins.includes(origin)) {
      isAllowed = true
    }
  }

  if (adminCorsOrigins && origin && c.req.path.startsWith('/admin/')) {
    const allowedAdminOrigins = adminCorsOrigins
      .split(',')
      .map((o: string) => o.trim())
    if (allowedAdminOrigins.includes(origin)) {
      isAllowed = true
      allowsCredentials = true
    }
  }

  if (isAllowed && origin) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    c.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-API-Key, Cf-Access-Jwt-Assertion',
    )
    c.header('Access-Control-Max-Age', '86400')
    c.header('Vary', 'Origin')
    if (allowsCredentials) {
      c.header('Access-Control-Allow-Credentials', 'true')
    }
  }

  // OPTIONSリクエストの処理
  if (c.req.method === 'OPTIONS') {
    return isAllowed ? c.body(null, 204) : c.text('Forbidden', 403)
  }

  await next()
}
