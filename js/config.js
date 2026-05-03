/* ==========================================
   OCEANIC ORDER - Supabase Configuration
   ========================================== */

// ⚠️ IMPORTANT: Replace these with your actual Supabase credentials
// Get these from your Supabase Project Settings > API

const SUPABASE_URL = 'https://culfnzuhcdhfmsupjsnl.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_rMzWaFCUEFJ1Oa8fKYx0AA_219eTB48';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// Database Functions
// ==========================================

/**
 * Fetch all races
 */
async function fetchRaces() {
    try {
        const { data, error } = await supabase
            .from('races')
            .select('*')
            .order('start_time', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching races:', error);
        showError('Failed to fetch races');
        return [];
    }
}

/**
 * Fetch boats for a specific race
 */
async function fetchBoatsForRace(raceId) {
    try {
        const { data, error } = await supabase
            .from('boats')
            .select('*')
            .eq('race_id', raceId)
            .order('rank', { ascending: true });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching boats:', error);
        showError('Failed to fetch boats');
        return [];
    }
}

/**
 * Fetch GPS position history for a boat
 */
async function fetchGPSHistory(boatId, limit = 1000) {
    try {
        const { data, error } = await supabase
            .from('gps_positions')
            .select('*')
            .eq('boat_id', boatId)
            .order('timestamp', { ascending: true })
            .limit(limit);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching GPS history:', error);
        showError('Failed to fetch GPS history');
        return [];
    }
}

/**
 * Fetch checkpoints for a race
 */
async function fetchCheckpoints(raceId) {
    try {
        const { data, error } = await supabase
            .from('checkpoints')
            .select('*')
            .eq('race_id', raceId)
            .order('checkpoint_number', { ascending: true });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching checkpoints:', error);
        return [];
    }
}

/**
 * Fetch race results
 */
async function fetchRaceResults(raceId) {
    try {
        const { data, error } = await supabase
            .from('race_results')
            .select('*, boats(boat_name, boat_number, team_name)')
            .eq('race_id', raceId)
            .order('finish_position', { ascending: true });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching race results:', error);
        showError('Failed to fetch race results');
        return [];
    }
}

/**
 * Update boat position (for admin/hardware integration)
 */
async function updateBoatPosition(boatId, raceId, latitude, longitude, speed, heading) {
    try {
        // Update boats table
        const { error: updateError } = await supabase
            .from('boats')
            .update({
                latitude,
                longitude,
                current_speed: speed,
                current_heading: heading,
                updated_at: new Date().toISOString()
            })
            .eq('id', boatId);
        
        if (updateError) throw updateError;

        // Insert GPS position history
        const { error: insertError } = await supabase
            .from('gps_positions')
            .insert([{
                boat_id: boatId,
                race_id: raceId,
                latitude,
                longitude,
                speed,
                heading,
                timestamp: new Date().toISOString()
            }]);
        
        if (insertError) throw insertError;

        return true;
    } catch (error) {
        console.error('Error updating boat position:', error);
        return false;
    }
}

/**
 * Update race status
 */
async function updateRaceStatus(raceId, status) {
    try {
        const { error } = await supabase
            .from('races')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', raceId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating race status:', error);
        return false;
    }
}

/**
 * Get single boat details
 */
async function fetchBoatDetails(boatId) {
    try {
        const { data, error } = await supabase
            .from('boats')
            .select('*')
            .eq('id', boatId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching boat details:', error);
        return null;
    }
}

/**
 * Subscribe to real-time boat updates
 */
function subscribeToBoatUpdates(raceId, callback) {
    return supabase
        .channel(`boats:race_id=eq.${raceId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'boats',
                filter: `race_id=eq.${raceId}`
            },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();
}

/**
 * Subscribe to real-time GPS position updates
 */
function subscribeToGPSUpdates(raceId, callback) {
    return supabase
        .channel(`gps:race_id=eq.${raceId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'gps_positions',
                filter: `race_id=eq.${raceId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
}

/* ==========================================
   Helper Functions
   ========================================== */

/**
 * Show error toast
 */
function showError(message) {
    const errorToast = document.getElementById('error-toast');
    if (errorToast) {
        errorToast.textContent = message;
        errorToast.classList.add('show');
        setTimeout(() => {
            errorToast.classList.remove('show');
        }, 4000);
    }
}

/**
 * Show success toast
 */
function showSuccess(message) {
    const successToast = document.getElementById('success-toast');
    if (successToast) {
        successToast.textContent = message;
        successToast.classList.add('show');
        setTimeout(() => {
            successToast.classList.remove('show');
        }, 4000);
    }
}

/**
 * Show loading spinner
 */
function showSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.add('show');
}

/**
 * Hide loading spinner
 */
function hideSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.remove('show');
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
    });
}

/**
 * Calculate distance between two coordinates (in meters)
 * Uses Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * Convert time interval to formatted string
 */
function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Validate coordinates
 */
function isValidCoordinate(lat, lon) {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Generate random boat position (for testing)
 */
function generateRandomPosition(centerLat, centerLon, radius = 0.01) {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.random() * radius;
    const newLat = centerLat + r * Math.cos(angle);
    const newLon = centerLon + r * Math.sin(angle);
    return { lat: newLat, lon: newLon };
}