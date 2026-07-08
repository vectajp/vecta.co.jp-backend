import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AppContext } from '../types'
import { AdminLead } from '../types'
import { type ContactRow, toAdminLead } from './adminLead'

export class AdminLeadListAPI extends OpenAPIRoute {
  schema = {
    tags: ['Admin Leads'],
    summary: 'List admin leads with pagination',
    request: {
      query: z.object({
        page: z.number().int().min(1).default(1).describe('Page number'),
      }),
    },
    responses: {
      '200': {
        description: 'List of admin leads',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.array(AdminLead),
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
      '401': {
        description: 'Unauthorized',
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

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { page } = data.query

      const countResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM contacts',
      )
        .bind()
        .first<{ count: number }>()
      const total = countResult?.count || 0

      const perPage = 20
      const offset = (page - 1) * perPage
      const result = await c.env.DB.prepare(
        'SELECT id, name, email, phone, company, subject, message, status, created_at, updated_at FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      )
        .bind(perPage, offset)
        .all<ContactRow>()

      return c.json({
        success: true,
        data: (result.results || []).map(toAdminLead),
        meta: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
        },
      })
    } catch (error) {
      console.error('Admin lead list error:', error)
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
