/* ==========================================
   OCEANIC ORDER - Admin Dashboard Logic
   ========================================== */

// Tab Management
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Remove active from all buttons and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked button and corresponding content
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ==========================================
// Race Management
// ==========================================

document.getElementById('race-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const raceName = document.getElementById('race-name').value;
    const description = document.getElementById('race-description').value;
    const location = document.getElementById('race-location').value;
    const startTime = document.getElementById('race-start').value;
    const endTime = document.getElementById('race-end').value;
    const status = document.getElementById('race-status').value;
    
    try {
        const { data, error } = await supabase
            .from('races')
            .insert([{
                name: raceName,
                description: description,
                location: location,
                start_time: startTime,
                end_time: endTime,
                status: status
            }]);
        
        if (error) throw error;
        
        showSuccess(`Race "${raceName}" created successfully!`);
        document.getElementById('race-form').reset();
        loadRaces();
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to create race: ${error.message}`);
    }
});

async function loadRaces() {
    try {
        const races = await fetchRaces();
        
        const container = document.getElementById('races-list');
        
        if (races.length === 0) {
            container.innerHTML = '<p class="loading">No races created yet</p>';
            return;
        }
        
        let html = '';
        races.forEach(race => {
            html += `
                <div class="race-item">
                    <div class="race-item-info">
                        <h3>${race.name}</h3>
                        <p><strong>Location:</strong> ${race.location}</p>
                        <p><strong>Start:</strong> ${formatDate(race.start_time)} ${formatTime(race.start_time)}</p>
                        <p><strong>Status:</strong> <span class="status-inline status-${race.status}">${race.status}</span></p>
                    </div>
                    <div class="race-item-actions">
                        <button class="btn-edit" onclick="editRace('${race.id}')">Edit</button>
                        <button class="btn-edit btn-danger" onclick="deleteRace('${race.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Populate dropdowns
        populateRaceDropdowns(races);
    } catch (error) {
        console.error('Error loading races:', error);
    }
}

function populateRaceDropdowns(races) {
    const dropdowns = [
        'boat-race-select',
        'checkpoint-race-select',
        'manage-race-select',
        'checkpoint-view-race',
        'test-race-select'
    ];
    
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        let html = '<option value="">Select a race...</option>';
        races.forEach(race => {
            html += `<option value="${race.id}">${race.name} (${formatDate(race.start_time)})</option>`;
        });
        select.innerHTML = html;
    });
}

async function deleteRace(raceId) {
    if (!confirm('Are you sure? This will delete the race and all associated data.')) return;
    
    try {
        const { error } = await supabase
            .from('races')
            .delete()
            .eq('id', raceId);
        
        if (error) throw error;
        
        showSuccess('Race deleted successfully');
        loadRaces();
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to delete race: ${error.message}`);
    }
}

// ==========================================
// Boat Management
// ==========================================

document.getElementById('boat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const raceId = document.getElementById('boat-race-select').value;
    const boatNumber = document.getElementById('boat-number').value;
    const boatName = document.getElementById('boat-name').value;
    const teamName = document.getElementById('boat-team').value;
    const colorCode = document.getElementById('boat-color').value;
    const latitude = parseFloat(document.getElementById('boat-latitude').value) || null;
    const longitude = parseFloat(document.getElementById('boat-longitude').value) || null;
    
    if (!raceId) {
        showError('Please select a race');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('boats')
            .insert([{
                race_id: raceId,
                boat_number: boatNumber,
                boat_name: boatName,
                team_name: teamName,
                color_code: colorCode,
                latitude: latitude,
                longitude: longitude
            }]);
        
        if (error) throw error;
        
        showSuccess(`Boat "${boatName}" added successfully!`);
        document.getElementById('boat-form').reset();
        loadBoatsByRace(raceId);
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to add boat: ${error.message}`);
    }
});

document.getElementById('manage-race-select')?.addEventListener('change', (e) => {
    if (e.target.value) {
        loadBoatsByRace(e.target.value);
    }
});

