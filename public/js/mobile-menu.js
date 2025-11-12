// Mobile Menu Management
const hamburgerMenu = document.getElementById('hamburger-menu');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
const mobileMenuClose = document.getElementById('mobile-menu-close');

// Open mobile menu
function openMobileMenu() {
  if (mobileMenuOverlay) {
    mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Close mobile menu
function closeMobileMenu() {
  if (mobileMenuOverlay) {
    mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Event listeners
if (hamburgerMenu) {
  hamburgerMenu.addEventListener('click', openMobileMenu);
}

if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', closeMobileMenu);
}

// Close menu when clicking overlay background
if (mobileMenuOverlay) {
  mobileMenuOverlay.addEventListener('click', (e) => {
    if (e.target === mobileMenuOverlay) {
      closeMobileMenu();
    }
  });
}

// Close menu on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenuOverlay?.classList.contains('active')) {
    closeMobileMenu();
  }
});
