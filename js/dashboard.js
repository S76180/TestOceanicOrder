/* ============================================
   OCEANIC ORDER - Dashboard Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  loadDashboard();
});

function loadDashboard() {
  if (DEMO_MODE) {
    loadDemoStats();
    loadDemoCurrentRace();
    loadDemoLeaderboard();
    loadDemoUpcoming();
    loadDemoRecentResults();
    return;
  }
  // Live Supabase logic would go here
  loadLiveData();
}

// ============================================
// DEMO DATA RENDERING
// ============================================

function loadDemoStats() {
  const liveRaces = DEMO_RACES.filter(r => r.status === 'live').length;
  const completed = DEMO_RACES.filter(r => r.status === 'completed').length;
  const liveRace = DEMO_RACES.find(r => r.status === 'live');

  animateCounter('statLiveRaces', liveRaces);
  animateCounter('statActiveBoats', DEMO_BOATS.length);
  animateCounter('statCompletedRaces', completed);
  animateCounter('statWindSpeed', liveRace ? liveRace.wind_speed : 0);
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 40);
}

function loadDemoCurrentRace() {
  const race = DEMO_RACES.find(r => r.status === 'live');
  const card = document.getElementById('currentRaceCard');
  if (!race) {
    card.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏁</div><p>No live race at the moment</p></div>';
    return;
  }

  const elapsed = Math.floor((Date.now() - new Date(race.start_time)) / 1000);

  card.innerHTML = `
    <div class="race-title-row">
      <h3>${race.name}</h3>
      <span class="badge badge-live">Live</span>
    </div>
    <div class="current-race-info">
      <div class="race-info-item">
        <span class="race-info-label">Course</span>
        <span class="race-info-value">${race.course}</span>
      </div>
      <div class="race-info-item">
        <span class="race-info-label">Distance</span>
        <span class="race-info-value">${race.distance_nm} NM</span>
      </div>
      <div class="race-info-item">
        <span class="race-info-label">Elapsed</span>
        <span class="race-info-value" id="raceElapsed">${formatDuration(elapsed)}</span>
      </div>
      <div class="race-info-item">
        <span class="race-info-label">Wind</span>
        <span class="race-info-value">${race.wind_speed} kn / ${race.wind_direction}°</span>
      </div>
      <div class="race-info-item">
        <span class="race-info-label">Boats</span>
        <span class="race-info-value">${DEMO_BOATS.length}</span>
      </div>
      <div class="race-info-item">
        <span class="race-info-label">Location</span>
        <span class="race-info-value">${race.location}</span>
      </div>
    </div>
  `;

  // Update elapsed time every second
  setInterval(() => {
    const el = document.getElementById('raceElapsed');
    if (el) {
      const now = Math.floor((Date.now() - new Date(race.start_time)) / 1000);
      el.textContent = formatDuration(now);
    }
  }, 1000);
}

function loadDemoLeaderboard() {
  const positions = getDemoPositions();
  positions.sort((a, b) => a.rank - b.rank);

  const container = document.getElementById('leaderboard');
  container.innerHTML = positions.map((boat, i) => {
    const rankClass = i < 3 ? `rank-${i + 1}` : 'rank-default';
    return `
      <div class="leaderboard-item">
        <div class="leaderboard-rank ${rankClass}">${i + 1}</div>
        <div class="boat-color-dot" style="background: ${boat.color};"></div>
        <div class="leaderboard-boat">
          <div class="leaderboard-boat-name">${boat.name}</div>
          <div class="leaderboard-boat-skipper">${boat.skipper} · ${boat.country}</div>
        </div>
        <div class="leaderboard-speed">${formatSpeed(boat.speed)}</div>
      </div>
    `;
  }).join('');
}

function loadDemoUpcoming() {
  const upcoming = DEMO_RACES.filter(r => r.status === 'upcoming');
  const container = document.getElementById('upcomingRaces');

  if (upcoming.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No upcoming races scheduled</p></div>';
    return;
  }

  container.innerHTML = upcoming.map(race => {
    const date = new Date(race.start_time);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="upcoming-item">
        <div class="upcoming-name">${race.name}</div>
        <div class="upcoming-meta">
          <span>📅 ${dateStr}, ${timeStr}</span>
          <span>📏 ${race.distance_nm} NM</span>
          <span>📍 ${race.location}</span>
        </div>
      </div>
    `;
  }).join('');
}

function loadDemoRecentResults() {
  const completed = DEMO_RACES.filter(r => r.status === 'completed');
  const tbody = document.getElementById('recentResultsBody');

  tbody.innerHTML = completed.map(race => {
    const results = DEMO_RESULTS[race.id];
    const winner = results ? results[0].boat_name : '—';
    const date = new Date(race.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <tr>
        <td class="fw-600 text-white">${race.name}</td>
        <td>${date}</td>
        <td class="text-accent">${winner}</td>
        <td>${race.distance_nm} NM</td>
        <td><span class="badge badge-completed">Completed</span></td>
      </tr>
    `;
  }).join('');
}

// ============================================
// LIVE SUPABASE DATA (when connected)
// ============================================
async function loadLiveData() {
  if (!supabaseClient) return;

  try {
    // Fetch races
    const { data: races } = await supabaseClient
      .from('races')
      .select('*')
      .order('start_time', { ascending: false });

    // Fetch boats
    const { data: boats } = await supabaseClient
      .from('boats')
      .select('*');

    // Fetch latest positions
    const { data: positions } = await supabaseClient
      .from('boat_positions')
      .select('*')
      .order('timestamp', { ascending: false });

    // Render with live data (similar to demo but with real data)
    console.log('[Dashboard] Loaded live data:', { races, boats, positions });
    setConnectionStatus(true);
  } catch (err) {
    console.error('[Dashboard] Error loading live data:', err);
    setConnectionStatus(false);
  }
}
