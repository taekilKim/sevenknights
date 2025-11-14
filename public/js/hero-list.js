// Hero List Management
let allHeroes = [];

// Show/Hide Loading
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = show ? 'flex' : 'none';
  }
}

// Fetch Heroes from API
async function fetchHeroes() {
  showLoading(true);
  try {
    const response = await fetch('/api/heroes');
    const data = await response.json();

    // Handle both {records: [...]} and direct array response
    const heroData = data.records || data;

    if (!Array.isArray(heroData)) {
      console.error('Invalid server response:', data);
      const grid = document.getElementById('hero-grid');
      if (grid) {
        grid.innerHTML = '<div class="error-message">잘못된 서버 응답입니다.</div>';
      }
      return;
    }

    allHeroes = heroData;
    initializeFilters();
    renderHeroes(applyFiltersAndSort(allHeroes));
  } catch (error) {
    console.error('Failed to fetch heroes:', error);
    const grid = document.getElementById('hero-grid');
    if (grid) {
      grid.innerHTML = '<div class="error-message">데이터를 불러오는데 실패했습니다.</div>';
    }
  } finally {
    showLoading(false);
  }
}

// Initialize Dynamic Filters
function initializeFilters() {
  // No dynamic filters to initialize
}

// Apply Filters and Sort
function applyFiltersAndSort(heroes) {
  const selectedRarity = getCheckedValues('#filter-rarity input:checked');
  const selectedType = getCheckedValues('#filter-type input:checked');
  const sortValue = document.querySelector('input[name="sort"]:checked')?.value || 'name';

  // Filter heroes
  let filtered = heroes.filter(hero => {
    const rarityMatch = selectedRarity.includes('전체') || selectedRarity.includes(hero.rarity);
    const typeMatch = selectedType.includes('전체') || selectedType.includes(hero.type);
    return rarityMatch && typeMatch;
  });

  // Sort heroes
  filtered.sort((a, b) => {
    switch (sortValue) {
      case 'attack':
        return (b['공격력'] || 0) - (a['공격력'] || 0);
      case 'hp':
        return (b['생명력'] || 0) - (a['생명력'] || 0);
      case 'rarity':
        const rarityOrder = ['(구)세븐나이츠', '전설+', '전설', '희귀'];
        const rarityA = rarityOrder.indexOf(a.group) >= 0 ? rarityOrder.indexOf(a.group) : rarityOrder.indexOf(a.rarity);
        const rarityB = rarityOrder.indexOf(b.group) >= 0 ? rarityOrder.indexOf(b.group) : rarityOrder.indexOf(b.rarity);
        if (rarityA === rarityB) return a.name.localeCompare(b.name, 'ko');
        return rarityA - rarityB;
      case 'name':
      default:
        return a.name.localeCompare(b.name, 'ko');
    }
  });

  return filtered;
}

// Get Checked Values Helper
function getCheckedValues(selector) {
  return [...document.querySelectorAll(selector)].map(el => el.value);
}

// Render Heroes Grid
function renderHeroes(heroes) {
  const grid = document.getElementById('hero-grid');
  if (!grid) return;

  grid.innerHTML = heroes.map(hero => createHeroCard(hero)).join('');
}

// Create Hero Card HTML
function createHeroCard(hero) {
  const rarityClass = {
    '전설+': 'legendary-plus',
    '전설': 'legendary',
    '희귀': 'rare',
    '고급': 'uncommon'
  }[hero.rarity] || 'normal';

  const hasEffect = hero.hasEffect === true || hero.hasEffect === 'true' || hero.hasEffect === 1;
  const isOldSevenKnights = hero.group && hero.group.includes('(구)세븐나이츠');

  const rarityBorder = hasEffect ? createRarityBorder(isOldSevenKnights) : '';
  const typeBadge = hero.typeImage ? `<img src="${hero.typeImage}" alt="${hero.type}" class="hero-type-badge">` : '';
  const nickname = hero.nickname ? `<div class="hero-nickname">${hero.nickname}</div>` : '';

  return `
    <div class="hero-card" data-name="${hero.name}" data-group="${hero.group || ''}" onclick="navigateToHero('${hero.name}')">
      <div class="hero-portrait-wrapper">
        <img src="${hero.portrait}" alt="${hero.name}" class="hero-portrait rarity-${rarityClass} ${hasEffect ? 'has-effect' : ''}">
        ${rarityBorder}
        ${typeBadge}
      </div>
      <div class="hero-name">${hero.name}</div>
      ${nickname}
    </div>
  `;
}

