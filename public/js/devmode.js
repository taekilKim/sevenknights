// Developer Mode URL 파라미터 처리
// 사용법: https://senadb.games/?devMode=true (활성화)
//        https://senadb.games/?devMode=false (비활성화)
(function() {
  'use strict';

  // URL 파라미터에서 devMode 값 확인
  const urlParams = new URLSearchParams(window.location.search);
  const devModeParam = urlParams.get('devMode');

  if (devModeParam !== null) {
    if (devModeParam === 'true') {
      localStorage.setItem('devMode', 'true');
      console.log('%c개발자 모드 활성화됨', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
      console.log('%c분석 추적이 비활성화되었습니다.', 'color: #4CAF50;');

      // URL에서 devMode 파라미터 제거 (깔끔한 URL 유지)
      urlParams.delete('devMode');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } else if (devModeParam === 'false') {
      localStorage.removeItem('devMode');
      console.log('%c개발자 모드 비활성화됨', 'color: #FF5722; font-weight: bold; font-size: 14px;');
      console.log('%c분석 추적이 활성화되었습니다.', 'color: #FF5722;');

      // URL에서 devMode 파라미터 제거
      urlParams.delete('devMode');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }

  // 현재 devMode 상태 표시 (콘솔에서 확인 가능)
  const isDevMode = localStorage.getItem('devMode') === 'true';
  if (isDevMode) {
    console.log('%c[DEV MODE] 개발자 모드 활성화 중', 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px;');
  }
})();
