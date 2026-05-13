/* ============================================
   ICONMIC - Profile Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initProfile();
});

async function initProfile() {
  const user = await getCurrentUser();
  const demoUser = JSON.parse(localStorage.getItem('iconmic_demo_user') || 'null');
  const activeUser = user || demoUser;

  if (!activeUser) {
    window.location.href = 'login.html';
    return;
  }

  renderProfile(activeUser);
  renderReadingHistory();
}

function renderProfile(user) {
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Reader';
  const email = user.email || 'demo@iconmic.com';
  const initials = displayName.substring(0, 2).toUpperCase();

  const avatar = document.getElementById('profileAvatar');
  const name = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  const settingName = document.getElementById('settingName');

  if (avatar) avatar.textContent = initials;
  if (name) name.textContent = displayName;
  if (emailEl) emailEl.textContent = email;
  if (settingName) settingName.textContent = displayName;
}

function renderReadingHistory() {
  const container = document.getElementById('readingHistory');
  if (!container) return;

  const recentBooks = SAMPLE_BOOKS.slice(0, 5);
  const dates = ['Today', 'Yesterday', '2 days ago', '3 days ago', 'Last week'];

  container.innerHTML = recentBooks.map((book, i) => {
    const genreInfo = DEFAULT_GENRES.find(g => g.id === book.genre) || { icon: '\uD83D\uDCD6', color: '#6C5CE7' };
    return `
      <div class="history-item" onclick="openBook('${book.id}')">
        <div class="history-icon" style="background: ${genreInfo.color}20;">${genreInfo.icon}</div>
        <div class="history-info">
          <h4>${book.title}</h4>
          <p>by ${book.author}</p>
        </div>
        <span class="history-date">${dates[i]}</span>
      </div>
    `;
  }).join('');
}

function editSetting(setting) {
  const newValue = prompt('Enter new display name:');
  if (newValue && newValue.trim()) {
    const settingName = document.getElementById('settingName');
    const profileName = document.getElementById('profileName');
    const avatar = document.getElementById('profileAvatar');

    if (settingName) settingName.textContent = newValue.trim();
    if (profileName) profileName.textContent = newValue.trim();
    if (avatar) avatar.textContent = newValue.trim().substring(0, 2).toUpperCase();

    showToast('Name updated!', 'success');
  }
}

function confirmDeleteAccount() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    showToast('Account deletion requested. We will process this within 24 hours.', 'info');
  }
}

function openBook(bookId) {
  window.location.href = `reader.html?id=${bookId}`;
}
