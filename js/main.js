/* ==========================================
   OCEANIC ORDER - Live Race Logic
   ========================================== */

let currentRaceId = null;
let currentRace = null;
let boats = [];
let boatMarkers = {};
let selectedBoat = null;
let mapInstance = null;
let boatSubscription = null;
let gpsSubscription = null;

// ==========================================
// Initialization
// ==========================================

async function initializePage() {
    showSpinner();
    try {
        // Fetch races
        const races = await fetchRaces();
        
        if (races.length === 0) {
            showError('No races found. Please create a race in Supabase first.');
            hideSpinner();
            return;
        }

        // Use first active race, or first race
        const activeRace = races.find(r => r.status === 'active') || races[0];
        currentRaceId = activeRace.id;
        currentRace = activeRace;

        // Update UI
        document.getElementById('race-name').textContent = activeRace.name;
        updateRaceStatus(activeRace.status);

        // Initialize map
        mapInstance = initializeMap();

        // Fetch boats
        await loadBoats();

        // Subscribe to real-time updates
        subscribeToUpdates();

        hideSpinner();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize page');
        hideSpinner();
    }
}

// ==========================================
// Map Management
// ==========================================

function initializeMap() {
    const map = L.map('map').setView([1.2345, 103.8677], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add race checkpoints if available
    loadCheckpoints(map);

    return map;
}

async function loadCheckpoints(map) {
    const checkpoints = await fetchCheckpoints(currentRaceId);
    
    checkpoints.forEach((checkpoint, index) => {
        L.circleMarker([checkpoint.latitude, checkpoint.longitude], {
            radius: 8,
            fillColor: '#ffaa00',
            color: '#fff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.7
        })
        .bindPopup(`<strong>CP ${checkpoint.checkpoint_number}</strong><br>${checkpoint.checkpoint_name}`)
        .addTo(map);
    });
}

// ==========================================
// Boat Management
// ==========================================

async function loadBoats() {
    try {
        boats = await fetchBoatsForRace(currentRaceId);
        
        // Clear existing markers
        Object.values(boatMarkers).forEach(marker => mapInstance.removeLayer(marker));
        boatMarkers = {};

        // Create markers for each boat
        boats.forEach(boat => {
            if (boat.latitude && boat.longitude) {
                createBoatMarker(boat);
            }
        });

        // Update leaderboard
        updateLeaderboard();

        // Update boat count
        document.getElementById('active-boats').textContent = boats.length;

        showSuccess(`Loaded ${boats.length} boats`);
    } catch (error) {
        console.error('Error loading boats:', error);
        showError('Failed to load boats');
    }
}

function createBoatMarker(boat) {
    const html = `
        <div style="
            background: ${boat.color_code};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
            ${boat.boat_number}
        </div>
    `;

    const marker = L.marker([boat.latitude, boat.longitude], {
        icon: L.divIcon({
            html: html,
            iconSize: [36, 36],
            className: 'boat-marker'
        })
    })
    .bindPopup(`
        <strong>${boat.boat_name}</strong><br>
        Team: ${boat.team_name}<br>
        Speed: ${boat.current_speed || 0} knots<br>
        Distance: ${boat.distance_traveled || 0} m
    `)
    .on('click', () => selectBoat(boat))
    .addTo(mapInstance);

    boatMarkers[boat.id] = marker;

    // Load and display GPS track
    loadBoatTrack(boat);
}

async function loadBoatTrack(boat) {
    try {
        const positions = await fetchGPSHistory(boat.id, 500);
        
        if (positions.length > 1) {
            const latLngs = positions.map(pos => [pos.latitude, pos.longitude]);
            
            L.polyline(latLngs, {
                color: boat.color_code,
                weight: 2,
                opacity: 0.6,
                dashArray: '5, 5'
            }).addTo(mapInstance);
        }
    } catch (error) {
        console.error('Error loading boat track:', error);
    }
}

function selectBoat(boat) {
    selectedBoat = boat;
    displayBoatDetails(boat);

    // Pan to boat
    mapInstance.setView([boat.latitude, boat.longitude], 14);
}

function displayBoatDetails(boat) {
    const detailsDiv = document.getElementById('boat-details');
    
    const html = `
        <div class="boat-details-item">
            <div>
                <div class="boat-details-label">Boat Name</div>
                <div class="boat-details-value">${boat.boat_name}</div>
            </div>
            <div class="boat-color-indicator" style="background: ${boat.color_code}"></div>
        </div>
        <div class="boat-details-item">
            <div class="boat-details-label">Team</div>
            <div class="boat-details-value">${boat.team_name}</div>
        </div>
        <div class="boat-details-item">
            <div class="boat-details-label">Current Speed</div>
            <div class="boat-details-value">${boat.current_speed ? boat.current_speed.toFixed(2) : '0.00'} knots</div>
        </div>
        <div class="boat-details-item">
            <div class="boat-details-label">Heading</div>
            <div class="boat-details-value">${boat.current_heading ? boat.current_heading.toFixed(0) : '0'}°</div>
        </div>
        <div class="boat-details-item">
            <div class="boat-details-label">Distance Traveled</div>
            <div class="boat-details-value">${boat.distance_traveled ? (boat.distance_traveled / 1000).toFixed(2) : '0.00'} km</div>
        </div>
        <div class="boat-details-item">
            <div class="boat-details-label">Position</div>
            <div class="boat-details-value">${boat.latitude?.toFixed(4)}, ${boat.longitude?.toFixed(4)}</div>
        </div>
        <div class="boat-details-item">
            <div class="boat-details-label">Last Updated</div>
            <div class="boat-details-value">${boat.updated_at ? formatTime(boat.updated_at) : 'N/A'}</div>
        </div>
    `;

    detailsDiv.innerHTML = html;
}

// ==========================================
// Leaderboard
// ==========================================

function updateLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    
    // Sort boats by rank
    const sortedBoats = [...boats].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    let html = '';
    sortedBoats.forEach((boat, index) => {
        const position = boat.rank || (index + 1);
        html += `
            <tr style="cursor: pointer; border-left: 4px solid ${boat.color_code};" onclick="selectBoat(boats.find(b => b.id === '${boat.id}'))">
                <td style="font-weight: bold; color: ${boat.color_code};">${position}</td>
                <td>${boat.boat_name}</td>
                <td>${boat.current_speed ? boat.current_speed.toFixed(1) : '0.0'}</td>
                <td>${boat.distance_traveled ? (boat.distance_traveled / 1000).toFixed(1) : '0.0'} km</td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="4" class="loading">No boats available</td></tr>';
}

// ==========================================
// Real-time Updates
// ==========================================

function subscribeToUpdates() {
    // Subscribe to boat changes
    boatSubscription = subscribeToBoatUpdates(currentRaceId, (payload) => {
        if (payload.eventType === 'UPDATE') {
            // Find and update boat in array
            const boatIndex = boats.findIndex(b => b.id === payload.new.id);
            if (boatIndex !== -1) {
                boats[boatIndex] = payload.new;
                
                // Update marker
                if (boatMarkers[payload.new.id]) {
                    boatMarkers[payload.new.id].setLatLng([payload.new.latitude, payload.new.longitude]);
                }

                // Update leaderboard
                updateLeaderboard();

                // Update selected boat details
                if (selectedBoat && selectedBoat.id === payload.new.id) {
                    displayBoatDetails(payload.new);
                }
            }
        }
    });

    // Subscribe to GPS updates
    gpsSubscription = subscribeToGPSUpdates(currentRaceId, (position) => {
        // Reload boat that was updated
        const boat = boats.find(b => b.id === position.boat_id);
        if (boat) {
            boat.latitude = position.latitude;
            boat.longitude = position.longitude;
            boat.current_speed = position.speed;
            boat.current_heading = position.heading;
        }
    });
}

// ==========================================
// Race Status
// ==========================================

function updateRaceStatus(status) {
    const badge = document.getElementById('race-status');
    
    const statusConfig = {
        'active': { text: 'Status: Active', class: 'status-active' },
        'upcoming': { text: 'Status: Upcoming', class: 'status-upcoming' },
        'completed': { text: 'Status: Completed', class: 'status-completed' }
    };

    const config = statusConfig[status] || statusConfig['upcoming'];
    badge.textContent = config.text;
    badge.className = `status-badge ${config.class}`;
}

// ==========================================
// Controls
// ==========================================

document.getElementById('refresh-btn')?.addEventListener('click', async () => {
    showSpinner();
    await loadBoats();
    hideSpinner();
    showSuccess('Boats refreshed');
});

document.getElementById('center-btn')?.addEventListener('click', () => {
    if (selectedBoat && mapInstance) {
        mapInstance.setView([selectedBoat.latitude, selectedBoat.longitude], 14);
        showSuccess('Map centered on selected boat');
    } else {
        showError('Please select a boat first');
    }
});

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
    initializePage();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadBoats();
        }
    }, 30000);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (boatSubscription) boatSubscription.unsubscribe();
    if (gpsSubscription) gpsSubscription.unsubscribe();
});