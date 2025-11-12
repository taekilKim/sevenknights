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

    if (!data.records || !Array.isArray(data.records)) {
      console.error('Invalid server response:', data);
      return;
    }

    allHeroes = data.records;
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
  // Generate group filter options
  const groupContainer = document.getElementById('filter-group');
  const uniqueGroups = [...new Set(allHeroes.map(h => h.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));

  groupContainer.innerHTML = `
    <label class="filter-chip">
      <input type="checkbox" value="전체" checked>
      <span>전체</span>
    </label>
    ${uniqueGroups.map(group => `
      <label class="filter-chip">
        <input type="checkbox" value="${group}">
        <span>${group}</span>
      </label>
    `).join('')}
  `;

  // Update mobile group filter
  const mobileGroupFilter = document.getElementById('mobile-filter-group');
  if (mobileGroupFilter) {
    mobileGroupFilter.innerHTML = `
      <option value="전체">소속: 전체</option>
      ${uniqueGroups.map(group => `<option value="${group}">${group}</option>`).join('')}
    `;
  }
}

// Apply Filters and Sort
function applyFiltersAndSort(heroes) {
  const selectedRarity = getCheckedValues('#filter-rarity input:checked');
  const selectedType = getCheckedValues('#filter-type input:checked');
  const selectedGroup = getCheckedValues('#filter-group input:checked');
  const sortValue = document.querySelector('input[name="sort"]:checked')?.value || 'name';

  // Filter heroes
  let filtered = heroes.filter(hero => {
    const rarityMatch = selectedRarity.includes('전체') || selectedRarity.includes(hero.rarity);
    const typeMatch = selectedType.includes('전체') || selectedType.includes(hero.type);
    const groupMatch = selectedGroup.includes('전체') || selectedGroup.includes(hero.group);
    return rarityMatch && typeMatch && groupMatch;
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

  const diamondSvg = hasEffect ? createDiamondSvg(hero, isOldSevenKnights) : '';
  const typeBadge = hero.typeImage ? `<img src="${hero.typeImage}" alt="${hero.type}" class="hero-type-badge">` : '';
  const nickname = hero.nickname ? `<div class="hero-nickname">${hero.nickname}</div>` : '';

  return `
    <div class="hero-card" data-name="${hero.name}" data-group="${hero.group || ''}" onclick="navigateToHero('${hero.name}')">
      <div class="hero-portrait-wrapper">
        <img src="${hero.portrait}" alt="${hero.name}" class="hero-portrait rarity-${rarityClass} ${hasEffect ? 'has-effect' : ''}">
        ${diamondSvg}
        ${typeBadge}
      </div>
      <div class="hero-name">${hero.name}</div>
      ${nickname}
    </div>
  `;
}

// Create Diamond SVG for Legendary+
function createDiamondSvg(hero, isOldSevenKnights) {
  const gradientId = `diamond_${hero.name.replace(/\s/g, '')}_${Date.now()}`;
  const colors = isOldSevenKnights
    ? { start: '#EEDBFF', mid: '#C49CFF', end: '#9C6BFF' }
    : { start: '#FFF8E1', mid: '#FFE082', end: '#FFB300' };

  return `
    <div class="rarity-diamond-effect">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="${gradientId}" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
            <stop stop-color="${colors.start}"/>
            <stop offset="0.533654" stop-color="${colors.mid}"/>
            <stop offset="1" stop-color="${colors.end}"/>
          </linearGradient>
        </defs>
        <path d="M99.0854 0.124826C99.6876 -0.259713 100.26 0.312411 99.8752 0.914611C74.5556 40.6083 73.1362 54.5342 90.8173 89.847C91.0858 90.3826 90.384 91.0844 89.8483 90.816L89.847 90.8174C54.5329 73.1375 40.6072 74.5546 0.914577 99.8752C0.312412 100.26 -0.259673 99.6876 0.124792 99.0854C25.4444 59.3918 26.8625 45.4671 9.18167 10.1521C8.9215 9.63314 9.57223 8.95807 10.1001 9.16059L10.1507 9.18308C45.4657 26.8639 59.3905 25.4457 99.0854 0.124826ZM65.703 34.2974C61.9959 35.3198 58.2999 36.037 54.5685 36.4171C48.0147 37.0846 41.7138 36.6839 35.4457 35.4467C36.6829 41.7148 37.0837 48.0156 36.4162 54.5693C36.0363 58.3003 35.3191 61.996 34.2969 65.7027C38.0036 64.6805 41.6993 63.9633 45.4303 63.5834C51.9843 62.9159 58.2853 63.3166 64.5537 64.5539C63.3165 58.2856 62.9157 51.9848 63.5833 45.4307C63.9634 41.6997 64.6808 38.0041 65.703 34.2974Z" fill="url(#${gradientId})"/>
      </svg>
    </div>
  `;
}

// Navigate to Hero Detail
function navigateToHero(heroName) {
  sessionStorage.setItem('scrollPosition', window.scrollY);
  window.location.href = `/hero.html?name=${encodeURIComponent(heroName)}`;
}

// Setup Filter Event Listeners
function setupFilterListeners() {
  // Desktop filter checkboxes
  const filterSelectors = '#filter-rarity input, #filter-type input, #filter-group input, input[name="sort"]';
  document.querySelectorAll(filterSelectors).forEach(el => {
    el.addEventListener('change', () => {
      renderHeroes(applyFiltersAndSort(allHeroes));
    });
  });

  // "전체" checkbox logic for each filter group
  ['filter-rarity', 'filter-type', 'filter-group'].forEach(groupId => {
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
  const mobileGroup = document.getElementById('mobile-filter-group');
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

  if (mobileGroup) {
    mobileGroup.addEventListener('change', (e) => {
      syncMobileToDesktop('#filter-group', e.target.value);
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

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  fetchHeroes();
  setupFilterListeners();
  restoreScrollPosition();
});
