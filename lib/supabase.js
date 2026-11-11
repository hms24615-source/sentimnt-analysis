/**
 * Supabase 데이터베이스 연동 모듈 (lib/supabase.js)
 * 목적: 분석 이벤트의 최소 메타데이터(라벨, 신뢰도, 소요시간 등)를 안전하게 기록합니다.
 * 보안 주의: 원문 텍스트, 사용자 IP, 이메일 등 개인정보는 절대 DB에 저장하지 않습니다.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

let supabaseClient = null;

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Supabase 설정값이 유효하지 않거나 템플릿 그대로인 경우 null 반환
  if (!url || !serviceRoleKey || url.startsWith('your_') || serviceRoleKey.startsWith('your_')) {
    return null;
  }

  if (!supabaseClient) {
    // 서버 전용 service_role 키를 사용하여 RLS가 적용된 Supabase에 안전하게 접근
    supabaseClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabaseClient;
}

/**
 * 남용 탐지 및 요청 식별을 위한 단방향 해시 생성
 * 원문 텍스트를 복원할 수 없도록 솔트(Salt)와 SHA-256을 적용합니다.
 * @param {string} text - 원문 텍스트
 * @returns {string} - 해시값
 */
export function createRequestHash(text) {
  const salt = 'sentiment-privacy-salt-2026';
  return crypto.createHash('sha256').update(text + salt).digest('hex').substring(0, 32);
}

/**
 * 분석 메타데이터 저장 함수
 * @param {{ sentiment: string, confidence: number, processingMs: number, requestHash?: string }} eventData
 */
export async function recordAnalysisEvent(eventData) {
  const client = getSupabaseClient();
  if (!client) {
    // Supabase 설정이 미완료 상태여도 분석 기능 자체는 차단하지 않고 경고만 출력합니다.
    console.warn('[Supabase] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 이벤트 저장을 건너뜁니다.');
    return;
  }

  try {
    const { error } = await client.from('analysis_events').insert([
      {
        sentiment: eventData.sentiment,
        confidence: eventData.confidence,
        processing_ms: eventData.processingMs,
        request_hash: eventData.requestHash || null
      }
    ]);

    if (error) {
      console.error('[Supabase Insert Error]', error.message);
    }
  } catch (err) {
    // DB 저장 오류가 전체 사용자 경험을 중단시키지 않도록 예외 캡처
    console.error('[Supabase Unexpected Error]', err.message);
  }
}

