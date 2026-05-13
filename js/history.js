/* ============================================
   OCEANIC ORDER - Race History Logic
   ============================================ */

let replayMap = null;
let replayMarkers = {};
let replayTrackLines = {};
let replayInterval = null;
let isReplaying = false;

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  loadRaceHistory();
  initHistoryControls();
});

// ============================================
// LOAD RACE HISTORY
// ============================================

function loadRaceHistory() {
  if (DEMO_MODE) {
    renderRaceCards(DEMO_RACES);
    return;
  }
  loadLiveHistory();
}

function renderRaceCards(races) {
  const grid = document.getElementById('raceCardsGrid');
  const filterStatus = document.getElementById('filterStatus').value;
  const filterSort = document.getElementById('filterSort').value;

  let filtered = [...races];
  if (filterStatus !== 'all') {
    filtered = filtered.filter(r => r.status === filterStatus);
  }

  filtered.sort((a, b) => {
    const dateA = new Date(a.start_time);
    const dateB = new Date(b.start_time);
    return filterSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏁</div><p>No races found</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(race => {
    const date = new Date(race.start_time);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const results = DEMO_RESULTS[race.id];
    const winner = results ? results[0].boat_name : null;

    let statusBadge = '';
    if (race.status === 'live') statusBadge = '<span class="badge badge-live">Live</span>';
    else if (race.status === 'completed') statusBadge = '<span class="badge badge-completed">Completed</span>';
    else if (race.status === 'upcoming') statusBadge = '<span class="badge badge-upcoming">Upcoming</span>';

    return `
      <div class="race-card" onclick="openRaceDetail(${race.id})">
        <div class="race-card-header">
          <div>
            <div class="race-card-title">${race.name}</div>
            <div class="race-card-date">${dateStr} at ${timeStr}</div>
          </div>
          ${statusBadge}
        </div>
        <div class="race-card-body">
          <div class="race-card-meta">
            <div class="race-meta-cell">
              <span class="race-meta-label">Course</span>
              <span class="race-meta-value">${race.course}</span>
            </div>
            <div class="race-meta-cell">
              <span class="race-meta-label">Distance</span>
              <span class="race-meta-value">${race.distance_nm} NM</span>
            </div>
            <div class="race-meta-cell">
              <span class="race-meta-label">Wind</span>
              <span class="race-meta-value">${race.wind_speed ? race.wind_speed + ' kn' : 'TBD'}</span>
            </div>
          </div>
        </div>
        ${race.status === 'completed' && winner ? `
          <div class="race-card-footer">
            <div class="race-winner">
              <span class="race-winner-trophy">🏆</span>
              <span class="race-winner-name">${winner}</span>
            </div>
            <span class="race-card-action">View Results ➜</span>
          </div>
        ` : `
          <div class="race-card-footer">
            <span class="race-card-date">${race.location}</span>
            ${race.status === 'live' ? '<span class="race-card-action">Watch Live ➜</span>' : '<span class="race-card-action">Details ➜</span>'}
          </div>
        `}
      </div>
    `;
  }).join('');
}

// ============================================
// RACE DETAIL MODAL
// ============================================

function openRaceDetail(raceId) {
  const race = DEMO_RACES.find(r => r.id === raceId);
  if (!race) return;

  if (race.status === 'live') {
    window.location.href = 'live-race.html';
    return;
  }

  const modal = document.getElementById('raceDetailModal');
  const content = document.getElementById('modalContent');
  document.getElementById('modalRaceName').textContent = race.name;

  const results = DEMO_RESULTS[raceId] || [];
  const date = new Date(race.start_time);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const resultsHTML = results.length > 0 ? `
    <div>
      <div class="detail-section-title">Final Results</div>
      <ul class="detail-results-list">
        ${results.map((r, i) => {
          const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          return `
            <li class="detail-result-item">
              <div class="result-rank ${rankClass}">${r.rank}</div>
              <span class="result-boat-name">${r.boat_name}</span>
              <span class="result-finish-time">${r.finish_time}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  ` : '<p class="text-muted">No results available yet.</p>';

  content.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="detail-section-title">Race Information</div>
        <table class="data-table">
          <tr><td class="text-muted">Date</td><td class="text-white">${dateStr}</td></tr>
          <tr><td class="text-muted">Location</td><td class="text-white">${race.location}</td></tr>
          <tr><td class="text-muted">Course</td><td class="text-white">${race.course}</td></tr>
          <tr><td class="text-muted">Distance</td><td class="text-white">${race.distance_nm} NM</td></tr>
          <tr><td class="text-muted">Wind</td><td class="text-white">${race.wind_speed ? race.wind_speed + ' kn / ' + race.wind_direction + '°' : 'N/A'}</td></tr>
          <tr><td class="text-muted">Boats</td><td class="text-white">${DEMO_BOATS.length}</td></tr>
        </table>
        ${race.status === 'completed' ? `
          <button class="btn btn-primary btn-sm mt-2" onclick="openReplay(${raceId})">▶ Watch Replay</button>
        ` : ''}
      </div>
      ${resultsHTML}
    </div>
  `;

  modal.classList.add('active');
}

function closeRaceDetail() {
  document.getElementById('raceDetailModal').classList.remove('active');
}

// ============================================
// RACE REPLAY
// ============================================

function openReplay(raceId) {
  closeRaceDetail();

  const race = DEMO_RACES.find(r => r.id === raceId);
  if (!race) return;

  document.getElementById('replaySection').style.display = 'block';
  document.getElementById('replayRaceName').textContent = race.name;

  // Scroll to replay section
  document.getElementById('replaySection').scrollIntoView({ behavior: 'smooth' });

  // Initialize replay map
  if (replayMap) {
    replayMap.remove();
  }

  replayMap = L.map('replayMap', {
    center: [1.27, 103.85],
    zoom: 14,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap · © CARTO',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(replayMap);

  // Generate replay tracks
  DEMO_BOATS.forEach((boat, i) => {
    const track = generateDemoTrack(i, 120);

    // Track line (start hidden, reveal during replay)
    const trackLine = L.polyline([], {
      color: boat.color,
      weight: 3,
      opacity: 0.8,
    }).addTo(replayMap);
    replayTrackLines[boat.id] = { line: trackLine, fullTrack: track };

    // Marker
    const icon = L.divIcon({
      className: 'boat-marker',
      html: `<div class="boat-marker-inner" style="background: ${boat.color};">⛵</div>
             <div class="boat-marker-label">${boat.name}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const marker = L.marker([track[0].lat, track[0].lng], { icon }).addTo(replayMap);
    replayMarkers[boat.id] = marker;
  });

  // Fit map
  const allPoints = DEMO_BOATS.flatMap((boat, i) => {
    const track = generateDemoTrack(i, 120);
    return track.map(p => [p.lat, p.lng]);
  });
  replayMap.fitBounds(allPoints, { padding: [40, 40] });

  // Render results below map
  const results = DEMO_RESULTS[raceId] || [];
  if (results.length > 0) {
    document.getElementById('replayResults').innerHTML = `
      <div class="replay-results-title">Final Standings</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Finish Time</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td class="fw-600">#${r.rank}</td>
              <td class="text-white">${r.boat_name}</td>
              <td class="text-accent" style="font-family: var(--font-mono);">${r.finish_time}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Reset slider
  document.getElementById('replaySlider').value = 0;
  document.getElementById('replayTimeLabel').textContent = '00:00';
}

function toggleReplay() {
  if (isReplaying) {
    pauseReplay();
  } else {
    playReplay();
  }
}

function playReplay() {
  isReplaying = true;
  document.getElementById('replayPlayBtn').textContent = '⏸ Pause';

  const slider = document.getElementById('replaySlider');
  const speed = parseInt(document.getElementById('replaySpeed').value);
  let frame = parseInt(slider.value);
  const maxFrames = 120;

  replayInterval = setInterval(() => {
    frame++;
    if (frame >= maxFrames) {
      pauseReplay();
      frame = maxFrames;
    }

    slider.value = frame;
    updateReplayFrame(frame, maxFrames);
  }, 200 / speed);
}

function pauseReplay() {
  isReplaying = false;
  clearInterval(replayInterval);
  document.getElementById('replayPlayBtn').textContent = '▶ Play';
}

function updateReplayFrame(frame, maxFrames) {
  // Update time label
  const totalSeconds = Math.floor((frame / maxFrames) * 4 * 3600);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  document.getElementById('replayTimeLabel').textContent =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Update each boat position
  DEMO_BOATS.forEach(boat => {
    const data = replayTrackLines[boat.id];
    if (!data) return;

    const visibleTrack = data.fullTrack.slice(0, frame + 1);
    data.line.setLatLngs(visibleTrack.map(p => [p.lat, p.lng]));

    if (visibleTrack.length > 0) {
      const latest = visibleTrack[visibleTrack.length - 1];
      replayMarkers[boat.id].setLatLng([latest.lat, latest.lng]);
    }
  });
}

// ============================================
// CONTROLS
// ============================================

function initHistoryControls() {
  // Filter handlers
  document.getElementById('filterStatus').addEventListener('change', () => {
    renderRaceCards(DEMO_RACES);
  });

  document.getElementById('filterSort').addEventListener('change', () => {
    renderRaceCards(DEMO_RACES);
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeRaceDetail);
  document.getElementById('raceDetailModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeRaceDetail();
  });

  // Replay controls
  document.getElementById('replayPlayBtn').addEventListener('click', toggleReplay);
  document.getElementById('replaySlider').addEventListener('input', (e) => {
    if (isReplaying) pauseReplay();
    updateReplayFrame(parseInt(e.target.value), 120);
  });
  document.getElementById('closeReplay').addEventListener('click', () => {
    pauseReplay();
    document.getElementById('replaySection').style.display = 'none';
    if (replayMap) {
      replayMap.remove();
      replayMap = null;
    }
    replayMarkers = {};
    replayTrackLines = {};
  });
}

// ============================================
// LIVE SUPABASE (when connected)
// ============================================

async function loadLiveHistory() {
  if (!supabaseClient) return;

  try {
    const { data: races } = await supabaseClient
      .from('races')
      .select('*')
      .order('start_time', { ascending: false });

    if (races) renderRaceCards(races);
    setConnectionStatus(true);
  } catch (err) {
    console.error('[History] Error:', err);
    setConnectionStatus(false);
  }
}
