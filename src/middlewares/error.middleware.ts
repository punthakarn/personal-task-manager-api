import type { ErrorRequestHandler, RequestHandler } from 'express'

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Not found' })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ message: 'Invalid JSON body' })
    return
  }

  const type = (error as { type?: string } | null)?.type

  if (type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON body' })
    return
  }

  if (type === 'entity.too.large') {
    res.status(413).json({ message: 'Payload too large' })
    return
  }

  console.error('[unexpected error]', error)
  res.status(500).json({ message: 'Internal server error' })
}
