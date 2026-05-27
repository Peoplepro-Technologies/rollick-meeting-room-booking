import db from '../src/lib/db.js'
import bcrypt from 'bcryptjs'

const adminPassword = await bcrypt.hash('admin123', 10)

export async function seedDatabase() {
  // Create default admin user
  const adminUser = await db.user.upsert({
    where: { email: 'admin@meetingroom.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@meetingroom.com',
      passwordHash: adminPassword,
      role: 'admin',
    },
  })

  // Create single room
  const room = await db.room.create({
    data: {
      name: 'Meeting Room',
      capacity: 10,
      location: '1st Floor',
      description: 'General purpose meeting room',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Default admin user: admin@meetingroom.com / admin123')
}

seedDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })