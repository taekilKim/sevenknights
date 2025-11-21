/**
 * 공통 헤더 컴포넌트
 * 모든 페이지에서 동일한 헤더를 렌더링하고 현재 페이지에 따라 active 상태를 자동 설정
 */

// 현재 페이지 경로 확인
const getCurrentPage = () => {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') return 'home';
  if (path.includes('heroes.html')) return 'heroes';
  if (path.includes('hero.html') || path.includes('hero/')) return 'hero';
  if (path.includes('deck.html')) return 'deck';
  if (path.includes('tier-list.html')) return 'tier-list';
  if (path.includes('beginner-guide.html')) return 'beginner-guide';
  if (path.includes('faq.html')) return 'faq';
  return 'home';
};

// 페이지별 네비게이션 정보
const navItems = [
  { id: 'home', href: '/index.html', icon: 'ph-house', label: '홈' },
  { id: 'heroes', href: '/heroes.html', icon: 'ph-users-three', label: '영웅 도감' },
  { id: 'deck', href: '/deck.html', icon: 'ph-sword', label: '결투장 덱' },
  { id: 'tier-list', href: '/tier-list.html', icon: 'ph-ranking', label: '티어표' },
  { id: 'beginner-guide', href: '/beginner-guide.html', icon: 'ph-book-open', label: '초보자 가이드' },
  { id: 'faq', href: '/faq.html', icon: 'ph-question', label: 'FAQ' }
];

// 헤더 렌더링
const renderHeader = () => {
  const currentPage = getCurrentPage();
  const appContainer = document.querySelector('.app-container');

  if (!appContainer) {
    console.error('app-container not found');
    return;
  }

  // 헤더 HTML 생성
  const headerHTML = `
    <!-- Header -->
    <header class="app-header">
      <a href="/index.html" class="header-left">
        <img src="/favicon.ico" alt="세븐나이츠 리버스 로고" class="header-logo" />
        <div class="header-brand">세나DB</div>
      </a>

      <!-- Desktop Navigation -->
      <nav class="desktop-header-nav">
        ${navItems.map(item => `
          <a href="${item.href}" class="desktop-nav-link ${currentPage === item.id ? 'active' : ''}">
            <i class="ph-bold ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="header-right">
        <!-- Desktop Theme Toggle -->
        <button class="theme-toggle desktop-header-theme-toggle" id="desktop-theme-toggle" aria-label="테마 전환">
          <i class="ph-bold ph-sun" id="desktop-theme-icon"></i>
        </button>

        <!-- Mobile Hamburger Menu -->
        <button class="hamburger-menu" id="hamburger-menu" aria-label="메뉴">
          <i class="ph-bold ph-list"></i>
        </button>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div class="mobile-menu-overlay" id="mobile-menu-overlay">
      <div class="mobile-menu">
        <div class="mobile-menu-header">
          <img src="/favicon.ico" alt="세븐나이츠 리버스 로고" class="mobile-menu-logo" />
          <span>메뉴</span>
          <button class="mobile-menu-close" id="mobile-menu-close" aria-label="닫기">
            <i class="ph-bold ph-x"></i>
          </button>
        </div>
        <nav class="mobile-menu-nav">
          ${navItems.map(item => `
            <a href="${item.href}" class="mobile-nav-link ${currentPage === item.id ? 'active' : ''}">
              <i class="ph-bold ${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>
        <div class="mobile-menu-footer">
          <button class="theme-toggle" id="theme-toggle" aria-label="테마 전환">
            <i class="ph-bold ph-sun" id="theme-icon"></i>
            <span id="theme-text">라이트 모드</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // 기존 헤더 제거 (있다면)
  const existingHeader = appContainer.querySelector('.app-header');
  const existingMobileMenu = appContainer.querySelector('.mobile-menu-overlay');
  if (existingHeader) existingHeader.remove();
  if (existingMobileMenu) existingMobileMenu.remove();

  // 새 헤더 삽입 (app-container의 첫 번째 자식으로)
  appContainer.insertAdjacentHTML('afterbegin', headerHTML);

  // 헤더 렌더링 완료 이벤트 발생
  window.dispatchEvent(new CustomEvent('headerRendered'));
};

// 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderHeader);
} else {
  renderHeader();
}
