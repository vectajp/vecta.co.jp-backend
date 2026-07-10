import type { AdminLeadData, AdminLeadStatus } from '../types'
import { parseAsTokyoTime } from '../utils/date'

export type AdminLead = AdminLeadData

export interface ContactRow {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  subject: string
  message: string
  status: string
  created_at: string
  updated_at: string
}

export function toAdminTimestamp(value: string): string {
  return parseAsTokyoTime(value).format()
}

export function toAdminLeadStatus(status: string): AdminLeadStatus {
  switch (status) {
    case 'in_progress':
      return 'reviewing'
    case 'completed':
      return 'closed'
    case 'ignored':
      return 'ignored'
    case 'new':
      return 'new'
    default:
      return 'new'
  }
}

export function toAdminLead(row: ContactRow): AdminLead {
  return {
    id: row.id,
    sourceSite: 'vecta.co.jp',
    leadType: 'contact',
    companyName: row.company ?? undefined,
    personName: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    subject: row.subject,
    message: row.message,
    status: toAdminLeadStatus(row.status),
    receivedAt: toAdminTimestamp(row.created_at),
    updatedAt: toAdminTimestamp(row.updated_at),
  }
}
