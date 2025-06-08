import { Bool, Num, OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { type AppContext, Task } from '../types'

export class TaskList extends OpenAPIRoute {
  schema = {
    tags: ['Tasks'],
    summary: 'List Tasks',
    request: {
      query: z.object({
        page: Num({
          description: 'Page number',
          default: 0,
          required: false,
        }),
        isCompleted: Bool({
          description: 'Filter by completed flag',
          required: false,
        }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns a list of tasks',
        content: {
          'application/json': {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  tasks: Task.array(),
                }),
              }),
            }),
          },
        },
      },
    },
  }

  async handle(c: AppContext) {
    try {
      // Get validated data
      const data = await this.getValidatedData<typeof this.schema>()

      // Retrieve the validated parameters
      const { page, isCompleted } = data.query

      // Build query
      let query = 'SELECT slug, name, description, completed, due_date FROM tasks'
      const params: (string | number)[] = []

      if (isCompleted !== undefined) {
        query += ' WHERE completed = ?'
        params.push(isCompleted ? 1 : 0)
      }

      query += ' ORDER BY due_date ASC, created_at DESC'

      // Add pagination
      const limit = 20
      const pageNum = page ?? 0
      const offset = pageNum * limit
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)

      // Execute query
      const result = await c.env.DB.prepare(query)
        .bind(...params)
        .all()

      // Transform results
      const tasks = result.results.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
        completed: Boolean(row.completed),
        due_date: row.due_date,
      }))

      return {
        success: true,
        tasks,
      }
    } catch (error) {
      console.error('Database error:', error)
      return c.json(
        {
          success: false,
          error: 'Database error occurred',
        },
        500
      )
    }
  }
}
