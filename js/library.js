/* ============================================
   ICONMIC - Library Page Logic
   ============================================ */

let currentGenre = 'all';
let currentBooks = [];

document.addEventListener('DOMContentLoaded', () => {
  const genreParam = getQueryParam('genre');
  if (genreParam) currentGenre = genreParam;

  renderGenreFilters();
  renderBooks();
  initSearch();
});

function renderGenreFilters() {
  const filter = document.getElementById('genreFilter');
  if (!filter) return;

  const allBtn = `<button class="filter-btn ${currentGenre === 'all' ? 'active' : ''}" data-genre="all" onclick="filterByGenre('all')">All</button>`;
  const genreBtns = DEFAULT_GENRES.map(g =>
    `<button class="filter-btn ${currentGenre === g.id ? 'active' : ''}" data-genre="${g.id}" onclick="filterByGenre('${g.id}')">${g.icon} ${g.name}</button>`
  ).join('');

  filter.innerHTML = allBtn + genreBtns;
}

function filterByGenre(genre) {
  currentGenre = genre;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.genre === genre);
  });

  renderBooks();

  const url = new URL(window.location);
  if (genre === 'all') {
    url.searchParams.delete('genre');
  } else {
    url.searchParams.set('genre', genre);
  }
  window.history.replaceState({}, '', url);
}

async function renderBooks() {
  const grid = document.getElementById('libraryGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;

  let books = getSampleBooks(currentGenre === 'all' ? null : currentGenre);
  currentBooks = books;

  if (books.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  grid.innerHTML = books.map(book => createBookCard(book)).join('');
}

function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      renderBooks();
      return;
    }

    const filtered = SAMPLE_BOOKS.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.genre.toLowerCase().includes(query) ||
      (b.description && b.description.toLowerCase().includes(query))
    );

    const grid = document.getElementById('libraryGrid');
    const empty = document.getElementById('emptyState');

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
    } else {
      if (empty) empty.style.display = 'none';
      grid.innerHTML = filtered.map(book => createBookCard(book)).join('');
    }
  }, 300));
}

function showBookDetail(bookId) {
  const book = SAMPLE_BOOKS.find(b => b.id === bookId);
  if (!book) return;

  const modal = document.getElementById('bookDetailModal');
  const content = document.getElementById('bookDetailContent');
  if (!modal || !content) return;

  const genreInfo = DEFAULT_GENRES.find(g => g.id === book.genre) || { icon: '\uD83D\uDCD6', color: '#6C5CE7', name: 'General' };
  const stars = '\u2605'.repeat(Math.floor(book.rating || 0)) + '\u2606'.repeat(5 - Math.floor(book.rating || 0));

  content.innerHTML = `
    <div class="book-detail-cover" style="background: linear-gradient(135deg, ${genreInfo.color}40, ${genreInfo.color}20);">
      <div class="book-cover-icon" style="font-size: 4rem;">${genreInfo.icon}</div>
    </div>
    <div class="book-detail-body">
      <span class="badge badge-primary">${genreInfo.name}</span>
      <h2 style="margin-top: 0.75rem;">${book.title}</h2>
      <p class="book-detail-author">by ${book.author}</p>
      <div class="book-detail-stats">
        <div class="book-detail-stat">
          <strong>${stars}</strong>
          <span>${book.rating}/5 Rating</span>
        </div>
        <div class="book-detail-stat">
          <strong>${book.pages}</strong>
          <span>Pages</span>
        </div>
        <div class="book-detail-stat">
          <strong>${book.year}</strong>
          <span>Published</span>
        </div>
      </div>
      <p class="book-detail-description">${book.description}</p>
      <div class="book-detail-actions">
        <a href="reader.html?id=${book.id}" class="btn btn-primary btn-lg">Read Now</a>
        <button class="btn btn-secondary btn-lg" onclick="closeBookDetail()">Close</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeBookDetail() {
  const modal = document.getElementById('bookDetailModal');
  if (modal) modal.classList.remove('active');
}

function openBook(bookId) {
  showBookDetail(bookId);
}

function loadMoreBooks() {
  showToast('Loading more books...', 'info');
}
