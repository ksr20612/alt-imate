#!/usr/bin/env node

/**
 * 간단한 로컬 개발 서버
 * CORS 문제 없이 HTML 테스트 페이지를 실행할 수 있도록 함
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME 타입 매핑
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveFile(filePath, res) {
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - 파일을 찾을 수 없습니다</h1>');
      } else {
        res.writeHead(500);
        res.end(`서버 오류: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // 루트 경로면 test.html로 리다이렉트
  if (pathname === '/') {
    pathname = '/test.html';
  }

  // 파일 경로 생성
  const filePath = path.join(__dirname, pathname);

  // 보안을 위해 상위 디렉토리 접근 차단
  if (filePath.indexOf(__dirname) !== 0) {
    res.writeHead(403);
    res.end('접근 거부');
    return;
  }

  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`🚀 Alt-imate 테스트 서버가 실행중입니다!`);
  console.log(`📱 브라우저에서 다음 주소로 접속하세요:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n⚡ 자동으로 test.html이 로드됩니다.`);
  console.log(`🛑 서버를 종료하려면 Ctrl+C를 누르세요.`);
});

// 우아한 종료
process.on('SIGINT', () => {
  console.log('\n👋 서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});
