# Personal Task Manager API

RESTful Backend API สำหรับแอปจัดการงานส่วนตัว พัฒนาด้วย **Node.js + TypeScript + Express 5 + PostgreSQL + Prisma 7 + JWT**
ผู้ใช้สมัครสมาชิก เข้าสู่ระบบ และจัดการ Task ของตนเองได้ โดยแยกข้อมูลระหว่างผู้ใช้ (Cross-User Data Isolation) — ไม่มี Frontend

---

## เทคโนโลยีที่ใช้

| Technology | Version | Purpose |
| --- | --- | --- |
| Node.js | 20+ | JavaScript Runtime |
| TypeScript | 7.x | ภาษาในการพัฒนา (รันด้วย `tsx`) |
| Express | 5.x | HTTP Server / REST API |
| PostgreSQL | 18 | Relational Database |
| Prisma ORM | 7.10.1 | Database Access / Migration (`prisma-client` generator + `@prisma/adapter-pg`) |
| jsonwebtoken | 9.x | Access Token (JWT) |
| bcryptjs | 3.x | Password Hashing |
| dotenv | 18.x | Environment Variables |

---

## โครงสร้างโปรเจกต์

```
prisma/
  schema.prisma            # Model User, Task + Enum TaskStatus
  migrations/              # Prisma Migration Files
prisma.config.ts           # Prisma 7 config (schema / migrations / datasource url)
postman/
  Personal Task Manager API.postman_collection.json   # Import เข้า Postman ได้เลย
  Personal Task Manager API.postman_environment.json
scripts/
  smoke-test.mjs           # End-to-End API test (ตามลำดับการใช้งานในข้อสอบ)
src/
  seed.ts                  # ข้อมูลตัวอย่าง (Alice/Bob + tasks) สำหรับดูใน DBeaver
  app.ts                   # สร้าง Express App, Middleware, Routes
  server.ts                # อ่าน PORT (default 3000) และเริ่ม Server
  config/env.ts            # โหลด/ตรวจสอบ Environment Variables
  lib/prisma.ts            # Prisma Client instance เดียวของทั้งแอป
  lib/jwt.ts               # sign / verify Access Token
  middlewares/auth.middleware.ts
  middlewares/error.middleware.ts
  controllers/auth.controller.ts
  controllers/task.controller.ts
  validation/validation.ts # Validation ทุก Endpoint + parse task id
  routes/auth.routes.ts
  routes/task.routes.ts
  generated/prisma/        # Prisma Client (สร้างใหม่ด้วย `npm run db:generate`)
.env.example               # ตัวอย่าง Environment Variables (Placeholder เท่านั้น)
```

---

## Environment Variables

คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่าจริง

```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/task_manager?schema=public"
JWT_SECRET="<your-jwt-secret>"
PORT=3000
```

| Variable | Required | คำอธิบาย |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Secret ที่ใช้ sign/verify JWT |
| `PORT` | no | พอร์ตของ Server (default `3000`) |

> ไฟล์ `.env` (ค่าจริง) ถูกใส่ใน `.gitignore` แล้ว — ห้าม Commit secret ลง Git

---

## วิธีติดตั้งและรัน

```bash
# 1) ติดตั้ง dependencies (postinstall จะรัน prisma generate ให้)
npm install

# 2) สร้างฐานข้อมูล (ถ้ายังไม่มี)
#    psql -U postgres -c "CREATE DATABASE task_manager;"

# 3) สร้าง .env จาก .env.example แล้วใส่ค่าจริง

# 4) สร้างตาราง + ข้อมูลตัวอย่าง (คำสั่งเดียว)
npm run db:setup
#    = prisma migrate deploy + prisma generate + seed (Alice/Bob + 4 tasks)

# 5) รัน Server
npm run dev
#    http://localhost:3000

# โหมด production
npm run build
npm start
```

### คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | รัน server (auto-reload) |
| `npm run db:setup` | migrate + generate + seed ข้อมูลตัวอย่าง |
| `npm run db:seed` | ใส่ข้อมูลตัวอย่างซ้ำได้ (idempotent) |
| `npm run db:studio` | เปิด Prisma Studio (ดูข้อมูลผ่าน browser) |
| `npm run test:smoke` | ทดสอบ API ทั้งระบบ 52 checks |
| `npm run typecheck` | ตรวจ TypeScript |

---

## เปิดใช้งาน 3 ทาง (Browser / Postman / DBeaver)

### 1) Browser

เปิด `http://localhost:3000` → จะเห็นข้อมูล API และรายการ endpoint ทั้งหมด
ทดสอบเร็ว ๆ: `http://localhost:3000/health` → `{"status":"ok"}`

### 2) Postman

1. เปิด Postman → **Import** → ลากไฟล์ `postman/Personal Task Manager API.postman_collection.json`
2. (ไม่บังคับ) Import environment: `postman/Personal Task Manager API.postman_environment.json` แล้วเลือก environment "Personal Task Manager API - Local"
3. รัน **1. Auth → Login Alice (saves token)** ก่อน 1 ครั้ง — script จะเก็บ `accessToken` ลง collection variable ให้อัตโนมัติ
4. ยิง request อื่น ๆ ต่อได้เลย (Create Task, List Tasks, Update, Delete ...)
5. กด **Run collection** เพื่อรันทั้งหมดพร้อมกันได้ (มี test assert ทุก request)

บัญชีตัวอย่าง:

