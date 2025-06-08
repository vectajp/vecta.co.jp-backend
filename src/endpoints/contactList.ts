import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AppContext } from '../types'

/**
 * お問い合わせ一覧取得エンドポイント
 *
 * GET /contacts
 *
 * お問い合わせの一覧をページネーション付きで取得します。
 * ステータスによるフィルタリングも可能です。
 * このエンドポイントはAPIキー認証が必要です。
 */
export class ContactListAPI extends OpenAPIRoute {
  schema = {
    tags: ['Contacts'],
    summary: 'List contacts with pagination',
    request: {
      query: z.object({
        page: z.number().int().min(1).default(1).describe('Page number'),
        status: z
          .enum(['new', 'in_progress', 'completed'])
          .optional()
          .describe('Filter by status'),
      }),
    },
    responses: {
      '200': {
        description: 'List of contacts',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  email: z.string(),
                  phone: z.string().nullable(),
                  company: z.string().nullable(),
                  subject: z.string(),
                  message: z.string(),
                  status: z.string(),
                  created_at: z.string(),
                  updated_at: z.string(),
                }),
              ),
              meta: z.object({
                page: z.number(),
                per_page: z.number(),
                total: z.number(),
                total_pages: z.number(),
              }),
            }),
          },
        },
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
    },
  }

  /**
   * リクエストハンドラー
   *
   * 1. クエリパラメータからページネーション情報とフィルタを取得
   * 2. 条件に応じたSQLクエリを構築
   * 3. 総件数を取得（ページネーション計算用）
   * 4. 指定されたページのデータを取得
   * 5. ページネーション情報とともにレスポンスを返却
   */
  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { page, status } = data.query

      // Build query
      let query =
        'SELECT id, name, email, phone, company, subject, message, status, created_at, updated_at FROM contacts'
      const params: (string | number)[] = []

      if (status !== undefined) {
        query += ' WHERE status = ?'
        params.push(status)
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM contacts${status !== undefined ? ' WHERE status = ?' : ''}`
      const countResult = await c.env.DB.prepare(countQuery)
        .bind(...params)
        .first<{ count: number }>()
      const total = countResult?.count || 0

      // Add pagination
      const perPage = 20
      const offset = (page - 1) * perPage
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(perPage, offset)

      // Execute query
      const result = await c.env.DB.prepare(query)
        .bind(...params)
        .all()

      return c.json({
        success: true,
        data: result.results || [],
        meta: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
        },
      })
    } catch (error) {
      console.error('Contact list error:', error)
      return c.json(
        {
          success: false,
          error: 'Database error occurred',
        },
        500,
      )
    }
  }
}
