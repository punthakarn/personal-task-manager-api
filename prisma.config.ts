import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Kept optional so `prisma generate` (postinstall) works before a .env exists.
    // Migration and runtime commands require the real value from .env.
    url: process.env.DATABASE_URL ?? '',
  },
})
