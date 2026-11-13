/**
 * End-to-end smoke test for the Personal Task Manager API.
 *
 * Usage:
 *   1) npm run dev            (in another terminal)
 *   2) npm run test:smoke
 *
 * Optional: BASE_URL=http://localhost:3000 npm run test:smoke
 */
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const BASE_URL = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`

let passed = 0
let failed = 0

function check(name, condition, details) {
  if (condition) {
    passed += 1
    console.log(`PASS  ${name}`)
  } else {
    failed += 1
    console.error(`FAIL  ${name}`)
    if (details !== undefined) {
      console.error('      ', typeof details === 'string' ? details : JSON.stringify(details))
    }
  }
}

async function request(method, path, { token, body, headers = {} } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })

  const text = await response.text()
  let json
  try {
    json = text === '' ? undefined : JSON.parse(text)
  } catch {
    json = undefined
  }

  return { status: response.status, body: json, text }
}

const stamp = Date.now()
const alice = {
  name: 'Alice',
  email: `alice.${stamp}@example.com`,
  password: 'alicepass123',
}
const bob = {
  name: 'Bob',
  email: `bob.${stamp}@example.com`,
  password: 'bobpass123',
}

console.log(`\nRunning smoke test against ${BASE_URL}\n`)

// ---------- Register ----------
const aliceRegister = await request('POST', '/auth/register', { body: alice })
check('POST /auth/register returns 201', aliceRegister.status === 201, aliceRegister)
check('register response has no password', aliceRegister.body && !('password' in aliceRegister.body), aliceRegister.body)
check('register response has no accessToken', aliceRegister.body && !('accessToken' in aliceRegister.body), aliceRegister.body)
check('register returns user fields', Boolean(aliceRegister.body?.id && aliceRegister.body?.email && aliceRegister.body?.createdAt), aliceRegister.body)

const bobRegister = await request('POST', '/auth/register', { body: bob })
check('second register returns 201', bobRegister.status === 201, bobRegister)

const duplicateRegister = await request('POST', '/auth/register', { body: alice })
check('duplicate email returns 409', duplicateRegister.status === 409, duplicateRegister)
check('duplicate email message', duplicateRegister.body?.message === 'Email already exists', duplicateRegister.body)

const invalidRegister = await request('POST', '/auth/register', {
  body: { name: '  ', email: 'alice-at-example', password: '1234' },
})
check('invalid register returns 400', invalidRegister.status === 400, invalidRegister)
check('validation response has errors array', Array.isArray(invalidRegister.body?.errors), invalidRegister.body)

// ---------- Login ----------
const aliceLogin = await request('POST', '/auth/login', {
  body: { email: alice.email, password: alice.password },
})
check('POST /auth/login returns 200', aliceLogin.status === 200, aliceLogin)
check('login returns accessToken', typeof aliceLogin.body?.accessToken === 'string', aliceLogin.body)
check('login returns tokenType Bearer', aliceLogin.body?.tokenType === 'Bearer', aliceLogin.body)

const aliceToken = aliceLogin.body?.accessToken

const wrongLogin = await request('POST', '/auth/login', {
  body: { email: alice.email, password: 'wrong-password' },
})
check('wrong password returns 401', wrongLogin.status === 401, wrongLogin)
check('wrong login message is generic', wrongLogin.body?.message === 'Invalid email or password', wrongLogin.body)

const emptyLogin = await request('POST', '/auth/login', { body: { email: '', password: '' } })
check('empty login body returns 400', emptyLogin.status === 400, emptyLogin)

// ---------- Auth middleware ----------
const me = await request('GET', '/auth/me', { token: aliceToken })
check('GET /auth/me returns 200', me.status === 200, me)
check('GET /auth/me has no password', me.body && !('password' in me.body), me.body)

const meNoToken = await request('GET', '/auth/me')
check('GET /auth/me without token returns 401', meNoToken.status === 401, meNoToken)
check('missing token message', meNoToken.body?.message === 'Authentication required', meNoToken.body)

const meBadToken = await request('GET', '/auth/me', { token: 'not-a-real-token' })
check('GET /auth/me with invalid token returns 401', meBadToken.status === 401, meBadToken)
check('invalid token message', meBadToken.body?.message === 'Invalid token', meBadToken.body)

const expiredToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET ?? '', { expiresIn: -10 })
const meExpired = await request('GET', '/auth/me', { token: expiredToken })
check('expired token returns 401', meExpired.status === 401, meExpired)
check('expired token message', meExpired.body?.message === 'Token expired', meExpired.body)

// ---------- Create task ----------
const created = await request('POST', '/tasks', {
  token: aliceToken,
  // userId is not part of the contract and must be ignored
  body: { title: 'Learn Express.js', userId: 2 },
})
check('POST /tasks returns 201', created.status === 201, created)
check('created task has PENDING status', created.body?.status === 'PENDING', created.body)
check('created task description defaults to null', created.body?.description === null, created.body)
check('created task is owned by the token user', created.body?.userId === aliceRegister.body?.id, created.body)

const secondTask = await request('POST', '/tasks', {
  token: aliceToken,
  body: { title: 'Read Prisma docs', description: 'Chapter 1', status: 'IN_PROGRESS' },
})
check('second task created with given status', secondTask.status === 201 && secondTask.body?.status === 'IN_PROGRESS', secondTask)

const invalidTask = await request('POST', '/tasks', { token: aliceToken, body: { status: 'CANCELLED' } })
check('task without title returns 400', invalidTask.status === 400, invalidTask)

const invalidStatus = await request('POST', '/tasks', { token: aliceToken, body: { title: 'X', status: 'done' } })
check('lowercase status returns 400', invalidStatus.status === 400, invalidStatus)

// ---------- List / get ----------
const list = await request('GET', '/tasks', { token: aliceToken })
check('GET /tasks returns an array', Array.isArray(list.body), list.body)
check('GET /tasks returns only own tasks', list.status === 200 && list.body.length === 2, list.body)
check('GET /tasks is newest first', list.body?.[0]?.id === secondTask.body?.id, list.body)

const bobLogin = await request('POST', '/auth/login', {
  body: { email: bob.email, password: bob.password },
})
const bobToken = bobLogin.body?.accessToken
check('bob can log in', bobLogin.status === 200 && typeof bobToken === 'string', bobLogin)

const bobList = await request('GET', '/tasks', { token: bobToken })
check('bob sees an empty array', bobList.status === 200 && Array.isArray(bobList.body) && bobList.body.length === 0, bobList)

const getTask = await request('GET', `/tasks/${created.body?.id}`, { token: aliceToken })
check('GET /tasks/:id returns the task', getTask.status === 200 && getTask.body?.id === created.body?.id, getTask)

const getForeignTask = await request('GET', `/tasks/${created.body?.id}`, { token: bobToken })
check("bob reading alice's task returns 404", getForeignTask.status === 404, getForeignTask)
check('foreign task message matches task not found', getForeignTask.body?.message === 'Task not found', getForeignTask.body)

const invalidId = await request('GET', '/tasks/abc', { token: aliceToken })
check('invalid task id returns 400', invalidId.status === 400, invalidId)
check('invalid task id message', invalidId.body?.message === 'Invalid task ID', invalidId.body)

// ---------- Update ----------
const updated = await request('PATCH', `/tasks/${created.body?.id}`, {
  token: aliceToken,
  body: { status: 'DONE' },
})
check('PATCH /tasks/:id returns 200', updated.status === 200, updated)
check('PATCH updates only the given field', updated.body?.status === 'DONE' && updated.body?.title === 'Learn Express.js', updated.body)

const emptyPatch = await request('PATCH', `/tasks/${created.body?.id}`, { token: aliceToken, body: {} })
check('empty PATCH returns 400', emptyPatch.status === 400, emptyPatch)

const protectedPatch = await request('PATCH', `/tasks/${created.body?.id}`, {
  token: aliceToken,
  body: { id: 999, userId: 2, createdAt: '2020-01-01T00:00:00.000Z' },
})
check('PATCH with only protected fields returns 400', protectedPatch.status === 400, protectedPatch)

const foreignPatch = await request('PATCH', `/tasks/${created.body?.id}`, {
  token: bobToken,
  body: { title: 'Hacked' },
})
check("bob patching alice's task returns 404", foreignPatch.status === 404, foreignPatch)

const afterForeignPatch = await request('GET', `/tasks/${created.body?.id}`, { token: aliceToken })
check("alice's task is unchanged", afterForeignPatch.body?.title === 'Learn Express.js', afterForeignPatch.body)

// ---------- Delete ----------
const deleted = await request('DELETE', `/tasks/${created.body?.id}`, { token: aliceToken })
check('DELETE /tasks/:id returns 204', deleted.status === 204, deleted)
check('DELETE response has no body', deleted.text === '', deleted.text)

const deletedAgain = await request('DELETE', `/tasks/${created.body?.id}`, { token: aliceToken })
check('deleting twice returns 404', deletedAgain.status === 404, deletedAgain)

const getDeleted = await request('GET', `/tasks/${created.body?.id}`, { token: aliceToken })
check('deleted task returns 404', getDeleted.status === 404, getDeleted)

// ---------- Error format ----------
const unknownRoute = await request('GET', '/does-not-exist')
check('unknown route returns JSON 404', unknownRoute.status === 404 && unknownRoute.body?.message === 'Not found', unknownRoute)

const badJson = await request('POST', '/auth/login', { body: '{"email": ' })
check('malformed JSON returns JSON 400', badJson.status === 400 && typeof badJson.body?.message === 'string', badJson)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
