import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma'

const DEMO_PASSWORD = 'alicepass123'

async function main(): Promise<void> {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10)

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: { name: 'Alice', password },
    create: { name: 'Alice', email: 'alice@example.com', password },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: { name: 'Bob', password },
    create: { name: 'Bob', email: 'bob@example.com', password },
  })

  // Keep the demo data idempotent.
  await prisma.task.deleteMany({ where: { userId: { in: [alice.id, bob.id] } } })

  await prisma.task.createMany({
    data: [
      {
        title: 'Learn Express.js',
        description: null,
        status: 'PENDING',
        userId: alice.id,
      },
      {
        title: 'Read Prisma docs',
        description: 'Chapter 1 - Schema and migrations',
        status: 'IN_PROGRESS',
        userId: alice.id,
      },
      {
        title: 'Finish the exam',
        description: 'Run the smoke test before submitting',
        status: 'DONE',
        userId: alice.id,
      },
      {
        title: "Bob's private task",
        description: 'Alice must not see this task',
        status: 'PENDING',
        userId: bob.id,
      },
    ],
  })

  const users = await prisma.user.count()
  const tasks = await prisma.task.count()

  console.log('Seed completed.')
  console.log(`  Alice: alice@example.com / ${DEMO_PASSWORD} (id ${alice.id})`)
  console.log(`  Bob:   bob@example.com   / ${DEMO_PASSWORD} (id ${bob.id})`)
  console.log(`  Total: ${users} users, ${tasks} tasks`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
