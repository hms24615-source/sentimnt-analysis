/**
 * 백엔드 공통 에러 클래스 (lib/errors.js)
 * 목적: HTTP 상태 코드와 클라이언트 응답용 에러 코드를 일관되게 관리합니다.
 */

export class AppError extends Error {
  /**
   * @param {string} code - 에러 식별 코드 (예: INVALID_INPUT, RATE_LIMITED)
   * @param {string} message - 사용자 친화적인 한국어 안내 메시지
   * @param {number} statusCode - HTTP 응답 상태 코드 (400, 413, 500 등)
   */
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

