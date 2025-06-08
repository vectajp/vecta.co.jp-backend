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

  // 環境変数から許可されたRefererを取得（カンマ区切り）
  const allowedReferersEnv = c.env.ALLOWED_REFERERS

  // 環境変数が設定されていない場合はすべて拒否
  if (!allowedReferersEnv) {
    return c.json({ error: 'Forbidden - No allowed referers configured' }, 403)
  }

  const allowedReferers = allowedReferersEnv
    .split(',')
    .map((r: string) => r.trim())

  if (
    !referer ||
    !allowedReferers.some((allowed: string) => referer.startsWith(allowed))
  ) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await next()
}
