declare global {
  namespace Express {
    interface Request {
      /** Set by the authentication middleware from the JWT payload. */
      userId?: number
    }
  }
}

export {}
