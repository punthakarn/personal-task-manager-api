import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import {
  parseTaskId,
  validateCreateTaskBody,
  validateUpdateTaskBody,
} from '../validation/validation'

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  userId: true,
  createdAt: true,
} as const

export async function createTask(req: Request, res: Response): Promise<void> {
  const result = validateCreateTaskBody(req.body)
  if (!result.ok) {
    res.status(400).json({ message: 'Validation failed', errors: result.errors })
    return
  }

  const { title, description, status } = result.data

  // Ownership always comes from the verified JWT, never from the request body.
  const task = await prisma.task.create({
    data: { title, description, status, userId: req.userId as number },
    select: taskSelect,
  })

  res.status(201).json(task)
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId as number },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: taskSelect,
  })

  res.status(200).json(tasks)
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const taskId = parseTaskId(req.params.id)
  if (taskId === null) {
    res.status(400).json({ message: 'Invalid task ID' })
    return
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: req.userId as number },
    select: taskSelect,
  })

  if (!task) {
    res.status(404).json({ message: 'Task not found' })
    return
  }

  res.status(200).json(task)
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const taskId = parseTaskId(req.params.id)
  if (taskId === null) {
    res.status(400).json({ message: 'Invalid task ID' })
    return
  }

  const result = validateUpdateTaskBody(req.body)
  if (!result.ok) {
    res.status(400).json({ message: 'Validation failed', errors: result.errors })
    return
  }

  const userId = req.userId as number

  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  })

  if (!existingTask) {
    res.status(404).json({ message: 'Task not found' })
    return
  }

  const task = await prisma.task.update({
    where: { id: existingTask.id },
    data: result.data,
    select: taskSelect,
  })

  res.status(200).json(task)
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const taskId = parseTaskId(req.params.id)
  if (taskId === null) {
    res.status(400).json({ message: 'Invalid task ID' })
    return
  }

  const { count } = await prisma.task.deleteMany({
    where: { id: taskId, userId: req.userId as number },
  })

  if (count === 0) {
    res.status(404).json({ message: 'Task not found' })
    return
  }

  res.status(204).end()
}
