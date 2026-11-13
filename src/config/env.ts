import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    console.error(`[config] Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

const parsedPort = Number(process.env.PORT ?? 3000)

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  PORT: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000,
  JWT_EXPIRES_IN: '1h',
} as const
