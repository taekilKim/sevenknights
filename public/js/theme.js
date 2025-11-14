// Theme Toggle Management
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const desktopThemeToggle = document.getElementById('desktop-theme-toggle');
const desktopThemeIcon = document.getElementById('desktop-theme-icon');
const desktopThemeText = document.getElementById('desktop-theme-text');
const htmlElement = document.documentElement;

// Get Initial Theme
function getInitialTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

// Apply Theme
function applyTheme(theme) {
  if (theme === 'light') {
    htmlElement.setAttribute('data-theme', 'light');

    // Mobile theme toggle
    if (themeIcon) {
      themeIcon.className = 'ph-bold ph-moon';
      themeText.textContent = '다크 모드';
    }

    // Desktop theme toggle
    if (desktopThemeIcon) {
      desktopThemeIcon.className = 'ph-bold ph-moon';
      desktopThemeText.textContent = '다크 모드';
    }
  } else {
    htmlElement.removeAttribute('data-theme');

    // Mobile theme toggle
    if (themeIcon) {
      themeIcon.className = 'ph-bold ph-sun';
      themeText.textContent = '라이트 모드';
    }

    // Desktop theme toggle
    if (desktopThemeIcon) {
      desktopThemeIcon.className = 'ph-bold ph-sun';
      desktopThemeText.textContent = '라이트 모드';
    }
  }
  localStorage.setItem('theme', theme);
}

// Toggle Theme
function toggleTheme() {
  const currentTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

// Initialize
applyTheme(getInitialTheme());

// Event Listeners
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (desktopThemeToggle) {
  desktopThemeToggle.addEventListener('click', toggleTheme);
}

// Watch for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
