import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AppContext } from '../types'

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
