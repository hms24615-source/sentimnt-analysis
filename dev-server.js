/**
 * 로컬 통합 개발 서버 (dev-server.js)
 * 목적: 별도의 무거운 프레임워크나 외부 툴 없이, Node.js 기본 내장 기능으로
 *       정적 파일(HTML/CSS/JS)과 백엔드 API(/api/analyze)를 한 번에 로컬에서 서빙합니다.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. .env 파일 수동 로드 (dotenv 패키지 없이도 안정적으로 동작하며 최신 값 동기화)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        process.env[key] = value;
      }
    }
  }
}
loadEnv();

// 2. 파일 확장자별 MIME 타입 매핑
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const PORT = process.env.PORT || 3000;

// 3. HTTP 서버 생성
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // A. 백엔드 API 요청 처리 (/api/analyze)
  if (pathname === '/api/analyze') {
    loadEnv(); // 요청 시마다 .env 파일의 최신 설정을 실시간 동기화
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      // Vercel 환경과 호환되도록 req / res 객체 래핑
      req.body = body;
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        // body가 JSON이 아닌 경우 원문 유지
      }

      const resProxy = {
        statusCode: 200,
        headers: {},
        setHeader(key, value) {
          this.headers[key] = value;
          return this;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          res.writeHead(this.statusCode, {
            'Content-Type': 'application/json; charset=utf-8',
            ...this.headers
          });
          res.end(JSON.stringify(data));
        }
      };

      try {
        await handler(req, resProxy);
      } catch (err) {
        console.error('[Server Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다.' }
        }));
      }
    });
    return;
  }

  // B. 정적 파일 서빙 (HTML, CSS, JS, 에셋)
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // 보안: 디렉터리 탐색 공격(..) 방지
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// 서버 기동
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`[감성 분석 서비스] 로컬 개발 서버가 성공적으로 실행되었습니다!`);
  console.log(`- 브라우저 주소: http://localhost:${PORT}`);
  console.log(`- 정적 파일 경로: index.html 및 css/, js/`);
  console.log(`- 감성 분석 API: POST http://localhost:${PORT}/api/analyze`);
  console.log('====================================================');
});

