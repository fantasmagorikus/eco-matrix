import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SERVICE_NAME: z.string().min(1).default('unknown'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) =>
      s
        .split(/[,\s]+/)
        .map((x) => x.trim())
        .filter(Boolean)
    ),
})

export type AppEnv = z.infer<typeof envSchema> & { CORS_ORIGINS: string[] }

export function loadConfig(partial?: Record<string, string | undefined>): AppEnv {
  const input = { ...process.env, ...partial }
  const parsed = envSchema.safeParse(input)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid environment: ${issues}`)
  }
  return parsed.data as AppEnv
}

