/* ==========================================
   OCEANIC ORDER - Standings Page Logic
   ========================================== */

let currentSelectedRaceId = null;

// ==========================================
// Initialization
// ==========================================

async function initializeStandingsPage() {
    showSpinner();
    try {
        const races = await fetchRaces();
        
        if (races.length === 0) {
            showError('No races found');
            hideSpinner();
            return;
        }

        populateRaceDropdown(races);
        
        // Load first race by default
        currentSelectedRaceId = races[0].id;
        await loadStandings(races[0].id);
        await loadStats();

        hideSpinner();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize standings page');
        hideSpinner();
    }
}

// ==========================================
// Race Dropdown
// ==========================================

function populateRaceDropdown(races) {
    const select = document.getElementById('race-select');
    
    let html = '';
    races.forEach(race => {
        html += `<option value="${race.id}">${race.name} - ${formatDate(race.start_time)}</option>`;
    });

    select.innerHTML = html;

    // Event listener
    select.addEventListener('change', async (e) => {
        currentSelectedRaceId = e.target.value;
        showSpinner();
        await loadStandings(currentSelectedRaceId);
        hideSpinner();
    });
}

// ==========================================
// Load Standings
// ==========================================

async function loadStandings(raceId) {
    try {
        const results = await fetchRaceResults(raceId);
        
        const tbody = document.getElementById('standings-body');
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No results for this race</td></tr>';
            return;
        }

        let html = '';
        results.forEach((result, index) => {
            const boat = result.boats;
            const finishTime = result.finish_time ? formatTime(result.finish_time) : 'N/A';
            const avgSpeed = result.speed_average ? result.speed_average.toFixed(2) : '0.00';
            const distance = result.total_distance ? (result.total_distance / 1000).toFixed(2) : '0.00';

            html += `
                <tr>
                    <td style="font-weight: bold; font-size: 1.1rem;">${result.finish_position}</td>
                    <td style="font-weight: 600;">${boat.boat_name}</td>
                    <td>${boat.boat_number}</td>
                    <td>${boat.team_name}</td>
                    <td>${finishTime}</td>
                    <td style="text-align: right;">${distance}</td>
                    <td style="text-align: right;">${avgSpeed}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Update leader speed stat
        if (results[0]) {
            document.getElementById('leader-speed').textContent = 
                (results[0].speed_average || 0).toFixed(2) + ' knots';
        }

    } catch (error) {
        console.error('Error loading standings:', error);
        showError('Failed to load standings');
    }
}

// ==========================================
// Load Statistics
// ==========================================

async function loadStats() {
    try {
        const races = await fetchRaces();
        
        // Total races
        document.getElementById('total-races').textContent = races.length;

        // Active boats
        const boats = await fetchBoatsForRace(currentSelectedRaceId);
        document.getElementById('active-boats-count').textContent = boats.length;

        // Calculate average race duration and avg speed
        const results = await fetchRaceResults(currentSelectedRaceId);
        
        if (results.length > 0) {
            // Calculate average speed
            const avgSpeeds = results
                .filter(r => r.speed_average)
                .map(r => r.speed_average);
            
            const avgSpeed = avgSpeeds.length > 0 
                ? (avgSpeeds.reduce((a, b) => a + b) / avgSpeeds.length).toFixed(2)
                : '0.00';

            document.getElementById('leader-speed').textContent = avgSpeed + ' knots';

            // Calculate average race duration
            const durations = results
                .filter(r => r.total_time)
                .map(r => {
                    // Parse PostgreSQL interval format
                    const interval = r.total_time;
                    if (typeof interval === 'string') {
                        const parts = interval.split(':');
                        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                    }
                    return 0;
                });

            if (durations.length > 0) {
                const avgDuration = Math.floor(durations.reduce((a, b) => a + b) / durations.length);
                document.getElementById('avg-duration').textContent = formatDuration(avgDuration * 1000);
            }
        }

    } catch (error) {
        console.error('Error loading stats:', error);
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
    initializeStandingsPage();
});