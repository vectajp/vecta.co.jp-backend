import { z } from 'zod'

const registryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    domain: z.string().min(1),
    ignored: z.boolean(),
  }),
})

export async function checkIgnoredCompanyEmail(
  registry: Fetcher,
  email: string,
) {
  const response = await registry.fetch(
    'https://registry.internal/v1/domains/check',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    },
  )

  if (!response.ok) {
    throw new Error(`Registry returned ${response.status}`)
  }

  return registryResponseSchema.parse(await response.json()).data
}
