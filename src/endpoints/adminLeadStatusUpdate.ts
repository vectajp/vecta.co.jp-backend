import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import type { AdminLeadStatusUpdateStatus, AppContext } from '../types'
import { AdminLead, AdminLeadStatusUpdate } from '../types'
import { now } from '../utils/date'
import { type ContactRow, toAdminLead, toContactStatus } from './adminLead'

function updateContactStatus(
  c: AppContext,
  leadId: string,
  status: AdminLeadStatusUpdateStatus,
) {
  return c.env.DB.prepare(
    'UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?',
  )
    .bind(toContactStatus(status), now(), leadId)
    .run()
}

function fetchContact(c: AppContext, leadId: string) {
  return c.env.DB.prepare(
    'SELECT id, name, email, phone, company, subject, message, status, created_at, updated_at FROM contacts WHERE id = ?',
  )
    .bind(leadId)
    .first<ContactRow>()
}

export class AdminLeadStatusUpdateAPI extends OpenAPIRoute {
  schema = {
    tags: ['Admin Leads'],
    summary: 'Update an admin lead status',
    request: {
      params: z.object({
        leadId: z.string().describe('Lead ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: AdminLeadStatusUpdate,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Updated admin lead',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: AdminLead,
            }),
          },
        },
      },
      '400': {
        description: 'Invalid status update request',
        content: {
          'application/json': {
            schema: z.object({
              errors: z.array(z.unknown()),
              result: z.object({}),
              success: z.boolean(),
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
    const data = await this.getValidatedData<typeof this.schema>()
    const { leadId } = data.params
    const { status } = data.body

    try {
      const updateResult = await updateContactStatus(c, leadId, status)
      if (!updateResult.success) {
        return c.json(
          {
            success: false,
            error: 'Failed to update admin lead status',
          },
          500,
        )
      }

      const contact = await fetchContact(c, leadId)
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
      console.error('Admin lead status update error:', error)
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
