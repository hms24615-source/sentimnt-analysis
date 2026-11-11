/**
 * 감성 분석 서버리스 API 핸들러 (api/analyze.js)
 * 목적: 클라이언트의 분석 요청을 수신하여 검증, OpenAI 분석, 메타데이터 기록을 총괄합니다.
 */

import { AppError } from '../lib/errors.js';
import { validateAnalyzeRequest } from '../lib/schemas.js';
import { requestSentimentAnalysis } from '../lib/openai.js';
import { recordAnalysisEvent, createRequestHash } from '../lib/supabase.js';

export default async function handler(req, res) {
  const startTime = Date.now();

  // 1. HTTP 메서드 검증 (POST만 허용)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'POST 요청만 지원합니다.'
      }
    });
  }

  try {
    // 2. 요청 본문 파싱 및 유효성 검증
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const validatedText = validateAnalyzeRequest(body);

    // 3. OpenAI 감성 분석 실행
    const analysisResult = await requestSentimentAnalysis(validatedText);

    // 4. 처리 소요 시간 계산
    const processingMs = Date.now() - startTime;

    // 5. Supabase에 최소 메타데이터 기록 (원문 저장 금지!)
    const requestHash = createRequestHash(validatedText);
    await recordAnalysisEvent({
      sentiment: analysisResult.sentiment,
      confidence: analysisResult.confidence,
      processingMs: processingMs,
      requestHash: requestHash
    });

    // 6. 성공 응답 반환
    return res.status(200).json({
      ok: true,
      data: {
        sentiment: analysisResult.sentiment,
        confidence: analysisResult.confidence,
        reason: analysisResult.reason
      }
    });
  } catch (error) {
    // 에러 변환 및 처리
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const errorCode = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
    const errorMessage = error instanceof AppError 
      ? error.message 
      : '서버 내부 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

    // 서버 내부 콘솔에만 에러 출력 (클라이언트에는 일반화된 메시지만 전달)
    console.error(`[API Error ${errorCode}]:`, error.message);

    return res.status(statusCode).json({
      ok: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
}

