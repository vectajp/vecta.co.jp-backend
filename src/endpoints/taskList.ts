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
    // Get validated data
    const data = await this.getValidatedData<typeof this.schema>()

    // Retrieve the validated parameters
    const { page, isCompleted } = data.query

    let query = "SELECT * FROM tasks";
    const params = [];
    
    if (isCompleted !== undefined) {
      query += " WHERE completed = ?";
      params.push(isCompleted ? 1 : 0);
    }
    
    query += " ORDER BY due_date ASC LIMIT 20 OFFSET ?";
    params.push(page * 20);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const tasks = (result.results || []).map(task => ({
      ...task,
      completed: task.completed === 1
    }));

    return {
      success: true,
      tasks
    }
  }
}