async function loadBoatsByRace(raceId) {
    try {
        const boats = await fetchBoatsForRace(raceId);
        
        const container = document.getElementById('boats-list');
        
        if (boats.length === 0) {
            container.innerHTML = '<p class="loading">No boats in this race</p>';
            return;
        }
        
        let html = '';
        boats.forEach((boat, index) => {
            html += `
                <div class="boat-item">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <div class="color-preview" style="background: ${boat.color_code}"></div>
                        <div class="boat-item-info">
                            <h3>#${boat.boat_number} - ${boat.boat_name}</h3>
                            <p><strong>Team:</strong> ${boat.team_name || 'N/A'}</p>
                            <p><strong>Position:</strong> ${boat.latitude ? boat.latitude.toFixed(4) : 'N/A'}, ${boat.longitude ? boat.longitude.toFixed(4) : 'N/A'}</p>
                            <p><strong>Speed:</strong> ${boat.current_speed || 0} knots | <strong>Heading:</strong> ${boat.current_heading || 0}°</p>
                        </div>
                    </div>
                    <div class="boat-item-actions">
                        <button class="btn-edit" onclick="editBoat('${boat.id}')">Edit</button>
                        <button class="btn-edit btn-danger" onclick="deleteBoat('${boat.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteBoat(boatId) {
    if (!confirm('Delete this boat?')) return;
    
    try {
        const { error } = await supabase
            .from('boats')
            .delete()
            .eq('id', boatId);
        
        if (error) throw error;
        
        showSuccess('Boat deleted');
        const raceSelect = document.getElementById('manage-race-select');
        if (raceSelect.value) loadBoatsByRace(raceSelect.value);
    } catch (error) {
        showError(`Failed to delete boat: ${error.message}`);
    }
}

// ==========================================
// Checkpoint Management
// ==========================================

document.getElementById('checkpoint-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const raceId = document.getElementById('checkpoint-race-select').value;
    const checkpointNumber = parseInt(document.getElementById('checkpoint-number').value);
    const checkpointName = document.getElementById('checkpoint-name').value;
    const latitude = parseFloat(document.getElementById('checkpoint-latitude').value);
    const longitude = parseFloat(document.getElementById('checkpoint-longitude').value);
    
    if (!raceId) {
        showError('Please select a race');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('checkpoints')
            .insert([{
                race_id: raceId,
                checkpoint_number: checkpointNumber,
                checkpoint_name: checkpointName,
                latitude: latitude,
                longitude: longitude
            }]);
        
        if (error) throw error;
        
        showSuccess('Checkpoint added!');
        document.getElementById('checkpoint-form').reset();
        loadCheckpointsByRace(raceId);
    } catch (error) {
        showError(`Failed to add checkpoint: ${error.message}`);
    }
});

document.getElementById('checkpoint-view-race')?.addEventListener('change', (e) => {
    if (e.target.value) {
        loadCheckpointsByRace(e.target.value);
    }
});

async function loadCheckpointsByRace(raceId) {
    try {
        const checkpoints = await fetchCheckpoints(raceId);
        
        const container = document.getElementById('checkpoints-list');
        
        if (checkpoints.length === 0) {
            container.innerHTML = '<p class="loading">No checkpoints for this race</p>';
            return;
        }
        
        let html = '';
        checkpoints.forEach(cp => {
            html += `
                <div class="checkpoint-item">
                    <div class="checkpoint-item-info">
                        <h3>CP ${cp.checkpoint_number} - ${cp.checkpoint_name || 'Unnamed'}</h3>
                        <p><strong>Location:</strong> ${cp.latitude.toFixed(4)}, ${cp.longitude.toFixed(4)}</p>
                    </div>
                    <div class="checkpoint-item-actions">
                        <button class="btn-edit btn-danger" onclick="deleteCheckpoint('${cp.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteCheckpoint(checkpointId) {
    if (!confirm('Delete this checkpoint?')) return;
    
    try {
        const { error } = await supabase
            .from('checkpoints')
            .delete()
            .eq('id', checkpointId);
        
        if (error) throw error;
        
        showSuccess('Checkpoint deleted');
        const raceSelect = document.getElementById('checkpoint-view-race');
        if (raceSelect.value) loadCheckpointsByRace(raceSelect.value);
    } catch (error) {
        showError(`Failed to delete checkpoint: ${error.message}`);
    }
}

// ==========================================
// Test Data Generation
// ==========================================

document.getElementById('test-data-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const raceId = document.getElementById('test-race-select').value;
    const boatCount = parseInt(document.getElementById('test-boat-count').value);
    const positionCount = parseInt(document.getElementById('test-position-count').value);
    
    if (!raceId) {
        showError('Please select a race');
        return;
    }
    
    showSpinner();
    
    try {
        // Create test boats
        const boats = [];
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#FFD700', '#FF69B4', '#00CED1'];
        
        for (let i = 0; i < boatCount; i++) {
            const { data, error } = await supabase
                .from('boats')
                .insert([{
                    race_id: raceId,
                    boat_number: String(i + 1),
                    boat_name: `Test Boat ${i + 1}`,
                    team_name: `Test Team ${Math.floor(i / 2) + 1}`,
                    color_code: colors[i % colors.length],
                    latitude: 1.2345 + (Math.random() * 0.01),
                    longitude: 103.8677 + (Math.random() * 0.01)
                }])
                .select();
            
            if (error) throw error;
            boats.push(data[0]);
        }
        
        // Create GPS history for each boat
        const gpsData = [];
        boats.forEach(boat => {
            let lat = boat.latitude;
            let lon = boat.longitude;
            
            for (let i = 0; i < positionCount; i++) {
                // Simulate boat movement
                lat += (Math.random() - 0.5) * 0.0005;
                lon += (Math.random() - 0.5) * 0.0005;
                
                gpsData.push({
                    boat_id: boat.id,
                    race_id: raceId,
                    latitude: lat,
                    longitude: lon,
                    speed: Math.random() * 15,
                    heading: Math.random() * 360,
                    timestamp: new Date(Date.now() - (positionCount - i) * 5000).toISOString()
                });
            }
        });
        
        // Insert GPS data in chunks
        const chunkSize = 100;
        for (let i = 0; i < gpsData.length; i += chunkSize) {
            const chunk = gpsData.slice(i, i + chunkSize);
            const { error } = await supabase
                .from('gps_positions')
                .insert(chunk);
            
            if (error) throw error;
        }
        
        hideSpinner();
        showSuccess(`Generated ${boatCount} boats with ${positionCount} positions each!`);
        document.getElementById('test-data-form').reset();
        loadRaces();
    } catch (error) {
        hideSpinner();
        showError(`Failed to generate test data: ${error.message}`);
    }
});

// ==========================================
// Database Utilities
// ==========================================

document.getElementById('stats-btn')?.addEventListener('click', showStatistics);

async function showStatistics() {
    showSpinner();
    
    try {
        // Get counts
        const races = await fetchRaces();
        const { count: boatCount } = await supabase
            .from('boats')
            .select('*', { count: 'exact' });
        
        const { count: gpsCount } = await supabase
            .from('gps_positions')
            .select('*', { count: 'exact' });
        
        const { count: checkpointCount } = await supabase
            .from('checkpoints')
            .select('*', { count: 'exact' });
        
        hideSpinner();
        
        const modal = document.getElementById('stats-modal');
        const content = document.getElementById('stats-content');
        
        content.innerHTML = `
            <div class="stats-content">
                <div class="stat-card">
                    <div class="stat-label">Total Races</div>
                    <div class="stat-value">${races.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Boats</div>
                    <div class="stat-value">${boatCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">GPS Positions</div>
                    <div class="stat-value">${gpsCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Checkpoints</div>
                    <div class="stat-value">${checkpointCount}</div>
                </div>
            </div>
            <p style="margin-top: 20px; color: var(--text-secondary); font-size: 0.9rem;">
                Database size: ~${((gpsCount * 150) / (1024 * 1024)).toFixed(2)} MB
            </p>
        `;
        
        modal.classList.add('show');
    } catch (error) {
        hideSpinner();
        showError(`Failed to load statistics: ${error.message}`);
    }
}

document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('stats-modal').classList.remove('show');
});

