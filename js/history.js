/* ==========================================
   OCEANIC ORDER - History Replay Logic
   ========================================== */

let historyMap = null;
let historyRaceId = null;
let historyBoatId = null;
let gpsHistory = [];
let replayIndex = 0;
let isPlaying = false;
let replaySpeed = 1;
let polylineInstance = null;
let markerInstance = null;

// ==========================================
// Initialization
// ==========================================

async function initializeHistoryPage() {
    showSpinner();
    try {
        const races = await fetchRaces();
        
        if (races.length === 0) {
            showError('No races found');
            hideSpinner();
            return;
        }

        // Initialize map
        historyMap = initializeHistoryMap();

        // Populate race dropdown
        populateHistoryRaceDropdown(races);

        hideSpinner();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize history page');
        hideSpinner();
    }
}

// ==========================================
// Map Initialization
// ==========================================

function initializeHistoryMap() {
    const map = L.map('history-map').setView([1.2345, 103.8677], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    return map;
}

// ==========================================
// Race Selection
// ==========================================

function populateHistoryRaceDropdown(races) {
    const select = document.getElementById('history-race-select');
    
    let html = '';
    races.forEach(race => {
        html += `<option value="${race.id}">${race.name} - ${formatDate(race.start_time)}</option>`;
    });

    select.innerHTML = html;

    select.addEventListener('change', async (e) => {
        historyRaceId = e.target.value;
        await loadBoatsForHistory();
    });
}

async function loadBoatsForHistory() {
    try {
        const boats = await fetchBoatsForRace(historyRaceId);
        
        const boatSelect = document.getElementById('boat-select');
        
        if (boats.length === 0) {
            boatSelect.innerHTML = '<option>No boats in this race</option>';
            return;
        }

        let html = '';
        boats.forEach(boat => {
            html += `<option value="${boat.id}">${boat.boat_name} (${boat.boat_number})</option>`;
        });

        boatSelect.innerHTML = html;
        historyBoatId = boats[0].id;

    } catch (error) {
        console.error('Error loading boats:', error);
        showError('Failed to load boats');
    }
}

// ==========================================
// Load History
// ==========================================

document.getElementById('boat-select')?.addEventListener('change', (e) => {
    historyBoatId = e.target.value;
});

document.getElementById('load-history-btn')?.addEventListener('click', async () => {
    if (!historyRaceId || !historyBoatId) {
        showError('Please select a race and boat');
        return;
    }

    showSpinner();
    try {
        // Fetch GPS history
        gpsHistory = await fetchGPSHistory(historyBoatId);

        if (gpsHistory.length === 0) {
            showError('No GPS history found for this boat');
            hideSpinner();
            return;
        }

        // Clear map
        if (polylineInstance) historyMap.removeLayer(polylineInstance);
        if (markerInstance) historyMap.removeLayer(markerInstance);

        // Draw full track
        const latLngs = gpsHistory.map(pos => [pos.latitude, pos.longitude]);
        const boat = await fetchBoatDetails(historyBoatId);
        
        polylineInstance = L.polyline(latLngs, {
            color: boat.color_code,
            weight: 2,
            opacity: 0.6
        }).addTo(historyMap);

        // Center map
        historyMap.fitBounds(polylineInstance.getBounds());

        // Initialize marker at start
        markerInstance = L.circleMarker([latLngs[0][0], latLngs[0][1]], {
            radius: 8,
            fillColor: boat.color_code,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(historyMap);

        // Update timeline
        populateTimeline(gpsHistory);

        // Update stats
        updateHistoryStats(gpsHistory, boat);

        replayIndex = 0;
        isPlaying = false;
        document.getElementById('play-replay-btn').disabled = false;

        showSuccess(`Loaded ${gpsHistory.length} position records`);

        hideSpinner();
    } catch (error) {
        console.error('Error loading history:', error);
        showError('Failed to load history');
        hideSpinner();
    }
});

// ==========================================
// Replay Controls
// ==========================================

document.getElementById('play-replay-btn')?.addEventListener('click', () => {
    if (gpsHistory.length === 0) {
        showError('Load history first');
        return;
    }

    isPlaying = !isPlaying;
    const btn = document.getElementById('play-replay-btn');
    btn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';

    if (isPlaying) {
        playReplay();
    }
});

document.getElementById('replay-prev-btn')?.addEventListener('click', () => {
    isPlaying = false;
    replayIndex = Math.max(0, replayIndex - 1);
    document.getElementById('play-replay-btn').textContent = '▶ Play';
    updateReplayView();
});

document.getElementById('replay-next-btn')?.addEventListener('click', () => {
    isPlaying = false;
    replayIndex = Math.min(gpsHistory.length - 1, replayIndex + 1);
    document.getElementById('play-replay-btn').textContent = '▶ Play';
    updateReplayView();
});

document.getElementById('speed-slider')?.addEventListener('change', (e) => {
    replaySpeed = parseInt(e.target.value);
    document.getElementById('speed-display').textContent = replaySpeed + 'x';
});

// ==========================================
// Replay Animation
// ==========================================

async function playReplay() {
    if (!isPlaying || replayIndex >= gpsHistory.length) {
        isPlaying = false;
        document.getElementById('play-replay-btn').textContent = '▶ Play';
        return;
    }

    updateReplayView();
    replayIndex++;

    // Delay based on speed setting
    const delay = 100 / replaySpeed;
    setTimeout(playReplay, delay);
}

function updateReplayView() {
    const position = gpsHistory[replayIndex];
    const boat = await fetchBoatDetails(historyBoatId);

    // Update marker
    if (markerInstance) {
        markerInstance.setLatLng([position.latitude, position.longitude]);
    }

    // Update timeline highlight
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
        item.classList.toggle('active', index === replayIndex);
    });

    // Center map on current position
    historyMap.panTo([position.latitude, position.longitude]);
}

// ==========================================
// Timeline
// ==========================================

function populateTimeline(positions) {
    const container = document.getElementById('timeline-container');
    
    let html = '';
    positions.forEach((pos, index) => {
        html += `
            <div class="timeline-item" onclick="jumpToPosition(${index})">
                <div class="timeline-time">${formatTime(pos.timestamp)}</div>
                <div class="timeline-data">
                    Speed: ${(pos.speed || 0).toFixed(2)} knots | 
                    Heading: ${(pos.heading || 0).toFixed(0)}°
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function jumpToPosition(index) {
    isPlaying = false;
    replayIndex = index;
    document.getElementById('play-replay-btn').textContent = '▶ Play';
    updateReplayView();
}

// ==========================================
// Statistics
// ==========================================

async function updateHistoryStats(positions, boat) {
    try {
        // Calculate statistics
        const speeds = positions.map(p => p.speed || 0).filter(s => s > 0);
        const avgSpeed = speeds.length > 0 
            ? (speeds.reduce((a, b) => a + b) / speeds.length).toFixed(2)
            : '0.00';

        const maxSpeed = speeds.length > 0 
            ? Math.max(...speeds).toFixed(2)
            : '0.00';

        const minSpeed = speeds.length > 0 
            ? Math.min(...speeds).toFixed(2)
            : '0.00';

        // Calculate distance
        let totalDistance = 0;
        for (let i = 1; i < positions.length; i++) {
            const dist = calculateDistance(
                positions[i-1].latitude,
                positions[i-1].longitude,
                positions[i].latitude,
                positions[i].longitude
            );
            totalDistance += dist;
        }

        // Duration
        const firstTime = new Date(positions[0].timestamp);
        const lastTime = new Date(positions[positions.length - 1].timestamp);
        const duration = lastTime - firstTime;

        const html = `
            <div class="boat-details-item">
                <div class="boat-details-label">Total Distance</div>
                <div class="boat-details-value">${(totalDistance / 1000).toFixed(2)} km</div>
            </div>
            <div class="boat-details-item">
                <div class="boat-details-label">Duration</div>
                <div class="boat-details-value">${formatDuration(duration)}</div>
            </div>
            <div class="boat-details-item">
                <div class="boat-details-label">Average Speed</div>
                <div class="boat-details-value">${avgSpeed} knots</div>
            </div>
            <div class="boat-details-item">
                <div class="boat-details-label">Max Speed</div>
                <div class="boat-details-value">${maxSpeed} knots</div>
            </div>
            <div class="boat-details-item">
                <div class="boat-details-label">Min Speed</div>
                <div class="boat-details-value">${minSpeed} knots</div>
            </div>
            <div class="boat-details-item">
                <div class="boat-details-label">Data Points</div>
                <div class="boat-details-value">${positions.length}</div>
            </div>
        `;

        document.getElementById('history-stats').innerHTML = html;

    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// ==========================================
// Mobile Menu
// ==========================================

document.querySelector('.hamburger')?.addEventListener('click', () => {
    const menu = document.querySelector('.nav-menu');
    menu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.remove('active');
    });
});

// ==========================================
// Startup
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeHistoryPage();
});

// Clean up on unload
window.addEventListener('beforeunload', () => {
    isPlaying = false;
});