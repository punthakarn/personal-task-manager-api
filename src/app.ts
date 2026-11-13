import express from 'express'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'
import authRoutes from './routes/auth.routes'
import taskRoutes from './routes/task.routes'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())

  app.use('/auth', authRoutes)
  app.use('/tasks', taskRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()

export default app
