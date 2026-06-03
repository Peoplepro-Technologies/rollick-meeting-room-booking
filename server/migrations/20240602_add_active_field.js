import db from '../src/lib/db.js';

async function addActiveField() {
  // Connect to database first
  await db.connect();

  try {
    console.log('Adding active field to users table...');

    // Check if the column already exists
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasActiveColumn = tableInfo.some(column => column.name === 'active');

    if (!hasActiveColumn) {
      // Add the active column with default value 1 (true)
      await db.run(`ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT 1`);
      console.log('Active field added successfully with default value 1');
    } else {
      console.log('Active field already exists');
    }

    // Verify the column was added
    const updatedTableInfo = await db.all("PRAGMA table_info(users)");
    const activeColumn = updatedTableInfo.find(column => column.name === 'active');
    console.log('Active column info:', activeColumn);

  } catch (error) {
    console.error('Error adding active field:', error);
    throw error;
  }
}

// Run the migration
addActiveField()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });