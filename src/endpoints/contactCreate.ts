import { OpenAPIRoute } from 'chanfana'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { sendContactEmail } from '../services/email'
import type { AppContext } from '../types'
import { ContactCreate } from '../types'
import { formatDateJapanese, now } from '../utils/date'

/**
 * お問い合わせ作成エンドポイント
 *
 * POST /contacts
 *
 * お問い合わせフォームから送信されたデータをデータベースに保存します。
 * このエンドポイントは認証不要で、公開されています。
 */
export class ContactCreateAPI extends OpenAPIRoute {
  schema = {
    tags: ['Contacts'],
    summary: 'Create a new contact',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ContactCreate,
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Contact created successfully',
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
      '400': {
        description: 'Invalid request',
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
   * 1. リクエストボディのバリデーション
   * 2. 一意のIDを生成（nanoid使用）
   * 3. データベースにお問い合わせ情報を保存
   * 4. 成功/失敗レスポンスを返却
   */
  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const contactData = data.body

      const currentTime = now()
      const id = nanoid()

      const contact = {
        id,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || null,
        company: contactData.company || null,
        subject: contactData.subject,
        message: contactData.message,
        status: 'new',
        created_at: currentTime,
        updated_at: currentTime,
      }

      const result = await c.env.DB.prepare(
        `INSERT INTO contacts (id, name, email, phone, company, subject, message, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          contact.id,
          contact.name,
          contact.email,
          contact.phone,
          contact.company,
          contact.subject,
          contact.message,
          contact.status,
          contact.created_at,
          contact.updated_at,
        )
        .run()

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Failed to create contact',
          },
          500,
        )
      }

      // メール送信
      try {
        await sendContactEmail(
          {
            name: contact.name,
            email: contact.email,
            subject: contact.subject,
            message: contact.message,
            submittedAt: formatDateJapanese(contact.created_at),
          },
          c.env,
        )
      } catch (emailError) {
        // メール送信に失敗してもレスポンスは成功として返す（データは保存されているため）
        console.error('Failed to send email notification:', emailError)
      }

      return c.json(
        {
          success: true,
          data: contact,
        },
        201,
      )
    } catch (error) {
      console.error('Contact creation error:', error)
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
