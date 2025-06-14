import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AppContext } from '../types'

/**
 * お問い合わせ詳細取得エンドポイント
 *
 * GET /contacts/:contactId
 *
 * 指定されたIDのお問い合わせ情報を取得します。
 * このエンドポイントはAPIキー認証が必要です。
 */
export class ContactFetchAPI extends OpenAPIRoute {
  schema = {
    tags: ['Contacts'],
    summary: 'Get a contact by ID',
    request: {
      params: z.object({
        contactId: z.string().describe('Contact ID'),
      }),
    },
    responses: {
      '200': {
        description: 'Contact details',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.object({
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
            }),
          },
        },
      },
      '404': {
        description: 'Contact not found',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
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
   * 1. URLパラメータからcontactIdを取得
   * 2. データベースから該当するお問い合わせを検索
   * 3. 存在しない場合は404エラーを返却
   * 4. 存在する場合はお問い合わせ情報を返却
   */
  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { contactId } = data.params

      const contact = await c.env.DB.prepare(
        'SELECT id, name, email, phone, company, subject, message, status, created_at, updated_at FROM contacts WHERE id = ?',
      )
        .bind(contactId)
        .first()

      if (!contact) {
        return c.json(
          {
            success: false,
            error: 'Contact not found',
          },
          404,
        )
      }

      return c.json({
        success: true,
        data: contact,
      })
    } catch (error) {
      console.error('Contact fetch error:', error)
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
