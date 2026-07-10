import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { AdminLeadFetchAPI } from './endpoints/adminLeadFetch'
import { AdminLeadListAPI } from './endpoints/adminLeadList'
import { AdminLeadStatusUpdateAPI } from './endpoints/adminLeadStatusUpdate'
import { ContactCreateAPI } from './endpoints/contactCreate'
import { ContactFetchAPI } from './endpoints/contactFetch'
import { ContactListAPI } from './endpoints/contactList'
import { cloudflareAccessAuth } from './middleware/access'
import { apiKeyAuth } from './middleware/auth'
import { corsMiddleware } from './middleware/cors'

const app = new Hono<{ Bindings: Env }>()

// CORSミドルウェアを適用
app.use('*', corsMiddleware)

// Cloudflare Accessで保護された管理系API
app.use('/admin/*', cloudflareAccessAuth)

// API保護（開発環境では無効化可能）
app.use('/contacts/*', async (c, next) => {
  // Skip auth for POST /contacts
  if (c.req.method === 'POST' && c.req.path === '/contacts') {
    await next()
    return
  }

  if (c.env.ENVIRONMENT !== 'development') {
    return apiKeyAuth(c, next)
  }
  await next()
})

const openapi = fromHono(app, {
  docs_url: '/',
})

// Admin lead endpoints
openapi.get('/admin/leads', AdminLeadListAPI)
openapi.get('/admin/leads/:leadId', AdminLeadFetchAPI)
openapi.patch('/admin/leads/:leadId/status', AdminLeadStatusUpdateAPI)

// Contacts endpoints
openapi.get('/contacts', ContactListAPI)
openapi.post('/contacts', ContactCreateAPI)
openapi.get('/contacts/:contactId', ContactFetchAPI)

export default app
