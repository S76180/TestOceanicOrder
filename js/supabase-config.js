/* ============================================
   OCEANIC ORDER - Supabase Configuration
   ============================================
   
   Replace the placeholder values below with your
   actual Supabase project URL and anon key.
   See GUIDE.md for setup instructions.
   ============================================ */

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Demo mode flag — set to false once Supabase is configured
const DEMO_MODE = true;

let supabaseClient = null;

function initSupabase() {
  if (SUPABASE_URL.includes('YOUR_PROJECT_ID') || DEMO_MODE) {
    console.log('[OCEANIC ORDER] Running in DEMO mode — using simulated data.');
    console.log('[OCEANIC ORDER] To connect to Supabase, update js/supabase-config.js');
    return null;
  }

  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[OCEANIC ORDER] Supabase connected.');
    return supabaseClient;
  }

  console.warn('[OCEANIC ORDER] Supabase JS library not loaded.');
  return null;
}

// ============================================
// DEMO DATA — used when DEMO_MODE is true
// ============================================

const DEMO_BOATS = [
  { id: 1, name: 'Sea Wolf',      sail_number: 'OO-01', skipper: 'James Carter',    color: '#e74c3c', country: 'USA' },
  { id: 2, name: 'Ocean Breeze',   sail_number: 'OO-02', skipper: 'Elena Rodriguez', color: '#3498db', country: 'ESP' },
  { id: 3, name: 'Storm Chaser',   sail_number: 'OO-03', skipper: 'Akira Tanaka',    color: '#2ecc71', country: 'JPN' },
  { id: 4, name: 'Wind Rider',     sail_number: 'OO-04', skipper: 'Sophie Müller',   color: '#f39c12', country: 'GER' },
  { id: 5, name: 'Blue Horizon',   sail_number: 'OO-05', skipper: 'Liam O\'Brien',   color: '#9b59b6', country: 'IRL' },
  { id: 6, name: 'Neptune\'s Call', sail_number: 'OO-06', skipper: 'Ana Silva',       color: '#1abc9c', country: 'BRA' },
];

const DEMO_RACES = [
  {
    id: 1,
    name: 'Oceanic Order Grand Prix — Race 1',
    status: 'live',
    start_time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    course: 'Windward-Leeward',
    distance_nm: 12.5,
    wind_speed: 14,
    wind_direction: 225,
    location: 'Port Marina Bay',
  },
  {
    id: 2,
    name: 'Coastal Challenge — Heat 3',
    status: 'completed',
    start_time: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    course: 'Triangle',
    distance_nm: 8.2,
    wind_speed: 11,
    wind_direction: 180,
    location: 'Port Marina Bay',
  },
  {
    id: 3,
    name: 'Harbor Sprint Series — Final',
    status: 'completed',
    start_time: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() - 93 * 3600 * 1000).toISOString(),
    course: 'Windward-Leeward',
    distance_nm: 6.0,
    wind_speed: 18,
    wind_direction: 270,
    location: 'Outer Harbor',
  },
  {
    id: 4,
    name: 'Oceanic Order Grand Prix — Race 2',
    status: 'upcoming',
    start_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    course: 'Windward-Leeward',
    distance_nm: 12.5,
    wind_speed: null,
    wind_direction: null,
    location: 'Port Marina Bay',
  },
];

// Generate demo track data: a sinusoidal path for each boat around a center point
function generateDemoTrack(boatIndex, totalPoints) {
  const centerLat = 1.27;
  const centerLng = 103.85;
  const points = [];
  const baseAngle = (boatIndex * 60) * (Math.PI / 180);
  const radius = 0.015 + (boatIndex * 0.002);

  for (let i = 0; i < totalPoints; i++) {
    const t = i / totalPoints;
    const angle = baseAngle + t * Math.PI * 2.5;
    const wobble = Math.sin(t * 12 + boatIndex) * 0.003;
    const lat = centerLat + Math.cos(angle) * (radius + wobble);
    const lng = centerLng + Math.sin(angle) * (radius + wobble * 1.5);
    const speed = 5 + Math.sin(t * 8 + boatIndex) * 3 + Math.random() * 1.5;
    const heading = ((angle * 180 / Math.PI) + 90) % 360;

    points.push({
      lat: lat,
      lng: lng,
      speed: speed,
      heading: heading,
      timestamp: new Date(Date.now() - (totalPoints - i) * 30000).toISOString(),
    });
  }

  return points;
}

// Generate current positions for demo
function getDemoPositions() {
  return DEMO_BOATS.map((boat, i) => {
    const track = generateDemoTrack(i, 100);
    const latest = track[track.length - 1];
    return {
      ...boat,
      lat: latest.lat,
      lng: latest.lng,
      speed: latest.speed,
      heading: latest.heading,
      last_update: latest.timestamp,
      rank: i + 1,
    };
  });
}

// Completed race results
const DEMO_RESULTS = {
  2: [
    { boat_id: 3, boat_name: 'Storm Chaser',  finish_time: '3h 42m 18s', rank: 1 },
    { boat_id: 1, boat_name: 'Sea Wolf',       finish_time: '3h 44m 05s', rank: 2 },
    { boat_id: 6, boat_name: 'Neptune\'s Call', finish_time: '3h 48m 33s', rank: 3 },
    { boat_id: 2, boat_name: 'Ocean Breeze',   finish_time: '3h 51m 12s', rank: 4 },
    { boat_id: 4, boat_name: 'Wind Rider',     finish_time: '3h 55m 41s', rank: 5 },
    { boat_id: 5, boat_name: 'Blue Horizon',   finish_time: '4h 02m 09s', rank: 6 },
  ],
  3: [
    { boat_id: 1, boat_name: 'Sea Wolf',       finish_time: '2h 58m 45s', rank: 1 },
    { boat_id: 2, boat_name: 'Ocean Breeze',   finish_time: '3h 01m 22s', rank: 2 },
    { boat_id: 5, boat_name: 'Blue Horizon',   finish_time: '3h 05m 10s', rank: 3 },
    { boat_id: 3, boat_name: 'Storm Chaser',   finish_time: '3h 07m 38s', rank: 4 },
    { boat_id: 6, boat_name: 'Neptune\'s Call', finish_time: '3h 12m 55s', rank: 5 },
    { boat_id: 4, boat_name: 'Wind Rider',     finish_time: '3h 18m 03s', rank: 6 },
  ],
};
