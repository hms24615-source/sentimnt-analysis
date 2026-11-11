-- ==============================================================================
-- 마이그레이션 파일: 001_create_analysis_events.sql
-- 목적: 감성 분석 웹 서비스의 분석 메타데이터 저장용 테이블 생성 및 보안 정책(RLS) 설정
-- ==============================================================================

-- 1. UUID 생성을 위한 pgcrypto 확장 모듈 활성화 (Supabase 기본 제공)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. analysis_events 테이블 생성
-- 주의: 개인정보 보호 및 보안 지침에 따라 사용자의 원문 텍스트, IP 주소, 개인 식별 정보는 저장하지 않습니다.
CREATE TABLE IF NOT EXISTS public.analysis_events (
    -- 고유 식별자 (서버 또는 DB에서 자동 생성되는 UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 분석 요청이 기록된 시각 (기본값: 현재 시각, 타임존 포함)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- 감성 분석 결과 라벨 ('positive', 'negative', 'neutral' 중 하나만 허용)
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),

    -- 모델 추정 신뢰도 점수 (0 ~ 100 사이의 정수 백분율)
    confidence SMALLINT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),

    -- 분석 및 API 처리 소요 시간 (밀리초 단위, 성능 모니터링용)
    processing_ms INTEGER NOT NULL CHECK (processing_ms >= 0),

    -- 남용 탐지 및 중복 요청 방지용 단방향 해시값 (선택 사항)
    -- 주의: 원문이나 IP가 아닌 솔트(Salt)가 적용된 단방향 SHA-256 해시값만 저장
    request_hash TEXT NULL
);

-- 3. 테이블 및 컬럼 설명(Comment) 추가 (관리 및 교육용)
COMMENT ON TABLE public.analysis_events IS '감성 분석 수행 메타데이터 로그 (원문 미포함)';
COMMENT ON COLUMN public.analysis_events.id IS '이벤트 고유 UUID';
COMMENT ON COLUMN public.analysis_events.created_at IS '분석 생성 일시 (UTC)';
COMMENT ON COLUMN public.analysis_events.sentiment IS '감성 결과 라벨 (positive, negative, neutral)';
COMMENT ON COLUMN public.analysis_events.confidence IS '모델 추정 신뢰도 (0-100)';
COMMENT ON COLUMN public.analysis_events.processing_ms IS '전체 처리 소요 시간 (ms)';
COMMENT ON COLUMN public.analysis_events.request_hash IS '남용 탐지용 단방향 해시';

-- 4. 성능 최적화를 위한 인덱스 생성
-- 생성 일시 기준 정렬 및 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_analysis_events_created_at 
ON public.analysis_events (created_at DESC);

-- 감성 라벨별 통계 및 집계 성능 향상
CREATE INDEX IF NOT EXISTS idx_analysis_events_sentiment 
ON public.analysis_events (sentiment);

-- 5. 강력한 보안 설정 (Row Level Security, RLS)
-- 테이블에 행 단위 보안(RLS)을 강제 활성화합니다.
ALTER TABLE public.analysis_events ENABLE ROW LEVEL SECURITY;

-- 기존 권한 회수: 브라우저(익명 anon 사용자 및 일반 로그인 사용자)의 직접 접근을 전면 차단
REVOKE ALL ON TABLE public.analysis_events FROM anon;
REVOKE ALL ON TABLE public.analysis_events FROM authenticated;

-- 서버 사이드 전용 정책 (service_role 키를 사용하는 백엔드 서버만 접근 허용)
-- Supabase에서 service_role은 기본적으로 RLS를 우회(Bypass)할 수 있으나,
-- 명시적인 보안 강화를 위해 service_role 전용 정책을 등록합니다.
DROP POLICY IF EXISTS "Allow service_role full access" ON public.analysis_events;
CREATE POLICY "Allow service_role full access" 
ON public.analysis_events
AS PERMISSIVE
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

