/**
 * 입력값 유효성 검증 모듈 (js/validators.js)
 * 목적: 클라이언트 측에서 텍스트 입력을 검증하여 불필요한 API 요청을 방지합니다.
 */

export const MAX_TEXT_LENGTH = 2000;

/**
 * 텍스트 입력의 유효성을 검사합니다.
 * @param {string} text - 사용자가 입력한 문자열
 * @returns {{ isValid: boolean, error?: { code: string, message: string } }}
 */
export function validateTextInput(text) {
  // 1. 입력값이 문자열 형태가 아니거나 누락된 경우
  if (typeof text !== 'string') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_INPUT',
        message: '분석할 문장을 올바른 형식으로 입력해 주세요.'
      }
    };
  }

  const trimmed = text.trim();

  // 2. 공백 문자만 입력된 경우
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: {
        code: 'EMPTY_INPUT',
        message: '문장을 입력해 주세요. 공백만으로는 감성을 분석할 수 없습니다.'
      }
    };
  }

  // 3. 허용된 최대 글자수(2,000자)를 초과한 경우
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: `입력 가능한 최대 글자 수(${MAX_TEXT_LENGTH.toLocaleString()}자)를 초과했습니다. 문장을 줄여서 다시 시도해 주세요.`
      }
    };
  }

  // 유효성 통과
  return { isValid: true };
}

