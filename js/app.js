/* ============================================
   ICONMIC - Common App Logic
   ============================================ */

/* ---------- Navigation ---------- */

function initNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  highlightCurrentPage();
  updateAuthUI();
}

function highlightCurrentPage() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });
}

async function updateAuthUI() {
  const user = await getCurrentUser();
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  if (user) {
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    const initials = displayName.substring(0, 2).toUpperCase();
    navActions.innerHTML = `
      <div class="nav-user" onclick="toggleUserMenu()">
        <div class="nav-user-avatar">${initials}</div>
        <span class="nav-user-name">${displayName}</span>
      </div>
      <div class="user-dropdown" id="userDropdown">
        <a href="profile.html">My Profile</a>
        <a href="library.html">My Library</a>
        <hr style="border-color: var(--border); margin: 0.5rem 0;">
        <a href="#" onclick="signOut(); return false;">Sign Out</a>
      </div>
    `;
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm">Sign In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdown');
  const navUser = document.querySelector('.nav-user');
  if (dropdown && navUser && !navUser.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

/* ---------- Toast Notifications ---------- */

function showToast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '\u2713', error: '\u2717', info: '\u2139' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---------- Loading States ---------- */

function showLoading(message = 'Loading...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="spinner"></div><p>${message}</p>`;
    document.body.appendChild(overlay);
  }
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

/* ---------- Helpers ---------- */

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/* ---------- Genre Data (Fallback) ---------- */

const DEFAULT_GENRES = [
  { id: 'fiction', name: 'Fiction', icon: '\uD83D\uDCDA', color: '#6C5CE7', description: 'Novels, short stories & literary works' },
  { id: 'mystery', name: 'Mystery', icon: '\uD83D\uDD0D', color: '#E17055', description: 'Thrillers, detective & crime stories' },
  { id: 'romance', name: 'Romance', icon: '\u2764\uFE0F', color: '#FD79A8', description: 'Love stories & romantic tales' },
  { id: 'scifi', name: 'Sci-Fi', icon: '\uD83D\uDE80', color: '#00CEC9', description: 'Science fiction & futuristic worlds' },
  { id: 'fantasy', name: 'Fantasy', icon: '\uD83E\uDDD9', color: '#A29BFE', description: 'Magic, dragons & mythical realms' },
  { id: 'horror', name: 'Horror', icon: '\uD83D\uDC7B', color: '#2D3436', description: 'Scary stories & supernatural terror' },
  { id: 'nonfiction', name: 'Non-Fiction', icon: '\uD83C\uDF0D', color: '#00B894', description: 'Real-world knowledge & learning' },
  { id: 'biography', name: 'Biography', icon: '\uD83D\uDC64', color: '#FDCB6E', description: 'Life stories of remarkable people' },
  { id: 'selfhelp', name: 'Self-Help', icon: '\uD83D\uDCAA', color: '#74B9FF', description: 'Personal growth & motivation' },
  { id: 'comics', name: 'Comics', icon: '\uD83D\uDCAC', color: '#FF7675', description: 'Manga, graphic novels & comics' },
  { id: 'children', name: 'Children', icon: '\uD83C\uDF1F', color: '#55EFC4', description: 'Stories for young readers' },
  { id: 'poetry', name: 'Poetry', icon: '\u270D\uFE0F', color: '#DFE6E9', description: 'Verses, poems & spoken word' }
];

/* ---------- Sample Books (Demo) ---------- */

const SAMPLE_BOOKS = [
  { id: 'book-1', title: 'The Last Algorithm', author: 'Sarah Chen', genre: 'scifi', cover: '', description: 'In a world where AI controls everything, one programmer discovers the code that could set humanity free.', rating: 4.5, pages: 342, year: 2024 },
  { id: 'book-2', title: 'Whispers in the Dark', author: 'James Morrison', genre: 'mystery', cover: '', description: 'Detective Lena Park uncovers a web of secrets in the quiet town of Millbrook after a series of disappearances.', rating: 4.2, pages: 289, year: 2024 },
  { id: 'book-3', title: 'Starbound Hearts', author: 'Maria Lopez', genre: 'romance', cover: '', description: 'When astronaut Kai meets botanist Luna at a space station, their worlds collide in the most unexpected ways.', rating: 4.7, pages: 256, year: 2023 },
  { id: 'book-4', title: 'The Dragon\'s Promise', author: 'Wei Zhang', genre: 'fantasy', cover: '', description: 'A young mage must fulfill an ancient pact with the last dragon to save her kingdom from eternal darkness.', rating: 4.8, pages: 412, year: 2024 },
  { id: 'book-5', title: 'Mind Over Matter', author: 'Dr. Alex Turner', genre: 'selfhelp', cover: '', description: 'Practical strategies for building mental resilience and achieving your goals in the modern world.', rating: 4.3, pages: 198, year: 2024 },
  { id: 'book-6', title: 'The Silent Witness', author: 'Rachel Green', genre: 'mystery', cover: '', description: 'A courtroom drama where a deaf witness holds the key to solving the biggest murder case of the decade.', rating: 4.4, pages: 310, year: 2023 },
  { id: 'book-7', title: 'Echoes of Tomorrow', author: 'David Kim', genre: 'scifi', cover: '', description: 'Time loops, parallel universes, and one scientist\'s desperate attempt to prevent the end of everything.', rating: 4.6, pages: 378, year: 2024 },
  { id: 'book-8', title: 'The Art of Being', author: 'Yuki Tanaka', genre: 'nonfiction', cover: '', description: 'A philosophical journey through Eastern and Western traditions of mindfulness and self-discovery.', rating: 4.1, pages: 224, year: 2023 },
  { id: 'book-9', title: 'Crimson Petals', author: 'Isabella Rose', genre: 'romance', cover: '', description: 'Two rival florists in Paris discover that love can bloom in the most competitive gardens.', rating: 4.5, pages: 278, year: 2024 },
  { id: 'book-10', title: 'Code Breakers', author: 'Tom Holland', genre: 'fiction', cover: '', description: 'During WWII, a group of unlikely heroes must crack an impossible cipher to turn the tide of war.', rating: 4.7, pages: 356, year: 2023 },
  { id: 'book-11', title: 'The Haunted Library', author: 'Edgar Blackwood', genre: 'horror', cover: '', description: 'A librarian discovers that the books in the basement have a life of their own—and they\'re hungry.', rating: 4.0, pages: 267, year: 2024 },
  { id: 'book-12', title: 'Little Star Adventures', author: 'Emily Waters', genre: 'children', cover: '', description: 'Join Stella the star as she travels across the galaxy making friends and learning about the universe.', rating: 4.9, pages: 48, year: 2024 }
];

function getSampleBooks(genre = null) {
  if (!genre || genre === 'all') return SAMPLE_BOOKS;
  return SAMPLE_BOOKS.filter(b => b.genre === genre);
}

/* ---------- Book Card Generator ---------- */

function createBookCard(book) {
  const genreInfo = DEFAULT_GENRES.find(g => g.id === book.genre) || { icon: '\uD83D\uDCD6', color: '#6C5CE7' };
  const stars = '\u2605'.repeat(Math.floor(book.rating || 0)) + '\u2606'.repeat(5 - Math.floor(book.rating || 0));

  return `
    <div class="book-card card" onclick="openBook('${book.id}')">
      <div class="book-cover" style="background: linear-gradient(135deg, ${genreInfo.color}40, ${genreInfo.color}20);">
        <div class="book-cover-icon">${genreInfo.icon}</div>
        <div class="book-cover-title">${book.title}</div>
      </div>
      <div class="book-info">
        <h4 class="book-title">${book.title}</h4>
        <p class="book-author">by ${book.author}</p>
        <div class="book-meta">
          <span class="book-rating" title="${book.rating}/5">${stars}</span>
          <span class="book-pages">${book.pages || '—'} pages</span>
        </div>
      </div>
    </div>
  `;
}

function openBook(bookId) {
  window.location.href = `reader.html?id=${bookId}`;
}

/* ---------- PWA Service Worker ---------- */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('ICONMIC SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  }
}

/* ---------- Install Prompt (PWA) ---------- */

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBanner = document.getElementById('installBanner');
  if (installBanner) installBanner.style.display = 'flex';
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      showToast('App installed!', 'success');
    }
    deferredPrompt = null;
    const banner = document.getElementById('installBanner');
    if (banner) banner.style.display = 'none';
  });
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  registerServiceWorker();
});
