import type { MiddlewareHandler } from 'hono'

export const apiKeyAuth: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header('X-API-Key')

  // 環境変数からAPIキーを取得
  const validApiKey = c.env.API_KEY

  if (!apiKey || apiKey !== validApiKey) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}

// Refererチェック（追加の保護層）
export const refererCheck: MiddlewareHandler = async (c, next) => {
  const referer = c.req.header('Referer')
  const allowedReferers = ['https://vecta.co.jp/', 'https://www.vecta.co.jp/']

  if (
    !referer ||
    !allowedReferers.some((allowed) => referer.startsWith(allowed))
  ) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await next()
}
