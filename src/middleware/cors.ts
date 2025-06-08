import type { MiddlewareHandler } from 'hono'

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('Origin')
  const allowedOrigins = ['https://vecta.co.jp', 'https://www.vecta.co.jp']

  // 開発環境でのみlocalhostを許可
  if (c.env.ENVIRONMENT === 'development') {
    allowedOrigins.push('http://localhost:3000')
  }

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.header('Access-Control-Max-Age', '86400')
  }

  // OPTIONSリクエストの処理
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}
