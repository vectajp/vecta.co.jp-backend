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

    const task = await c.env.DB.prepare(
      "SELECT * FROM tasks WHERE slug = ?"
    ).bind(taskSlug).first();

    if (!task) {
      return Response.json({ 
        success: false, 
        error: 'Task not found' 
      }, { 
        status: 404 
      });
    }

    await c.env.DB.prepare(
      "DELETE FROM tasks WHERE slug = ?"
    ).bind(taskSlug).run();

    const taskWithBooleanCompleted = {
      ...task,
      completed: task.completed === 1
    };

    return {
      result: { 
        task: taskWithBooleanCompleted
      },
      success: true,
    }
  }
}
