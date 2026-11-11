/**
 * API 통신 모듈 (js/api.js)
 * 목적: 백엔드 서버리스 함수(/api/analyze)와 안전하게 통신하고 응답을 파싱합니다.
 */

let activeAbortController = null;

/**
 * 텍스트 감성 분석 API를 호출합니다.
 * @param {string} text - 분석할 문장
 * @returns {Promise<{ sentiment: string, confidence: number, reason: string }>}
 */
export async function analyzeSentiment(text) {
  // 이전 진행 중인 요청이 있다면 취소하여 응답 경합(Race condition) 방지
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text }),
      signal: activeAbortController.signal
    });

    let payload;
    try {
      payload = await response.json();
    } catch (parseErr) {
      throw new Error('서버로부터 올바르지 않은 응답이 수신되었습니다.');
    }

    // 서버가 에러를 반환한 경우 (ok: false)
    if (!response.ok || !payload.ok) {
      const errMsg = (payload && payload.error && payload.error.message) 
        ? payload.error.message 
        : '감성 분석 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      const err = new Error(errMsg);
      err.code = (payload && payload.error && payload.error.code) ? payload.error.code : 'API_ERROR';
      throw err;
    }

    // 응답 데이터 스키마 유효성 검증
    const data = payload.data;
    if (
      !data ||
      !['positive', 'negative', 'neutral'].includes(data.sentiment) ||
      typeof data.confidence !== 'number' ||
      typeof data.reason !== 'string'
    ) {
      throw new Error('분석 결과 데이터의 규격이 올바르지 않습니다.');
    }

    return data;
  } catch (error) {
    // 요청 취소된 경우는 무시
    if (error.name === 'AbortError') {
      throw error;
    }
    // 네트워크 실패 등 일반 오류
    if (!error.code) {
      error.message = '네트워크 연결 상태를 확인하고 다시 시도해 주세요.';
    }
    throw error;
  } finally {
    activeAbortController = null;
  }
}

