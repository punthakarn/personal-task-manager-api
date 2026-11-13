import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../lib/jwt'

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches `req.userId`.
 * Any failure responds 401 and never reaches the controller.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (typeof header !== 'string' || !header.trim()) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }

  const [scheme, ...rest] = header.trim().split(/\s+/)
  if (scheme.toLowerCase() !== 'bearer' || rest.length !== 1 || rest[0] === '') {
    res.status(401).json({ message: 'Authentication required' })
    return
  }

  const result = verifyAccessToken(rest[0])

  if (!result.ok) {
    res.status(401).json({
      message: result.reason === 'expired' ? 'Token expired' : 'Invalid token',
    })
    return
  }

  req.userId = result.userId
  next()
}
