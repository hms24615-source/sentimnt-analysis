/**
 * 단위 테스트: 입력값 검증 및 AI 응답 스키마 검증 (tests/validators.test.js)
 * 목적: 클라이언트 및 서버의 핵심 검증 로직이 요구사항(docs/06)에 맞게 동작하는지 테스트합니다.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateTextInput, MAX_TEXT_LENGTH } from '../js/validators.js';
import { validateAnalyzeRequest, validateAiResponse } from '../lib/schemas.js';

describe('1. 클라이언트 측 입력 유효성 검사 (js/validators.js)', () => {
  test('정상적인 텍스트 입력 시 isValid: true를 반환해야 한다', () => {
    const result = validateTextInput('오늘 프로젝트를 완수해서 기분이 참 좋습니다.');
    assert.equal(result.isValid, true);
    assert.equal(result.error, undefined);
  });

  test('공백만 입력된 경우 EMPTY_INPUT 오류를 반환해야 한다', () => {
    const result = validateTextInput('   \n\t   ');
    assert.equal(result.isValid, false);
    assert.equal(result.error?.code, 'EMPTY_INPUT');
  });

  test('정확히 2,000자 입력 시 허용되어야 한다', () => {
    const exactMaxText = '가'.repeat(2000);
    const result = validateTextInput(exactMaxText);
    assert.equal(result.isValid, true);
  });

  test('2,001자 입력 시 PAYLOAD_TOO_LARGE 오류를 반환해야 한다', () => {
    const overText = '가'.repeat(2001);
    const result = validateTextInput(overText);
    assert.equal(result.isValid, false);
    assert.equal(result.error?.code, 'PAYLOAD_TOO_LARGE');
  });

  test('문자열이 아닌 타입(null, undefined, number 등)이 전달된 경우 거부되어야 한다', () => {
    assert.equal(validateTextInput(null).isValid, false);
    assert.equal(validateTextInput(undefined).isValid, false);
    assert.equal(validateTextInput(12345).isValid, false);
  });
});

describe('2. 백엔드 요청 본문 검증 (lib/schemas.js: validateAnalyzeRequest)', () => {
  test('올바른 객체 및 텍스트인 경우 트리밍된 문자열을 반환해야 한다', () => {
    const validated = validateAnalyzeRequest({ text: '  정상적인 문장  ' });
    assert.equal(validated, '정상적인 문장');
  });

  test('body가 없거나 객체가 아니면 INVALID_INPUT 예외(400)가 발생해야 한다', () => {
    assert.throws(() => validateAnalyzeRequest(null), {
      name: 'AppError',
      code: 'INVALID_INPUT',
      statusCode: 400
    });
  });

  test('공백만 전달된 경우 INVALID_INPUT 예외(400)가 발생해야 한다', () => {
    assert.throws(() => validateAnalyzeRequest({ text: '    ' }), {
      name: 'AppError',
      code: 'INVALID_INPUT',
      statusCode: 400
    });
  });

  test('2,000자 초과 텍스트 전달 시 PAYLOAD_TOO_LARGE 예외(413)가 발생해야 한다', () => {
    assert.throws(() => validateAnalyzeRequest({ text: 'a'.repeat(2001) }), {
      name: 'AppError',
      code: 'PAYLOAD_TOO_LARGE',
      statusCode: 413
    });
  });
});

describe('3. AI 응답 스키마 검증 (lib/schemas.js: validateAiResponse)', () => {
  test('올바른 감성(positive), 신뢰도(85), 이유를 가진 응답을 통과시켜야 한다', () => {
    const parsed = {
      sentiment: 'positive',
      confidence: 85,
      reason: '긍정적인 어휘가 다수 포함되어 있습니다.'
    };
    const validated = validateAiResponse(parsed);
    assert.equal(validated.sentiment, 'positive');
    assert.equal(validated.confidence, 85);
    assert.equal(validated.reason, '긍정적인 어휘가 다수 포함되어 있습니다.');
  });

  test('허용되지 않은 감성 라벨이 포함된 경우 거부(502)해야 한다', () => {
    assert.throws(
      () => validateAiResponse({ sentiment: 'happy', confidence: 90, reason: '좋음' }),
      { name: 'AppError', code: 'AI_PROVIDER_ERROR', statusCode: 502 }
    );
  });

  test('confidence가 0 미만이거나 100 초과인 경우 거부(502)해야 한다', () => {
    assert.throws(
      () => validateAiResponse({ sentiment: 'neutral', confidence: 150, reason: '설명' }),
      { name: 'AppError', code: 'AI_PROVIDER_ERROR', statusCode: 502 }
    );
    assert.throws(
      () => validateAiResponse({ sentiment: 'negative', confidence: -10, reason: '설명' }),
      { name: 'AppError', code: 'AI_PROVIDER_ERROR', statusCode: 502 }
    );
  });

  test('reason이 누락되거나 빈 문자열인 경우 거부(502)해야 한다', () => {
    assert.throws(
      () => validateAiResponse({ sentiment: 'positive', confidence: 80, reason: '   ' }),
      { name: 'AppError', code: 'AI_PROVIDER_ERROR', statusCode: 502 }
    );
  });
});

