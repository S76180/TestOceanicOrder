/* ============================================
   OCEANIC ORDER - Live Race Map & Tracking
   ============================================ */

let map;
let boatMarkers = {};
let boatTrackLines = {};
let boatTrackData = {};
let selectedBoatId = null;
let showTracks = true;
let simulationInterval = null;
let isSimulating = false;

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  initMap();
  loadRaceData();
  initControls();
});

// ============================================
// MAP INITIALIZATION
// ============================================

function initMap() {
  map = L.map('map', {
    center: [1.27, 103.85],
    zoom: 14,
    zoomControl: true,
    attributionControl: true,
  });

  // Dark ocean-themed tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);
}

// ============================================
// DATA LOADING
// ============================================

function loadRaceData() {
  if (DEMO_MODE) {
    loadDemoRaceData();
    return;
  }
  loadLiveRaceData();
}

function loadDemoRaceData() {
  const race = DEMO_RACES.find(r => r.status === 'live');
  if (!race) {
    document.getElementById('raceNameLabel').textContent = 'No live race';
    return;
  }

  // Set race info
  document.getElementById('raceNameLabel').textContent = race.name;
  document.getElementById('sidebarDistance').textContent = race.distance_nm + ' NM';
  document.getElementById('sidebarWind').textContent = `${race.wind_speed} kn / ${race.wind_direction}°`;
  document.getElementById('sidebarCourse').textContent = race.course;

  // Update elapsed time
  updateElapsed(race.start_time);
  setInterval(() => updateElapsed(race.start_time), 1000);

  // Generate tracks and positions
  DEMO_BOATS.forEach((boat, i) => {
    const trackPoints = generateDemoTrack(i, 80);
    boatTrackData[boat.id] = trackPoints;

    // Draw track line
    const latLngs = trackPoints.map(p => [p.lat, p.lng]);
    const trackLine = L.polyline(latLngs, {
      color: boat.color,
      weight: 3,
      opacity: 0.7,
      dashArray: null,
      smoothFactor: 1.5,
    }).addTo(map);
    boatTrackLines[boat.id] = trackLine;

    // Add boat marker at latest position
    const latest = trackPoints[trackPoints.length - 1];
    const marker = createBoatMarker(boat, latest);
    marker.addTo(map);
    boatMarkers[boat.id] = marker;
  });

  // Render boat list in sidebar
  renderBoatList(DEMO_BOATS);

  // Fit map to all boat positions
  centerOnFleet();

  // Update overlay
  document.getElementById('overlayBoatCountValue').textContent = DEMO_BOATS.length;
  updateOverlayTime();
  setInterval(updateOverlayTime, 1000);
}

// ============================================
// BOAT MARKERS
// ============================================

