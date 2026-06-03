import { createServer } from 'http';
import { parse } from 'url';
import { readFile } from 'fs/promises';

const server = createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);

  if (pathname === '/test-upload' && req.method === 'POST') {
    let body = [];

    for await (const chunk of req) {
      body.push(chunk);
    }

    body = Buffer.concat(body).toString();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'File uploaded successfully',
      size: body.length,
      preview: body.substring(0, 200) + '...'
    }));
  } else {
    try {
      const html = await readFile('./test-upload.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }
});

server.listen(3000, () => {
  console.log('Test server running at http://localhost:3000/test-upload');
});