| Email | Password | หมายเหตุ |
| --- | --- | --- |
| `alice@example.com` | `alicepass123` | มี 3 tasks |
| `bob@example.com` | `alicepass123` | มี 1 task (แยกข้อมูลจาก Alice) |

### 3) DBeaver

1. New Connection → **PostgreSQL**
2. Host `localhost`, Port `5432`, Database `task_manager`, User `postgres`, Password `<รหัสของคุณ>`
3. เปิด `Databases → task_manager → Schemas → public → Tables`
4. ดับเบิลคลิก `User` หรือ `Task` → แท็บ **Data** (มีข้อมูลตัวอย่างอยู่แล้วจาก seed)

| Table | จำนวนแถวหลัง seed | หมายเหตุ |
| --- | --- | --- |
| `User` | 2 | Alice, Bob (password เป็น bcrypt hash) |
| `Task` | 4 | 3 ของ Alice, 1 ของ Bob |
| `_prisma_migrations` | 1 | ประวัติ migration ของ Prisma — ห้ามลบ |


---

## API Endpoints

Base URL: `http://localhost:3000` (ไม่มี Prefix เช่น `/api`)

| # | Method | Endpoint | Auth | Success |
| --- | --- | --- | --- | --- |
| 1 | POST | `/auth/register` | Public | 201 |
| 2 | POST | `/auth/login` | Public | 200 |
| 3 | GET | `/auth/me` | Bearer | 200 |
| 4 | POST | `/tasks` | Bearer | 201 |
| 5 | GET | `/tasks` | Bearer | 200 |
| 6 | GET | `/tasks/:id` | Bearer | 200 |
| 7 | PATCH | `/tasks/:id` | Bearer | 200 |
| 8 | DELETE | `/tasks/:id` | Bearer | 204 |

Protected Endpoint ทุกตัวต้องส่ง Header:

```
Authorization: Bearer <access_token>
```

### ตัวอย่างการใช้งาน

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"alicepass123"}'

# Login → { "accessToken": "...", "tokenType": "Bearer" }
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alicepass123"}'

# Current user
curl http://localhost:3000/auth/me -H "Authorization: Bearer $TOKEN"

# Create task (userId ถูกกำหนดจาก JWT เสมอ)
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Learn Express.js"}'

# List tasks (ใหม่ → เก่า)
curl http://localhost:3000/tasks -H "Authorization: Bearer $TOKEN"

# Get / Update / Delete
curl http://localhost:3000/tasks/1 -H "Authorization: Bearer $TOKEN"
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"IN_PROGRESS"}'
curl -X DELETE http://localhost:3000/tasks/1 -H "Authorization: Bearer $TOKEN"
```

### Response Objects

```json
// User Object (register, me) — ไม่มี password
{ "id": 1, "name": "Alice", "email": "alice@example.com", "createdAt": "2026-11-06T09:00:00.000Z" }

// Task Object
{
  "id": 1,
  "title": "Learn Express.js",
  "description": null,
  "status": "PENDING",
  "userId": 1,
  "createdAt": "2026-11-06T09:05:00.000Z"
}
```

---

## Validation & Error Handling

Error ทุกตัวเป็น JSON ที่มี `message` เสมอ

```json
{ "message": "Task not found" }
```

```json
{
  "message": "Validation failed",
  "errors": [{ "field": "password", "message": "password must be at least 8 characters" }]
}
```

ลำดับการตรวจสอบ: ① JWT (401) → ② Task ID (400) → ③ Request Body (400) → ④ ข้อมูลในระบบ (409 / 401 / 404) → ⑤ สำเร็จ

| Status | ใช้เมื่อ |
| --- | --- |
| 200 | สำเร็จและมีข้อมูลตอบกลับ |
| 201 | สร้างข้อมูลสำเร็จ (register, POST /tasks) |
| 204 | ลบสำเร็จ ไม่มี Body |
| 400 | ข้อมูลไม่ถูกต้อง / Task ID ไม่ถูกต้อง / JSON ผิดรูปแบบ |
| 401 | ไม่มี/ผิด/หมดอายุ Token หรือ Login ผิด |
| 404 | ไม่พบข้อมูล หรือข้อมูลไม่ใช่ของผู้ใช้ปัจจุบัน (ไม่ใช้ 403) |
| 409 | Email ซ้ำ |
| 500 | ข้อผิดพลาดไม่คาดคิด — `{"message":"Internal server error"}` ไม่มี Stack Trace |

### กฎสำคัญ

- `userId` ของ Task มาจาก JWT เท่านั้น — ค่า `userId` / `id` / `createdAt` ใน Body ถูกละเว้น
- `status` เป็น case-sensitive: `PENDING`, `IN_PROGRESS`, `DONE` (ตัวพิมพ์เล็ก → 400)
- Task ของผู้ใช้อื่น ตอบ `404 Task not found` เหมือน Task ที่ไม่มีอยู่จริง
- ไม่มี Pagination / Search / Filter / Refresh Token / Logout (ตามขอบเขตข้อสอบ)

---

## การทดสอบ

มี End-to-End smoke test ตามลำดับการใช้งานในข้อสอบ (Alice/Bob) ทั้งหมด 52 checks:

```bash
# terminal 1
npm run dev

# terminal 2
npm run test:smoke
```

ผลลัพธ์ล่าสุด: **52 passed, 0 failed** (Register, Login, JWT, CRUD, Ownership 404, Validation, Error format)
