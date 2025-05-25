import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { TaskCreate } from './endpoints/taskCreate'
import { TaskDelete } from './endpoints/taskDelete'
import { TaskFetch } from './endpoints/taskFetch'
import { TaskList } from './endpoints/taskList'

const app = new Hono()

const openapi = fromHono(app, {
  docs_url: '/',
})

openapi.get('/tasks', TaskList)
openapi.post('/tasks', TaskCreate)
openapi.get('/tasks/:taskSlug', TaskFetch)
openapi.delete('/tasks/:taskSlug', TaskDelete)

export default app
