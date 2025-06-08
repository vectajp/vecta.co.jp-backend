import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { TaskCreate } from './endpoints/taskCreate'
import { TaskDelete } from './endpoints/taskDelete'
import { TaskFetch } from './endpoints/taskFetch'
import { TaskList } from './endpoints/taskList'
import { apiKeyAuth } from './middleware/auth'
import { corsMiddleware } from './middleware/cors'

const app = new Hono<{ Bindings: Env }>()

// CORSミドルウェアを適用
app.use('*', corsMiddleware)

// API保護（開発環境では無効化可能）
app.use('/tasks/*', async (c, next) => {
  if (c.env.ENVIRONMENT !== 'development') {
    return apiKeyAuth(c, next)
  }
  await next()
})

const openapi = fromHono(app, {
  docs_url: '/',
})

openapi.get('/tasks', TaskList)
openapi.post('/tasks', TaskCreate)
openapi.get('/tasks/:taskSlug', TaskFetch)
openapi.delete('/tasks/:taskSlug', TaskDelete)

export default app
