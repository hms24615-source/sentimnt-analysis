/**
 * API 계약 테스트 (tests/api-contract.test.js)
 * 목적: /api/analyze 엔드포인트의 HTTP 메서드, 상태 코드, 오류 계약을 검증합니다.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/analyze.js';

// 가상 response 객체 생성 헬퍼
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe('API 계약 테스트 (/api/analyze)', () => {
  test('GET 요청 시 405 Method Not Allowed를 반환해야 한다', async () => {
    const req = { method: 'GET' };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 405);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.code, 'METHOD_NOT_ALLOWED');
  });

  test('POST 요청 본문이 빈 객체이거나 누락된 경우 400 INVALID_INPUT을 반환해야 한다', async () => {
    const req = { method: 'POST', body: {} };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.code, 'INVALID_INPUT');
  });

  test('공백 문자열만 전달된 경우 400 INVALID_INPUT을 반환해야 한다', async () => {
    const req = { method: 'POST', body: { text: '   ' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.code, 'INVALID_INPUT');
  });

  test('2,000자 초과 입력 시 413 PAYLOAD_TOO_LARGE를 반환해야 한다', async () => {
    const req = { method: 'POST', body: { text: '가'.repeat(2001) } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 413);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.code, 'PAYLOAD_TOO_LARGE');
  });

  test('OPENAI_API_KEY가 미설정(플레이스홀더) 상태일 때 503 SERVICE_UNAVAILABLE을 반환해야 한다', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'your_openai_api_key_here'; // 플레이스홀더 설정

    const req = { method: 'POST', body: { text: '정상 텍스트' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');

    // 환경 변수 원복
    process.env.OPENAI_API_KEY = originalKey;
  });
});

