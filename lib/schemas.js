/**
 * 스키마 검증 유틸리티 (lib/schemas.js)
 * 목적: 클라이언트 요청 및 신뢰할 수 없는 외부 AI 응답의 구조를 철저히 검증합니다.
 */

import { AppError } from './errors.js';

export const MAX_ALLOWED_LENGTH = 2000;

/**
 * 백엔드 수신 텍스트 입력값 유효성 검사
 * @param {any} body - 파싱된 요청 본문
 * @returns {string} - 검증된 텍스트
 */
export function validateAnalyzeRequest(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('INVALID_INPUT', '올바른 JSON 요청 본문이 필요합니다.', 400);
  }

  const { text } = body;

  if (typeof text !== 'string') {
    throw new AppError('INVALID_INPUT', '문자열 형태의 text 필드를 입력해 주세요.', 400);
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new AppError('INVALID_INPUT', '분석할 문장을 입력해 주세요. 공백만으로는 분석할 수 없습니다.', 400);
  }

  if (text.length > MAX_ALLOWED_LENGTH) {
    throw new AppError(
      'PAYLOAD_TOO_LARGE',
      `최대 허용 글자 수(${MAX_ALLOWED_LENGTH.toLocaleString()}자)를 초과했습니다. 문장을 줄여서 다시 시도해 주세요.`,
      413
    );
  }

  return trimmed;
}

/**
 * OpenAI 응답 JSON 스키마 검증
 * @param {any} parsed - JSON 파싱된 AI 결과 객체
 * @returns {{ sentiment: 'positive'|'negative'|'neutral', confidence: number, reason: string }}
 */
export function validateAiResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new AppError('AI_PROVIDER_ERROR', 'AI가 올바른 형식의 응답을 반환하지 않았습니다.', 502);
  }

  const { sentiment, confidence, reason } = parsed;

  // 1. 감성 라벨 검증
  const allowedSentiments = ['positive', 'negative', 'neutral'];
  if (!allowedSentiments.includes(sentiment)) {
    throw new AppError('AI_PROVIDER_ERROR', '감성 라벨 형식이 올바르지 않습니다.', 502);
  }

  // 2. 신뢰도 숫자 검증
  const confNumber = Number(confidence);
  if (isNaN(confNumber) || confNumber < 0 || confNumber > 100) {
    throw new AppError('AI_PROVIDER_ERROR', '신뢰도 점수 형식이 올바르지 않습니다.', 502);
  }

  // 3. 분석 이유 문자열 검증
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new AppError('AI_PROVIDER_ERROR', '분석 이유 설명이 누락되었습니다.', 502);
  }

  return {
    sentiment,
    confidence: Math.round(confNumber),
    reason: reason.trim()
  };
}

