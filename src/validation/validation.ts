export type FieldError = {
  field: string
  message: string
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldError[] }

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const
export type TaskStatusValue = (typeof TASK_STATUSES)[number]

export type CreateTaskInput = {
  title: string
  description: string | null
  status: TaskStatusValue
}

export type UpdateTaskInput = {
  title?: string
  description?: string | null
  status?: TaskStatusValue
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EDITABLE_TASK_FIELDS = ['title', 'description', 'status'] as const

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateName(value: unknown, errors: FieldError[]): string | undefined {
  if (value === undefined || value === null) {
    errors.push({ field: 'name', message: 'name is required' })
    return undefined
  }
  if (typeof value !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' })
    return undefined
  }
  const name = value.trim()
  if (name === '') {
    errors.push({ field: 'name', message: 'name is required' })
    return undefined
  }
  return name
}

function validateEmailField(value: unknown, errors: FieldError[]): string | undefined {
  if (value === undefined || value === null) {
    errors.push({ field: 'email', message: 'email is required' })
    return undefined
  }
  if (typeof value !== 'string') {
    errors.push({ field: 'email', message: 'email must be a string' })
    return undefined
  }
  const email = value.trim()
  if (email === '') {
    errors.push({ field: 'email', message: 'email is required' })
    return undefined
  }
  if (!EMAIL_PATTERN.test(email)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' })
    return undefined
  }
  return email
}

function validatePasswordField(
  value: unknown,
  errors: FieldError[],
  { requireMinLength }: { requireMinLength: boolean },
): string | undefined {
  if (value === undefined || value === null) {
    errors.push({ field: 'password', message: 'password is required' })
    return undefined
  }
  if (typeof value !== 'string') {
    errors.push({ field: 'password', message: 'password must be a string' })
    return undefined
  }
  if (value === '') {
    errors.push({ field: 'password', message: 'password is required' })
    return undefined
  }
  if (requireMinLength && value.length < 8) {
    errors.push({ field: 'password', message: 'password must be at least 8 characters' })
    return undefined
  }
  return value
}

export function validateRegisterBody(body: unknown): ValidationResult<RegisterInput> {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      errors: [{ field: 'body', message: 'Request body must be a JSON object' }],
    }
  }

  const errors: FieldError[] = []
  const name = validateName(body.name, errors)
  const email = validateEmailField(body.email, errors)
  const password = validatePasswordField(body.password, errors, { requireMinLength: true })

  if (errors.length > 0 || name === undefined || email === undefined || password === undefined) {
    return { ok: false, errors }
  }

  return { ok: true, data: { name, email, password } }
}

export function validateLoginBody(body: unknown): ValidationResult<LoginInput> {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      errors: [{ field: 'body', message: 'Request body must be a JSON object' }],
    }
  }

  const errors: FieldError[] = []
  const email = validateEmailField(body.email, errors)
  const password = validatePasswordField(body.password, errors, { requireMinLength: false })

  if (errors.length > 0 || email === undefined || password === undefined) {
    return { ok: false, errors }
  }

  return { ok: true, data: { email, password } }
}

function validateTitle(value: unknown, errors: FieldError[]): string | undefined {
  if (value === undefined || value === null) {
    errors.push({ field: 'title', message: 'title is required' })
    return undefined
  }
  if (typeof value !== 'string') {
    errors.push({ field: 'title', message: 'title must be a string' })
    return undefined
  }
  const title = value.trim()
  if (title === '') {
    errors.push({ field: 'title', message: 'title is required' })
    return undefined
  }
  return title
}

function validateDescription(value: unknown, errors: FieldError[]): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') {
    errors.push({ field: 'description', message: 'description must be a string or null' })
    return undefined
  }
  return value
}

function validateStatus(value: unknown, errors: FieldError[]): TaskStatusValue | undefined {
  if (typeof value !== 'string' || !TASK_STATUSES.includes(value as TaskStatusValue)) {
    errors.push({
      field: 'status',
      message: `status must be one of ${TASK_STATUSES.join(', ')}`,
    })
    return undefined
  }
  return value as TaskStatusValue
}

export function validateCreateTaskBody(body: unknown): ValidationResult<CreateTaskInput> {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      errors: [{ field: 'body', message: 'Request body must be a JSON object' }],
    }
  }

  const errors: FieldError[] = []
  const title = validateTitle(body.title, errors)
  const description = validateDescription(body.description, errors)

  let status: TaskStatusValue = 'PENDING'
  if (body.status !== undefined) {
    const parsed = validateStatus(body.status, errors)
    if (parsed !== undefined) status = parsed
  }

  if (errors.length > 0 || title === undefined) {
    return { ok: false, errors }
  }

  return { ok: true, data: { title, description: description ?? null, status } }
}

export function validateUpdateTaskBody(body: unknown): ValidationResult<UpdateTaskInput> {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      errors: [{ field: 'body', message: 'Request body must be a JSON object' }],
    }
  }

  const hasEditableField = EDITABLE_TASK_FIELDS.some((field) => body[field] !== undefined)
  if (!hasEditableField) {
    return {
      ok: false,
      errors: [
        {
          field: 'body',
          message: 'At least one of title, description or status is required',
        },
      ],
    }
  }

  const errors: FieldError[] = []
  const data: UpdateTaskInput = {}

  if (body.title !== undefined) {
    const title = validateTitle(body.title, errors)
    if (title !== undefined) data.title = title
  }

  if (body.description !== undefined) {
    const description = validateDescription(body.description, errors)
    if (description !== undefined) data.description = description
  }

  if (body.status !== undefined) {
    const status = validateStatus(body.status, errors)
    if (status !== undefined) data.status = status
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data }
}

export function parseTaskId(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) return null
  return id
}
