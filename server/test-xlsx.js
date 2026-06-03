import xlsx from 'xlsx';

console.log('Testing xlsx module...');

try {
  // Test if readFile function exists
  if (xlsx.readFile) {
    console.log('✓ xlsx.readFile function exists');

    // Create a simple test workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([['Hello', 'World']]);
    xlsx.utils.book_append_sheet(wb, ws, 'Test');

    // Test writing to buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    console.log('✓ Successfully created and wrote Excel file');
    console.log('Buffer size:', buf.length, 'bytes');
  } else {
    console.log('✗ xlsx.readFile function NOT found');
    console.log('Available functions:', Object.keys(xlsx));
  }
} catch (error) {
  console.error('Error testing xlsx:', error.message);
  console.error('Stack:', error.stack);
}