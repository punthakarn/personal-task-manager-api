import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export type AccessTokenPayload = {
  userId: number
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ userId } satisfies AccessTokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export type VerifyResult =
  | { ok: true; userId: number }
  | { ok: false; reason: 'expired' | 'invalid' }

export function verifyAccessToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)

    if (typeof decoded === 'string' || decoded === null) {
      return { ok: false, reason: 'invalid' }
    }

    const userId = (decoded as jwt.JwtPayload).userId
    if (typeof userId !== 'number' || !Number.isInteger(userId) || userId < 1) {
      return { ok: false, reason: 'invalid' }
    }

    return { ok: true, userId }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { ok: false, reason: 'expired' }
    }
    return { ok: false, reason: 'invalid' }
  }
}
