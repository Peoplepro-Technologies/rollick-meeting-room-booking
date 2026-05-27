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

  // Create some sample rooms
  const rooms = await Promise.all([
    db.room.create({
      data: {
        name: 'Conference Room A',
        capacity: 10,
        location: '1st Floor',
        description: 'Large conference room with projector',
      },
    }),
    db.room.create({
      data: {
        name: 'Meeting Room B',
        capacity: 6,
        location: '2nd Floor',
        description: 'Small meeting room for team discussions',
      },
    }),
    db.room.create({
      data: {
        name: 'Board Room',
        capacity: 12,
        location: '3rd Floor',
        description: 'Executive meeting room',
      },
    }),
  ])

  // Create sample booking
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const endTime = new Date(tomorrow)
  endTime.setHours(10, 0, 0, 0)

  await db.booking.create({
    data: {
      title: 'Team Meeting',
      startTime: tomorrow,
      endTime: endTime,
      userId: adminUser.id,
      roomId: rooms[0].id,
      status: 'confirmed',
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