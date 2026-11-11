/**
 * 애플리케이션 진입점 (js/app.js)
 * 목적: UI 컨트롤러, 유효성 검증, API 모듈을 연결하고 사용자 인터랙션을 처리합니다.
 */

import { validateTextInput, MAX_TEXT_LENGTH } from './validators.js';
import { UIController } from './ui.js';
import { analyzeSentiment } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIController();
  const form = document.getElementById('sentiment-form');
  const textarea = document.getElementById('sentiment-input');
  const resetBtn = document.getElementById('reset-btn');

  // 1. 실시간 글자 수 카운팅 및 입력 시 이전 결과/에러 정리
  textarea.addEventListener('input', () => {
    const text = textarea.value;
    ui.updateCharCount(text.length, MAX_TEXT_LENGTH);
    
    // 입력 내용이 변경되면 사용자가 오해하지 않도록 에러창을 닫음
    ui.hideError();
  });

  // 2. 분석 폼 제출 이벤트 처리
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // 기본 폼 새로고침 동작 방지

    const text = textarea.value;

    // 클라이언트 측 유효성 검사 수행
    const validation = validateTextInput(text);
    if (!validation.isValid) {
      ui.showError(validation.error.message, '입력 확인');
      return;
    }

    // 로딩 시작
    ui.setLoading(true);

    try {
      // 백엔드 API 호출
      const result = await analyzeSentiment(text);
      // 결과 렌더링
      ui.showResult(result);
    } catch (error) {
      if (error.name !== 'AbortError') {
        ui.showError(error.message, '분석 실패');
      }
    } finally {
      ui.setLoading(false);
    }
  });

  // 3. 재분석 / 새 문장 입력 버튼 클릭 이벤트
  resetBtn.addEventListener('click', () => {
    ui.resetForm();
  });
});

