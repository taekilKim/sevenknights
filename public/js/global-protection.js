// 전역 보호 기능 - 오른쪽 클릭, 롱터치, 드래그 방지
(function() {
  'use strict';

  // 오른쪽 클릭 방지 (컨텍스트 메뉴)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // 드래그 방지 (이미지 드래그 다운로드 방지)
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  // 선택 방지 (텍스트 선택 방지)
  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });

  // 모바일 롱터치 방지
  let touchTimer;
  let touchStartX;
  let touchStartY;
  const LONG_TOUCH_DURATION = 500; // 500ms
  const MOVE_THRESHOLD = 10; // 10px

  document.addEventListener('touchstart', function(e) {
    // 터치 시작 위치 저장
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }

    // 롱터치 타이머 시작
    touchTimer = setTimeout(function() {
      // 롱터치로 인한 컨텍스트 메뉴 방지
      e.preventDefault();
    }, LONG_TOUCH_DURATION);
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    // 터치가 움직이면 롱터치 타이머 취소
    if (e.touches.length > 0) {
      const moveX = Math.abs(e.touches[0].clientX - touchStartX);
      const moveY = Math.abs(e.touches[0].clientY - touchStartY);

      // 일정 거리 이상 움직이면 타이머 취소
      if (moveX > MOVE_THRESHOLD || moveY > MOVE_THRESHOLD) {
        clearTimeout(touchTimer);
      }
    }
  });

  document.addEventListener('touchend', function() {
    // 터치가 끝나면 타이머 취소
    clearTimeout(touchTimer);
  });

  document.addEventListener('touchcancel', function() {
    // 터치가 취소되면 타이머 취소
    clearTimeout(touchTimer);
  });

  // CSS로도 선택 방지 추가
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }

    /* 입력 필드는 선택 가능하도록 */
    input, textarea {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;
  document.head.appendChild(style);

  // 개발자 도구 단축키 방지 (선택적)
  document.addEventListener('keydown', function(e) {
    // F12 방지
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U 방지
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
  });

  console.log('전역 보호 기능 활성화됨');
})();
