/* ============================================
   ICONMIC - Home Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderGenres();
  renderTrendingBooks();
});

function renderGenres() {
  const grid = document.getElementById('genresGrid');
  if (!grid) return;

  grid.innerHTML = DEFAULT_GENRES.map(genre => `
    <a href="library.html?genre=${genre.id}" class="genre-card">
      <div class="genre-icon" style="background: ${genre.color}20;">
        ${genre.icon}
      </div>
      <div class="genre-info">
        <h4>${genre.name}</h4>
        <p>${genre.description}</p>
      </div>
    </a>
  `).join('');
}

function renderTrendingBooks() {
  const grid = document.getElementById('trendingBooks');
  if (!grid) return;

  const trending = SAMPLE_BOOKS.slice(0, 8);
  grid.innerHTML = trending.map(book => createBookCard(book)).join('');
}
