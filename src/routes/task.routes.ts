import { Router } from 'express'
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../controllers/task.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

// Every /tasks endpoint requires a valid access token.
router.use(authenticate)

router.post('/', createTask)
router.get('/', listTasks)
router.get('/:id', getTask)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
