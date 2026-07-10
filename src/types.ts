import { DateTime, Email, Str } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'

export type AppContext = Context<{ Bindings: Env }>

export const AdminLeadStatus = z.enum([
  'new',
  'reviewing',
  'contacted',
  'closed',
  'ignored',
])

export type AdminLeadStatus = z.infer<typeof AdminLeadStatus>

export const AdminLeadStatusUpdateStatus = z.enum([
  'new',
  'reviewing',
  'closed',
  'ignored',
])

export type AdminLeadStatusUpdateStatus = z.infer<
  typeof AdminLeadStatusUpdateStatus
>

export const AdminLeadStatusUpdate = z.object({
  status: AdminLeadStatusUpdateStatus,
})

export const ContactStatus = z.enum([
  'new',
  'in_progress',
  'completed',
  'ignored',
])

export type ContactStatus = z.infer<typeof ContactStatus>

export const AdminLead = z.object({
  id: z.string(),
  sourceSite: z.enum(['vecta.co.jp', 'swarrow.com']),
  leadType: z.enum(['contact', 'document_request']),
  companyName: z.string().optional(),
  personName: z.string(),
  personNameKana: z.string().optional(),
  email: z.string(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  status: AdminLeadStatus,
  receivedAt: z.string(),
  updatedAt: z.string(),
  assignedTo: z.string().optional(),
  notes: z
    .array(
      z.object({
        author: z.string(),
        body: z.string(),
        createdAt: z.string(),
      }),
    )
    .optional(),
})

export type AdminLeadData = z.infer<typeof AdminLead>

export const Contact = z.object({
  id: Str(),
  name: Str({ example: '山田太郎', description: 'お名前' }),
  email: Email({ example: 'taro@example.com', description: 'メールアドレス' }),
  phone: Str({
    required: false,
    example: '03-1234-5678',
    description: '電話番号',
  }),
  company: Str({
    required: false,
    example: '株式会社Example',
    description: '会社名',
  }),
  subject: Str({
    example: 'サービスについてのお問い合わせ',
    description: '件名',
  }),
  message: Str({
    example: 'サービスの詳細について教えてください。',
    description: 'お問い合わせ内容',
  }),
  status: ContactStatus.default('new'),
  created_at: DateTime(),
  updated_at: DateTime(),
})

export const ContactCreate = z.object({
  name: Str({ example: '山田太郎', description: 'お名前' }),
  email: Email({ example: 'taro@example.com', description: 'メールアドレス' }),
  phone: Str({
    required: false,
    example: '03-1234-5678',
    description: '電話番号',
  }),
  company: Str({
    required: false,
    example: '株式会社Example',
    description: '会社名',
  }),
  subject: Str({
    example: 'サービスについてのお問い合わせ',
    description: '件名',
  }),
  message: Str({
    example: 'サービスの詳細について教えてください。',
    description: 'お問い合わせ内容',
  }),
})
