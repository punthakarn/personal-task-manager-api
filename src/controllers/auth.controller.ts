import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { signAccessToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'
import { validateLoginBody, validateRegisterBody } from '../validation/validation'

const SALT_ROUNDS = 10

const userSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} as const

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  )
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = validateRegisterBody(req.body)
  if (!result.ok) {
    res.status(400).json({ message: 'Validation failed', errors: result.errors })
    return
  }

  const { name, email, password } = result.data

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) {
    res.status(409).json({ message: 'Email already exists' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: userSelect,
    })

    res.status(201).json(user)
  } catch (error) {
    // Handles the race where another request created the same email first.
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ message: 'Email already exists' })
      return
    }
    throw error
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = validateLoginBody(req.body)
  if (!result.ok) {
    res.status(400).json({ message: 'Validation failed', errors: result.errors })
    return
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false

  if (!user || !passwordMatches) {
    res.status(401).json({ message: 'Invalid email or password' })
    return
  }

  const accessToken = signAccessToken(user.id)

  res.status(200).json({ accessToken, tokenType: 'Bearer' })
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.userId as number

  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.status(200).json(user)
}
