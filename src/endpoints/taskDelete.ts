import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { z } from 'zod'
import { type AppContext, Task } from '../types'

export class TaskDelete extends OpenAPIRoute {
  schema = {
    tags: ['Tasks'],
    summary: 'Delete a Task',
    request: {
      params: z.object({
        taskSlug: Str({ description: 'Task slug' }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns if the task was deleted successfully',
        content: {
          'application/json': {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  task: Task,
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

    // Retrieve the validated slug
    const { taskSlug } = data.params

    // First, fetch the task to return it after deletion
    const task = await c.env.DB.prepare(
      'SELECT slug, name, description, completed, due_date FROM tasks WHERE slug = ?',
    )
      .bind(taskSlug)
      .first()

    if (!task) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404,
      )
    }

    // Delete the task
    const result = await c.env.DB.prepare('DELETE FROM tasks WHERE slug = ?')
      .bind(taskSlug)
      .run()

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: 'Failed to delete task',
        },
        500,
      )
    }

    // Return the deleted task for confirmation
    return {
      result: {
        task: {
          slug: task.slug as string,
          name: task.name as string,
          description: task.description as string | null,
          completed: Boolean(task.completed),
          due_date: task.due_date as string,
        },
      },
      success: true,
    }
  }
}
