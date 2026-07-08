import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AppContext } from '../types'
import { AdminLead } from '../types'
import { type ContactRow, toAdminLead } from './adminLead'

export class AdminLeadFetchAPI extends OpenAPIRoute {
  schema = {
    tags: ['Admin Leads'],
    summary: 'Get an admin lead by ID',
    request: {
      params: z.object({
        leadId: z.string().describe('Lead ID'),
      }),
    },
    responses: {
      '200': {
        description: 'Admin lead details',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: AdminLead,
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
      '404': {
        description: 'Admin lead not found',
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
      const { leadId } = data.params

      const contact = await c.env.DB.prepare(
        'SELECT id, name, email, phone, company, subject, message, status, created_at, updated_at FROM contacts WHERE id = ?',
      )
        .bind(leadId)
        .first<ContactRow>()

      if (!contact) {
        return c.json(
          {
            success: false,
            error: 'Admin lead not found',
          },
          404,
        )
      }

      return c.json({
        success: true,
        data: toAdminLead(contact),
      })
    } catch (error) {
      console.error('Admin lead fetch error:', error)
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