document.getElementById('clear-gps-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete ALL GPS history? This cannot be undone!')) return;
    
    showSpinner();
    
    try {
        const { error } = await supabase
            .from('gps_positions')
            .delete()
            .neq('id', null); // Delete all rows
        
        if (error) throw error;
        
        hideSpinner();
        showSuccess('GPS history cleared');
    } catch (error) {
        hideSpinner();
        showError(`Failed to clear GPS history: ${error.message}`);
    }
});

// ==========================================
// CSV Import
// ==========================================

document.getElementById('import-gps-btn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('gps-csv-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a CSV file');
        return;
    }
    
    const statusDiv = document.getElementById('import-status');
    statusDiv.classList.add('show', 'loading');
    statusDiv.textContent = 'Processing CSV...';
    
    try {
        const text = await file.text();
        const lines = text.split('\n');
        const data = [];
        
        // Parse CSV
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            if (values.length < 5) continue;
            
            data.push({
                boat_id: values[0].trim(),
                latitude: parseFloat(values[1]),
                longitude: parseFloat(values[2]),
                speed: parseFloat(values[3]),
                heading: parseFloat(values[4]),
                timestamp: values[5]?.trim() || new Date().toISOString()
            });
        }
        
        if (data.length === 0) {
            throw new Error('No valid data in CSV');
        }
        
        // Insert data
        const chunkSize = 100;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const { error } = await supabase
                .from('gps_positions')
                .insert(chunk);
            
            if (error) throw error;
        }
        
        statusDiv.classList.remove('loading');
        statusDiv.classList.add('success');
        statusDiv.textContent = `✓ Successfully imported ${data.length} GPS positions`;
        fileInput.value = '';
    } catch (error) {
        statusDiv.classList.remove('loading');
        statusDiv.classList.add('error');
        statusDiv.textContent = `✗ Error: ${error.message}`;
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
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadRaces();
});