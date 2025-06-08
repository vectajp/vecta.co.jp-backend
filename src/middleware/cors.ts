import type { MiddlewareHandler } from 'hono'

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('Origin')

  // 環境変数からCORS許可オリジンを取得（カンマ区切り）
  const corsOrigins = c.env.CORS_ALLOWED_ORIGINS

  if (corsOrigins) {
    // 環境変数が設定されている場合のみ、指定されたオリジンを許可
    const allowedOrigins = corsOrigins.split(',').map((o: string) => o.trim())
    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin)
      c.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      )
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      c.header('Access-Control-Max-Age', '86400')
    }
  }
  // 環境変数が設定されていない場合はCORSヘッダーを設定しない（すべて拒否）

  // OPTIONSリクエストの処理
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}
