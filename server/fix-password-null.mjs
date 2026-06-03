import db from './src/lib/db.js';

console.log('Updating database to allow null passwords...');

try {
  // First, let's see if the constraint exists
  const tables = await db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  console.log('Current users table schema:', tables[0].sql);

  // Add a default password for users that don't have one
  await db.run("UPDATE users SET password = 'no-password' WHERE password IS NULL");
  console.log('Updated existing users without passwords');

  // Change the column to allow NULL
  await db.run("ALTER TABLE users RENAME COLUMN password TO password_old");
  await db.run("ALTER TABLE users ADD COLUMN password TEXT");
  await db.run("UPDATE users SET password = password_old");
  await db.run("CREATE INDEX IF NOT EXISTS idx_users_password ON users(password)");
  await db.run("ALTER TABLE users DROP COLUMN password_old");

  console.log('Successfully updated schema to allow null passwords');

  // Verify the change
  const schema = await db.get("PRAGMA table_info(users)");
  console.log('Updated schema:');
  console.log(schema);

} catch (error) {
  console.error('Error:', error.message);
}

process.exit(0);