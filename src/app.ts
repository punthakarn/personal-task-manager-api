import express from 'express'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'
import authRoutes from './routes/auth.routes'
import taskRoutes from './routes/task.routes'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())

  // Friendly landing page so the API is visible from a browser.
  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Personal Task Manager API',
      status: 'running',
      docs: {
        readme: 'README.md',
        postman: 'postman/Personal Task Manager API.postman_collection.json',
      },
      endpoints: [
        'POST   /auth/register',
        'POST   /auth/login',
        'GET    /auth/me',
        'POST   /tasks',
        'GET    /tasks',
        'GET    /tasks/:id',
        'PATCH  /tasks/:id',
        'DELETE /tasks/:id',
      ],
    })
  })

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  app.use('/auth', authRoutes)
  app.use('/tasks', taskRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()

export default app