// Create Rarity Border PNG for Legendary+
function createRarityBorder(isOldSevenKnights) {
  const borderImage = isOldSevenKnights
    ? '/images/border-legendary-oldsena.png'
    : '/images/border-legendary.png';

  return `<img src="${borderImage}" alt="전설 테두리" class="rarity-border">`;
}

// Navigate to Hero Detail
function navigateToHero(heroName) {
  sessionStorage.setItem('scrollPosition', window.scrollY);
  window.location.href = `/hero.html?name=${encodeURIComponent(heroName)}`;
}

// Setup Filter Event Listeners
function setupFilterListeners() {
  // Desktop filter checkboxes
  const filterSelectors = '#filter-rarity input, #filter-type input, input[name="sort"]';
  document.querySelectorAll(filterSelectors).forEach(el => {
    el.addEventListener('change', () => {
      renderHeroes(applyFiltersAndSort(allHeroes));
    });
  });

  // "전체" checkbox logic for each filter group
  ['filter-rarity', 'filter-type'].forEach(groupId => {
    const container = document.getElementById(groupId);
    if (!container) return;

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        handleFilterGroupLogic(container, checkboxes, checkbox);
        renderHeroes(applyFiltersAndSort(allHeroes));
      });
    });
  });

  // Mobile filter selects
  setupMobileFilterSync();
}

// Handle Filter Group Logic (전체 selection)
function handleFilterGroupLogic(container, checkboxes, changedCheckbox) {
  const allOption = container.querySelector('input[value="전체"]');

  if (changedCheckbox.value === '전체' && changedCheckbox.checked) {
    // Uncheck all others when "전체" is selected
    checkboxes.forEach(cb => {
      if (cb !== allOption) cb.checked = false;
    });
  } else if (changedCheckbox.value !== '전체' && changedCheckbox.checked) {
    // Uncheck "전체" when any other is selected
    if (allOption) allOption.checked = false;
  } else {
    // If nothing checked, check "전체"
    const anyChecked = [...checkboxes].some(cb => cb.checked && cb.value !== '전체');
    if (!anyChecked && allOption) allOption.checked = true;
  }
}

// Setup Mobile Filter Synchronization
function setupMobileFilterSync() {
  const mobileRarity = document.getElementById('mobile-filter-rarity');
  const mobileType = document.getElementById('mobile-filter-type');
  const mobileSort = document.getElementById('mobile-sort');

  if (mobileRarity) {
    mobileRarity.addEventListener('change', (e) => {
      syncMobileToDesktop('#filter-rarity', e.target.value);
      renderHeroes(applyFiltersAndSort(allHeroes));
    });
  }

  if (mobileType) {
    mobileType.addEventListener('change', (e) => {
      syncMobileToDesktop('#filter-type', e.target.value);
      renderHeroes(applyFiltersAndSort(allHeroes));
    });
  }

  if (mobileSort) {
    mobileSort.addEventListener('change', (e) => {
      const target = document.querySelector(`input[name="sort"][value="${e.target.value}"]`);
      if (target) {
        target.checked = true;
        renderHeroes(applyFiltersAndSort(allHeroes));
      }
    });
  }
}

// Sync Mobile Select to Desktop Checkboxes
function syncMobileToDesktop(selector, value) {
  document.querySelectorAll(`${selector} input`).forEach(inp => inp.checked = false);
  const target = document.querySelector(`${selector} input[value="${value}"]`);
  if (target) target.checked = true;
}

// Restore Scroll Position
function restoreScrollPosition() {
  const savedScroll = sessionStorage.getItem('scrollPosition');
  if (savedScroll) {
    window.scrollTo(0, parseInt(savedScroll));
    sessionStorage.removeItem('scrollPosition');
  }
}

// View Toggle Functionality
function setupViewToggle() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const heroGrid = document.getElementById('hero-grid');

  if (!viewButtons.length || !heroGrid) return;

  // Restore saved view preference
  const savedView = localStorage.getItem('heroListView') || 'grid';
  if (savedView === 'list') {
    heroGrid.classList.add('list-view');
    viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === 'list');
    });
  }

  // Add click handlers
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      // Update active state
      viewButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update grid class
      if (view === 'list') {
        heroGrid.classList.add('list-view');
      } else {
        heroGrid.classList.remove('list-view');
      }

      // Save preference
      localStorage.setItem('heroListView', view);
    });
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  fetchHeroes();
  setupFilterListeners();
  setupViewToggle();
  restoreScrollPosition();
});
