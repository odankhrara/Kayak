const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Remove query string and hash
  let filePath = req.url.split('?')[0].split('#')[0];
  
  // Default to index.html for root
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // For SPA routing, serve index.html for all routes that don't have file extensions
  const ext = path.extname(filePath);
  const isAsset = ext && ext !== '';
  
  // If it's not an asset file, serve index.html for SPA routing
  if (!isAsset) {
    filePath = '/index.html';
  }
  
  const fullPath = path.join(DIST_DIR, filePath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // If file not found, serve index.html (SPA fallback)
      if (err.code === 'ENOENT') {
        const indexPath = path.join(DIST_DIR, 'index.html');
        fs.readFile(indexPath, (err2, data2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data2);
        });
        return;
      }
      
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    
    // Determine content type
    let contentType;
    if (filePath === '/index.html' || ext === '.html') {
      contentType = 'text/html; charset=utf-8';
    } else {
      contentType = MIME_TYPES[ext] || 'application/octet-stream';
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Frontend server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${DIST_DIR}`);
});

