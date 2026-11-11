/**
 * UI 상태 및 화면 렌더링 모듈 (js/ui.js)
 * 목적: 로딩, 결과, 에러 상태를 안전하게 DOM에 반영합니다.
 * 보안 주의: innerHTML을 사용하지 않고 textContent를 활용하여 XSS를 방지합니다.
 */

// 감성 라벨 한글 변환 매핑
const SENTIMENT_LABELS = {
  positive: { text: '긍정', className: 'badge-positive' },
  negative: { text: '부정', className: 'badge-negative' },
  neutral: { text: '중립', className: 'badge-neutral' }
};

export class UIController {
  constructor() {
    // 주요 DOM 엘리먼트 캐싱
    this.textarea = document.getElementById('sentiment-input');
    this.charCounter = document.getElementById('char-counter');
    this.submitBtn = document.getElementById('submit-btn');
    this.submitBtnText = document.getElementById('submit-btn-text');
    this.errorContainer = document.getElementById('error-container');
    this.errorTitle = document.getElementById('error-title');
    this.errorMessage = document.getElementById('error-message');
    this.resultContainer = document.getElementById('result-container');
    this.resultBadge = document.getElementById('result-badge');
    this.resultConfidence = document.getElementById('result-confidence');
    this.resultReason = document.getElementById('result-reason');
    this.resetBtn = document.getElementById('reset-btn');
  }

  /**
   * 글자 수 카운터 업데이트
   * @param {number} current - 현재 글자 수
   * @param {number} max - 최대 글자 수
   */
  updateCharCount(current, max) {
    this.charCounter.textContent = `${current.toLocaleString()} / ${max.toLocaleString()}`;
    if (current > max) {
      this.charCounter.style.color = 'var(--color-error)';
      this.charCounter.style.fontWeight = '700';
    } else {
      this.charCounter.style.color = 'var(--color-muted)';
      this.charCounter.style.fontWeight = '500';
    }
  }

  /**
   * 로딩 상태 설정
   * @param {boolean} isLoading - 로딩 여부
   */
  setLoading(isLoading) {
    if (isLoading) {
      this.submitBtn.disabled = true;
      // 스피너와 텍스트 구성
      this.submitBtnText.textContent = ' AI가 감성을 분석하는 중...';
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      spinner.setAttribute('aria-hidden', 'true');
      this.submitBtn.prepend(spinner);

      // 이전 오류 및 결과 숨김
      this.hideError();
      this.hideResult();
    } else {
      this.submitBtn.disabled = false;
      const spinner = this.submitBtn.querySelector('.spinner');
      if (spinner) spinner.remove();
      this.submitBtnText.textContent = '감성 분석하기';
    }
  }

  /**
   * 에러 메시지 표시
   * @param {string} message - 에러 설명 문구
   * @param {string} [title='오류 안내'] - 에러 제목
   */
  showError(message, title = '오류 안내') {
    this.errorTitle.textContent = title;
    this.errorMessage.textContent = message;
    this.errorContainer.style.display = 'flex';
    this.hideResult();

    // 사용자가 에러를 바로 인지할 수 있도록 스크롤
    this.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * 에러 메시지 숨김
   */
  hideError() {
    this.errorContainer.style.display = 'none';
  }

  /**
   * 분석 결과 표시
   * @param {{ sentiment: 'positive'|'negative'|'neutral', confidence: number, reason: string }} data
   */
  showResult(data) {
    this.hideError();

    // 1. 감성 라벨 설정
    const meta = SENTIMENT_LABELS[data.sentiment] || { text: '알 수 없음', className: 'badge-neutral' };
    this.resultBadge.textContent = meta.text;
    this.resultBadge.className = `sentiment-badge ${meta.className}`;

    // 2. 신뢰도 설정 (정수 %)
    const safeConfidence = Math.min(100, Math.max(0, Math.round(data.confidence)));
    this.resultConfidence.textContent = `${safeConfidence}%`;

    // 3. 분석 이유 설정 (안전하게 textContent 주입)
    this.resultReason.textContent = data.reason;

    // 결과 표시 및 스크롤
    this.resultContainer.style.display = 'flex';
    this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * 결과 화면 숨김
   */
  hideResult() {
    this.resultContainer.style.display = 'none';
  }

  /**
   * 전체 폼 초기화 (새로운 분석 시작 시)
   */
  resetForm() {
    this.textarea.value = '';
    this.updateCharCount(0, 2000);
    this.hideError();
    this.hideResult();
    this.textarea.focus();
  }
}

