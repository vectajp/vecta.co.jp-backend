import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AppContext } from '../types'

export class AdminLeadDeleteAPI extends OpenAPIRoute {
  schema = {
    tags: ['Admin Leads'],
    summary: 'Delete an admin lead',
    request: {
      params: z.object({
        leadId: z.string().describe('Lead ID'),
      }),
    },
    responses: {
      '204': {
        description: 'Admin lead deleted',
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
      const result = await c.env.DB.prepare('DELETE FROM contacts WHERE id = ?')
        .bind(leadId)
        .run()

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Failed to delete admin lead',
          },
          500,
        )
      }

      if (result.meta.changes === 0) {
        return c.json(
          {
            success: false,
            error: 'Admin lead not found',
          },
          404,
        )
      }

      return c.body(null, 204)
    } catch (error) {
      console.error('Admin lead delete error:', error)
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
