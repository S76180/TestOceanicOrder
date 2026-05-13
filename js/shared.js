/* ============================================
   OCEANIC ORDER - Shared JavaScript
   ============================================ */

// Navigation component - injects into pages
function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const navHTML = `
    <nav class="navbar">
      <a href="index.html" class="nav-brand">
        <span class="brand-icon">⛵</span>
        <span>
          OCEANIC ORDER
          <span class="brand-sub">Regatta Tracker</span>
        </span>
      </a>
      <ul class="nav-links" id="navLinks">
        <li><a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Dashboard</a></li>
        <li><a href="live-race.html" class="${currentPage === 'live-race.html' ? 'active' : ''}">Live Race</a></li>
        <li><a href="history.html" class="${currentPage === 'history.html' ? 'active' : ''}">Race History</a></li>
        <li><a href="about.html" class="${currentPage === 'about.html' ? 'active' : ''}">About</a></li>
      </ul>
      <div class="nav-status" id="connectionStatus">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText">Connected</span>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">☰</button>
    </nav>
  `;

  document.getElementById('navbar-container').innerHTML = navHTML;

  // Mobile toggle
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
  }
}

// Footer component
function initFooter() {
  const footerHTML = `
    <footer class="footer">
      <div class="footer-content">
        <span class="footer-text">© ${new Date().getFullYear()} OCEANIC ORDER — Regatta Tracking System</span>
        <div class="footer-links">
          <a href="about.html">About</a>
          <a href="https://github.com" target="_blank">GitHub</a>
          <a href="#">Documentation</a>
        </div>
      </div>
    </footer>
  `;
  document.getElementById('footer-container').innerHTML = footerHTML;
}

// Update connection status indicator
function setConnectionStatus(online) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (dot && text) {
    if (online) {
      dot.classList.remove('offline');
      text.textContent = 'Connected';
    } else {
      dot.classList.add('offline');
      text.textContent = 'Offline';
    }
  }
}

// Format time ago
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Format duration from seconds
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Format speed in knots
function formatSpeed(knots) {
  return `${knots.toFixed(1)} kn`;
}

// Format coordinates
function formatCoord(lat, lng) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

// Boat color palette (for consistent coloring)
const BOAT_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e67e22', // Dark Orange
  '#e84393', // Pink
  '#00cec9', // Cyan
  '#fdcb6e', // Yellow
  '#6c5ce7', // Indigo
  '#ff7675', // Light Red
];

function getBoatColor(index) {
  return BOAT_COLORS[index % BOAT_COLORS.length];
}

// Initialize shared components on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFooter();
});
