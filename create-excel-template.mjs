import { createServer } from 'http';
import { parse } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { createWriteStream } from 'fs';
import * as xlsx from 'xlsx';

const server = createServer(async (req, res) => {
  const { pathname } = parse(req.url);

  if (pathname === '/download-template' && req.method === 'GET') {
    try {
      // Create a new workbook
      const workbook = xlsx.utils.book_new();

      // Create header row
      const headers = [
        'username',
        'email',
        'password',
        'role',
        'active'
      ];

      // Create sample data rows
      const sampleData = [
        ['john.doe', 'john@example.com', 'password123', 'admin', true],
        ['jane.smith', 'jane.smith@example.com', '', 'user', true],
        ['mike.wilson', 'mike.wilson@example.com', '', 'user', false],
        ['sarah.jones', 'sarah.jones@example.com', 'admin123', 'admin', true],
        ['test.user', 'test.user@example.com', '', 'user', true]
      ];

      // Combine headers and sample data
      const templateData = [headers, ...sampleData];

      // Create worksheet
      const worksheet = xlsx.utils.aoa_to_sheet(templateData);

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // username
        { wch: 30 }, // email
        { wch: 20 }, // password
        { wch: 15 }, // role
        { wch: 10 }  // active
      ];

      // Generate Excel buffer
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="user-template.xlsx"');
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the file
      res.end(Buffer.from(excelBuffer));
    } catch (error) {
      console.error('Error creating template:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error creating template');
    }
  } else if (pathname === '/' || pathname === '/index.html') {
    try {
      const html = await readFile('./template-download.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('Template server running at http://localhost:3001/');
  console.log('Open http://localhost:3001/ in your browser to download the template');
});