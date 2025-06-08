import { DateTime, Email, Str } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'

export type AppContext = Context<{ Bindings: Env }>

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
  status: z.enum(['new', 'in_progress', 'completed']).default('new'),
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
