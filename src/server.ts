import { app } from './app'
import { env } from './config/env'
import { prisma } from './lib/prisma'

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`)
})

async function shutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}, shutting down...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