function createBoatMarker(boat, position) {
  const icon = L.divIcon({
    className: 'boat-marker',
    html: `
      <div class="boat-marker-inner" style="background: ${boat.color};">⛵</div>
      <div class="boat-marker-label">${boat.name}</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const marker = L.marker([position.lat, position.lng], { icon });
  marker.on('click', () => selectBoat(boat.id));
  return marker;
}

function updateBoatMarker(boatId, position) {
  if (boatMarkers[boatId]) {
    boatMarkers[boatId].setLatLng([position.lat, position.lng]);
  }
}

// ============================================
// BOAT SELECTION & INFO PANEL
// ============================================

function selectBoat(boatId) {
  selectedBoatId = boatId;

  // Update sidebar selection
  document.querySelectorAll('.boat-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.boatId == boatId);
  });

  // Show info panel
  const boat = DEMO_BOATS.find(b => b.id === boatId);
  const track = boatTrackData[boatId];
  const latest = track ? track[track.length - 1] : null;

  if (boat && latest) {
    const infoPanel = document.getElementById('mapBoatInfo');
    const content = document.getElementById('boatInfoContent');
    content.innerHTML = `
      <div class="info-row">
        <div class="boat-color-dot" style="background: ${boat.color}; width: 14px; height: 14px;"></div>
        <div>
          <div class="info-boat-name">${boat.name}</div>
          <div class="info-boat-sail">${boat.sail_number} · ${boat.skipper} · ${boat.country}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-cell">
          <span class="info-cell-label">Speed</span>
          <span class="info-cell-value">${latest.speed.toFixed(1)} kn</span>
        </div>
        <div class="info-cell">
          <span class="info-cell-label">Heading</span>
          <span class="info-cell-value">${latest.heading.toFixed(0)}°</span>
        </div>
        <div class="info-cell">
          <span class="info-cell-label">Position</span>
          <span class="info-cell-value">${formatCoord(latest.lat, latest.lng)}</span>
        </div>
        <div class="info-cell">
          <span class="info-cell-label">Last Update</span>
          <span class="info-cell-value">${timeAgo(latest.timestamp)}</span>
        </div>
      </div>
    `;
    infoPanel.style.display = 'block';

    // Center map on selected boat
    map.panTo([latest.lat, latest.lng]);

    // Highlight track
    Object.keys(boatTrackLines).forEach(id => {
      const line = boatTrackLines[id];
      if (parseInt(id) === boatId) {
        line.setStyle({ weight: 5, opacity: 1 });
      } else {
        line.setStyle({ weight: 2, opacity: 0.4 });
      }
    });
  }
}

function deselectBoat() {
  selectedBoatId = null;
  document.querySelectorAll('.boat-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('mapBoatInfo').style.display = 'none';

  // Reset track styles
  Object.values(boatTrackLines).forEach(line => {
    line.setStyle({ weight: 3, opacity: 0.7 });
  });
}

// ============================================
// SIDEBAR BOAT LIST
// ============================================

function renderBoatList(boats) {
  const positions = getDemoPositions();
  positions.sort((a, b) => a.rank - b.rank);

  const container = document.getElementById('boatList');
  container.innerHTML = positions.map((boat, i) => `
    <div class="boat-item" data-boat-id="${boat.id}" onclick="selectBoat(${boat.id})">
      <div class="boat-rank ${i < 3 ? 'top-3' : ''}">${i + 1}</div>
      <div class="boat-color-indicator" style="background: ${boat.color};"></div>
      <div class="boat-details">
        <div class="boat-name">${boat.name}</div>
        <div class="boat-skipper">${boat.skipper}</div>
      </div>
      <div class="boat-stats">
        <div class="boat-speed">${boat.speed.toFixed(1)} kn</div>
        <div class="boat-heading">${boat.heading.toFixed(0)}°</div>
      </div>
    </div>
  `).join('');
}

// ============================================
// SIMULATION (Demo live movement)
// ============================================

function startSimulation() {
  if (isSimulating) return;
  isSimulating = true;

  const btnSimulate = document.getElementById('btnSimulate');
  btnSimulate.textContent = '⏸ Pause';

  let tick = 80;

  simulationInterval = setInterval(() => {
    tick++;

    DEMO_BOATS.forEach((boat, i) => {
      const track = boatTrackData[boat.id];
      // Generate next point
      const totalPoints = tick;
      const t = totalPoints / 200;
      const baseAngle = (i * 60) * (Math.PI / 180);
      const radius = 0.015 + (i * 0.002);
      const angle = baseAngle + t * Math.PI * 2.5;
      const wobble = Math.sin(t * 12 + i) * 0.003;
      const lat = 1.27 + Math.cos(angle) * (radius + wobble);
      const lng = 103.85 + Math.sin(angle) * (radius + wobble * 1.5);
      const speed = 5 + Math.sin(t * 8 + i) * 3 + Math.random() * 1.5;
      const heading = ((angle * 180 / Math.PI) + 90) % 360;

      const newPoint = {
        lat, lng, speed, heading,
        timestamp: new Date().toISOString(),
      };

      track.push(newPoint);

      // Update track line
      const latLngs = track.map(p => [p.lat, p.lng]);
      boatTrackLines[boat.id].setLatLngs(latLngs);

      // Update marker position
      updateBoatMarker(boat.id, newPoint);

      // Update selected boat info
      if (selectedBoatId === boat.id) {
        selectBoat(boat.id);
      }
    });

    // Update sidebar boat list speeds
    updateBoatListSpeeds();

  }, 1500);
}

function stopSimulation() {
  isSimulating = false;
  clearInterval(simulationInterval);
  const btnSimulate = document.getElementById('btnSimulate');
  btnSimulate.textContent = '▶ Simulate';
}

function updateBoatListSpeeds() {
  DEMO_BOATS.forEach(boat => {
    const track = boatTrackData[boat.id];
    if (track && track.length > 0) {
      const latest = track[track.length - 1];
      const item = document.querySelector(`.boat-item[data-boat-id="${boat.id}"] .boat-speed`);
      if (item) item.textContent = latest.speed.toFixed(1) + ' kn';
      const headingEl = document.querySelector(`.boat-item[data-boat-id="${boat.id}"] .boat-heading`);
      if (headingEl) headingEl.textContent = latest.heading.toFixed(0) + '°';
    }
  });
}

// ============================================
// CONTROLS
// ============================================

function initControls() {
  // Center fleet
  document.getElementById('btnCenterMap').addEventListener('click', centerOnFleet);

  // Toggle tracks
  document.getElementById('btnToggleTracks').addEventListener('click', () => {
    showTracks = !showTracks;
    Object.values(boatTrackLines).forEach(line => {
      if (showTracks) {
        line.addTo(map);
      } else {
        map.removeLayer(line);
      }
    });
  });

  // Simulate button
  document.getElementById('btnSimulate').addEventListener('click', () => {
    if (isSimulating) {
      stopSimulation();
    } else {
      startSimulation();
    }
  });

  // Close boat info
  document.getElementById('closeBoatInfo').addEventListener('click', deselectBoat);

  // Mobile sidebar toggle
  document.getElementById('sidebarToggleMobile').addEventListener('click', () => {
    document.getElementById('raceSidebar').classList.toggle('open');
  });
}

function centerOnFleet() {
  const bounds = [];
  DEMO_BOATS.forEach(boat => {
    const track = boatTrackData[boat.id];
    if (track && track.length > 0) {
      const latest = track[track.length - 1];
      bounds.push([latest.lat, latest.lng]);
    }
  });
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [60, 60] });
  }
}

// ============================================
// HELPERS
// ============================================

function updateElapsed(startTime) {
  const seconds = Math.floor((Date.now() - new Date(startTime)) / 1000);
  const el = document.getElementById('sidebarElapsed');
  if (el) el.textContent = formatDuration(seconds);
}

function updateOverlayTime() {
  const now = new Date();
  const el = document.getElementById('overlayTimeValue');
  if (el) {
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

// ============================================
// LIVE SUPABASE DATA (when connected)
// ============================================

async function loadLiveRaceData() {
  if (!supabaseClient) return;

  try {
    // Load active race
    const { data: races } = await supabaseClient
      .from('races')
      .select('*')
      .eq('status', 'live')
      .limit(1);

    if (!races || races.length === 0) return;

    const race = races[0];
    document.getElementById('raceNameLabel').textContent = race.name;

    // Load boats and positions
    const { data: boats } = await supabaseClient.from('boats').select('*');
    const { data: positions } = await supabaseClient
      .from('boat_positions')
      .select('*')
      .eq('race_id', race.id)
      .order('timestamp', { ascending: true });

    // Group positions by boat
    boats.forEach((boat, i) => {
      const boatPositions = positions.filter(p => p.boat_id === boat.id);
      boatTrackData[boat.id] = boatPositions;
      boat.color = getBoatColor(i);

      // Draw track
      const latLngs = boatPositions.map(p => [p.lat, p.lng]);
      const trackLine = L.polyline(latLngs, {
        color: boat.color,
        weight: 3,
        opacity: 0.7,
      }).addTo(map);
      boatTrackLines[boat.id] = trackLine;

      // Add marker
      if (boatPositions.length > 0) {
        const latest = boatPositions[boatPositions.length - 1];
        const marker = createBoatMarker(boat, latest);
        marker.addTo(map);
        boatMarkers[boat.id] = marker;
      }
    });

    centerOnFleet();
    setConnectionStatus(true);

    // Subscribe to real-time updates
    subscribeToPositions(race.id);
  } catch (err) {
    console.error('[LiveRace] Error:', err);
    setConnectionStatus(false);
  }
}

function subscribeToPositions(raceId) {
  if (!supabaseClient) return;

  supabaseClient
    .channel('boat_positions')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'boat_positions',
      filter: `race_id=eq.${raceId}`,
    }, (payload) => {
      const pos = payload.new;
      const boatId = pos.boat_id;

      // Update track data
      if (!boatTrackData[boatId]) boatTrackData[boatId] = [];
      boatTrackData[boatId].push(pos);

      // Update track line
      if (boatTrackLines[boatId]) {
        const latLngs = boatTrackData[boatId].map(p => [p.lat, p.lng]);
        boatTrackLines[boatId].setLatLngs(latLngs);
      }

      // Update marker
      updateBoatMarker(boatId, pos);

      // Update info panel if selected
      if (selectedBoatId === boatId) {
        selectBoat(boatId);
      }
    })
    .subscribe();
}
