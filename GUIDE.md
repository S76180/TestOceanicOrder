# OCEANIC ORDER — Complete Setup Guide

> A real-time regatta (sailing competition) tracking system with live GPS positions, colored track trails, race replay, and full Supabase integration.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Step 1 — Setting Up VS Code](#step-1--setting-up-vs-code)
5. [Step 2 — Running Locally](#step-2--running-locally)
6. [Step 3 — Setting Up Supabase](#step-3--setting-up-supabase)
7. [Step 4 — Connecting Supabase to the Website](#step-4--connecting-supabase-to-the-website)
8. [Step 5 — Hardware Setup (GPS Trackers)](#step-5--hardware-setup-gps-trackers)
9. [Step 6 — Arduino Code for GPS Tracker](#step-6--arduino-code-for-gps-tracker)
10. [Step 7 — Deploying the Website](#step-7--deploying-the-website)
11. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview

**OCEANIC ORDER** is a web-based regatta tracking system that:

- Displays live boat positions on an interactive map
- Shows each boat's GPS track as a colored line
- Updates in real-time via Supabase WebSocket
- Stores race history for replay
- Works on desktop and mobile

The system has three parts:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  GPS Tracker │────▶│   Supabase   │◀───▶│   Website    │
│  (on boat)   │     │  (database)  │     │  (browser)   │
└─────────────┘     └──────────────┘     └──────────────┘
     ESP32 +             PostgreSQL         HTML/CSS/JS
     NEO-6M GPS          + Realtime         + Leaflet.js
     + SIM800L
```

---

## 2. Prerequisites

| Tool | Purpose | Download |
|------|---------|----------|
| **VS Code** | Code editor | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Google Chrome** | Testing | [google.com/chrome](https://www.google.com/chrome/) |
| **Git** | Version control | [git-scm.com](https://git-scm.com/) |
| **Node.js** (optional) | Local server | [nodejs.org](https://nodejs.org/) |
| **Supabase account** | Database | [supabase.com](https://supabase.com/) (free tier available) |
| **Arduino IDE** | Hardware programming | [arduino.cc/en/software](https://www.arduino.cc/en/software) |

---

## 3. Project Structure

```
oceanic-order/
├── index.html            ← Dashboard / Home page
├── live-race.html        ← Live race tracking with map
├── history.html          ← Race history & replay
├── about.html            ← About page
├── css/
│   ├── shared.css        ← Common styles (nav, footer, grid, cards)
│   ├── dashboard.css     ← Dashboard-specific styles
│   ├── live-race.css     ← Live race page styles
│   ├── history.css       ← History page styles
│   └── about.css         ← About page styles
├── js/
│   ├── shared.js         ← Navigation, footer, utility functions
│   ├── supabase-config.js← Supabase connection + demo data
│   ├── dashboard.js      ← Dashboard logic
│   ├── live-race.js      ← Map, markers, tracks, simulation
│   └── history.js        ← History cards, replay player
└── GUIDE.md              ← This file
```

---

## Step 1 — Setting Up VS Code

### 1.1 Install VS Code
Download and install from [code.visualstudio.com](https://code.visualstudio.com/).

### 1.2 Install Recommended Extensions
Open VS Code and install these extensions (Ctrl+Shift+X):

| Extension | Purpose |
|-----------|---------|
| **Live Server** (by Ritwick Dey) | Auto-refresh local dev server |
| **Prettier** | Code formatting |
| **HTML CSS Support** | Autocomplete for CSS classes |
| **JavaScript (ES6) code snippets** | Useful JS snippets |

### 1.3 Open the Project
1. Download or clone this project
2. In VS Code: **File → Open Folder** → select the `oceanic-order` folder
3. You should see all the files in the sidebar

### 1.4 Start the Local Server
1. Right-click on `index.html` in VS Code
2. Select **"Open with Live Server"**
3. Your browser will open at `http://127.0.0.1:5500/`
4. The site will auto-refresh when you save changes

> **Alternative:** If you have Node.js, run `npx serve .` in the terminal.

---

## Step 2 — Running Locally

The project runs in **Demo Mode** by default — no database needed. You'll see:
- 6 simulated boats with colored tracks
- A live race with ticking elapsed time
- Race history with past results
- Working replay player

### What You Can Do in Demo Mode
- Navigate all pages (Dashboard, Live Race, History, About)
- Click boats on the map to see details
- Click "Simulate" to watch boats move in real-time
- Toggle track lines on/off
- Open past races and watch replays
- Filter and sort race history

---

## Step 3 — Setting Up Supabase

When you're ready to use real data:

### 3.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and sign up (free)
2. Click **"New Project"**
3. Name it `oceanic-order`
4. Set a database password (save it somewhere safe!)
5. Choose the region closest to your race location
6. Click **"Create new project"** and wait ~2 minutes

### 3.2 Create Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Paste and run the following SQL:

```sql
-- ============================================
-- OCEANIC ORDER — Database Schema
-- ============================================

-- Boats table
CREATE TABLE boats (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sail_number TEXT UNIQUE NOT NULL,
  skipper TEXT NOT NULL,
  country TEXT DEFAULT '',
  color TEXT DEFAULT '#3498db',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Races table
CREATE TABLE races (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  course TEXT DEFAULT '',
  distance_nm DECIMAL(6,2),
  wind_speed DECIMAL(5,1),
  wind_direction INTEGER,
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boat positions (GPS data) table
CREATE TABLE boat_positions (
  id SERIAL PRIMARY KEY,
  boat_id INTEGER REFERENCES boats(id) ON DELETE CASCADE,
  race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DECIMAL(6,2) DEFAULT 0,
  heading DECIMAL(5,1) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Race results table
CREATE TABLE race_results (
  id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
  boat_id INTEGER REFERENCES boats(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  finish_time TEXT,
  UNIQUE(race_id, boat_id)
);

-- Create indexes for fast queries
CREATE INDEX idx_positions_boat ON boat_positions(boat_id);
CREATE INDEX idx_positions_race ON boat_positions(race_id);
CREATE INDEX idx_positions_timestamp ON boat_positions(timestamp);
CREATE INDEX idx_results_race ON race_results(race_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view races)
CREATE POLICY "Public read boats" ON boats FOR SELECT USING (true);
CREATE POLICY "Public read races" ON races FOR SELECT USING (true);
CREATE POLICY "Public read positions" ON boat_positions FOR SELECT USING (true);
CREATE POLICY "Public read results" ON race_results FOR SELECT USING (true);

-- Insert policy for GPS trackers (using anon key or service key)
CREATE POLICY "GPS insert positions" ON boat_positions FOR INSERT WITH CHECK (true);

-- ============================================
-- Enable Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE boat_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE races;
```

4. Click **"Run"** — all tables will be created

### 3.3 Add Sample Data (Optional)
Run this SQL to add test boats:

```sql
INSERT INTO boats (name, sail_number, skipper, country, color) VALUES
  ('Sea Wolf',       'OO-01', 'James Carter',    'USA', '#e74c3c'),
  ('Ocean Breeze',   'OO-02', 'Elena Rodriguez', 'ESP', '#3498db'),
  ('Storm Chaser',   'OO-03', 'Akira Tanaka',    'JPN', '#2ecc71'),
  ('Wind Rider',     'OO-04', 'Sophie Müller',   'GER', '#f39c12'),
  ('Blue Horizon',   'OO-05', 'Liam O''Brien',   'IRL', '#9b59b6'),
  ('Neptune''s Call', 'OO-06', 'Ana Silva',       'BRA', '#1abc9c');
```

### 3.4 Get Your API Keys
1. Go to **Settings → API** in Supabase dashboard
2. Copy these two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

---

## Step 4 — Connecting Supabase to the Website

### 4.1 Add the Supabase JS Library
Add this `<script>` tag to the `<head>` of each HTML file (index.html, live-race.html, history.html), just before the shared.js script:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 4.2 Update Configuration
Open `js/supabase-config.js` and update these values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';   // ← your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';          // ← your key
const DEMO_MODE = false;                                        // ← set to false
```

### 4.3 Test the Connection
1. Save the file
2. Open the browser console (F12 → Console)
3. You should see: `[OCEANIC ORDER] Supabase connected.`
4. If you added sample data, boats and races will appear from your database

---

## Step 5 — Hardware Setup (GPS Trackers)

To track real boats, each vessel needs a GPS tracker that sends coordinates to Supabase.

### 5.1 Components Needed (Per Boat)

| Component | Model | Approx. Cost | Purpose |
|-----------|-------|-------------|---------|
| Microcontroller | **ESP32 DevKit** | $5–10 | Main brain, WiFi capable |
| GPS Module | **NEO-6M** (u-blox) | $3–8 | Reads lat/lng/speed |
| Cellular Module | **SIM800L** | $5–10 | Sends data via 4G/GSM |
| SIM Card | Any prepaid data SIM | $5–10/mo | Cellular data connection |
| Antenna | GPS + GSM antennas | $2–5 | Better signal reception |
| Battery | 18650 Li-ion + holder | $3–8 | Power supply |
| Waterproof case | IP67 junction box | $3–5 | Protect from water |
| Wires | Dupont jumper wires | $2 | Connections |

**Total per tracker: ~$30–60**

### 5.2 Wiring Diagram

```
                    ┌──────────────┐
                    │    ESP32     │
                    │              │
   NEO-6M GPS      │   GPIO 16 ◄──┤── GPS TX
   ─────────       │   GPIO 17 ──►┤── GPS RX
   VCC ──────────► │   3.3V       │
   GND ──────────► │   GND        │
                    │              │
   SIM800L GSM     │   GPIO 26 ◄──┤── GSM TX
   ──────────      │   GPIO 27 ──►┤── GSM RX
   VCC ──────────► │   5V (Vin)   │
   GND ──────────► │   GND        │
                    │              │
   Battery ──────► │   Vin / USB  │
                    └──────────────┘
```

### 5.3 Physical Assembly Steps

1. **Mount the ESP32** in the center of the waterproof case
2. **Connect NEO-6M GPS module:**
   - VCC → ESP32 3.3V
   - GND → ESP32 GND
   - TX → ESP32 GPIO 16 (RX2)
   - RX → ESP32 GPIO 17 (TX2)
3. **Connect SIM800L GSM module:**
   - VCC → ESP32 5V (needs 3.7–4.2V, use voltage regulator if needed)
   - GND → ESP32 GND
   - TX → ESP32 GPIO 26
   - RX → ESP32 GPIO 27
4. **Insert SIM card** into SIM800L (data plan required)
5. **Attach antennas** — GPS antenna on top of case (sky-facing), GSM antenna inside
6. **Connect battery** via the ESP32 Vin pin or USB
7. **Seal the waterproof case** — use silicone sealant around cable entry points

> **Alternative (WiFi only):** If racing near shore with WiFi, you can skip the SIM800L module entirely and use the ESP32's built-in WiFi. This simplifies wiring and reduces cost.

---

## Step 6 — Arduino Code for GPS Tracker

### 6.1 Install Arduino IDE
Download from [arduino.cc/en/software](https://www.arduino.cc/en/software).

### 6.2 Add ESP32 Board Support
1. Open Arduino IDE → **File → Preferences**
2. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**
4. Search "ESP32" and install **"esp32 by Espressif Systems"**

### 6.3 Install Libraries
Go to **Sketch → Include Library → Manage Libraries**, then install:
- **TinyGPSPlus** (by Mikal Hart)
- **ArduinoJson** (by Benoit Blanchon)
- **HTTPClient** (built-in with ESP32)

### 6.4 Upload This Code

Create a new sketch and paste:

```cpp
/*
 * OCEANIC ORDER — GPS Tracker for ESP32 + NEO-6M
 * 
 * Reads GPS position and sends to Supabase every 5 seconds.
 * Uses WiFi (for near-shore races) or can be adapted for GSM.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
// WiFi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase credentials
const char* SUPABASE_URL  = "https://YOUR_PROJECT_ID.supabase.co";
const char* SUPABASE_KEY  = "YOUR_SUPABASE_ANON_KEY";

// Boat and race identifiers
const int BOAT_ID = 1;  // Match the boat ID in your database
const int RACE_ID = 1;  // Match the active race ID

// Update interval (milliseconds)
const int UPDATE_INTERVAL = 5000;  // 5 seconds

// GPS Serial pins
#define GPS_RX 16
#define GPS_TX 17
// ===========================

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  Serial.println("[OCEANIC ORDER] GPS Tracker Starting...");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  // Feed GPS data
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Send position at interval
  if (millis() - lastUpdate >= UPDATE_INTERVAL) {
    lastUpdate = millis();

    if (gps.location.isValid()) {
      double lat = gps.location.lat();
      double lng = gps.location.lng();
      double speed = gps.speed.knots();
      double heading = gps.course.deg();

      Serial.printf("[GPS] Lat: %.6f, Lng: %.6f, Speed: %.1f kn, Heading: %.0f°\n",
                    lat, lng, speed, heading);

      sendToSupabase(lat, lng, speed, heading);
    } else {
      Serial.println("[GPS] Waiting for valid fix...");
    }
  }
}

void sendToSupabase(double lat, double lng, double speed, double heading) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Not connected, skipping...");
    return;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/boat_positions";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Prefer", "return=minimal");

  // Build JSON payload
  JsonDocument doc;
  doc["boat_id"] = BOAT_ID;
  doc["race_id"] = RACE_ID;
  doc["lat"] = lat;
  doc["lng"] = lng;
  doc["speed"] = speed;
  doc["heading"] = heading;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  if (httpCode == 201) {
    Serial.println("[Supabase] Position sent successfully.");
  } else {
    Serial.printf("[Supabase] Error: HTTP %d\n", httpCode);
    Serial.println(http.getString());
  }

  http.end();
}
```

### 6.5 Configure and Upload
1. Update the constants at the top:
   - `WIFI_SSID` and `WIFI_PASSWORD` — your WiFi network
   - `SUPABASE_URL` and `SUPABASE_KEY` — from Step 3.4
   - `BOAT_ID` — the ID of this boat in the database
   - `RACE_ID` — the ID of the active race
2. Select your board: **Tools → Board → ESP32 Dev Module**
3. Select the correct port: **Tools → Port → COMx** (Windows) or `/dev/ttyUSB0` (Linux/Mac)
4. Click **Upload** (→ arrow button)
5. Open **Serial Monitor** (115200 baud) to see GPS data

### 6.6 GSM Version (for open-water races)
If using the SIM800L module for cellular data instead of WiFi, replace the WiFi connection code with AT commands for the SIM800L. The HTTP POST logic stays the same, but is sent through the GSM module's TCP/IP stack. See the SIM800L AT command documentation for details.

---

## Step 7 — Deploying the Website

### Option A: GitHub Pages (Free)
1. Push the project to a GitHub repository
2. Go to **Settings → Pages**
3. Under "Source", select **main** branch and `/ (root)` folder
4. Click Save — your site will be at `https://username.github.io/oceanic-order/`

### Option B: Vercel (Free)
1. Sign up at [vercel.com](https://vercel.com/)
2. Click **"Import Project"** → connect your GitHub repo
3. No build settings needed (static HTML)
4. Click **Deploy** — you'll get a URL like `oceanic-order.vercel.app`

### Option C: Netlify (Free)
1. Sign up at [netlify.com](https://netlify.com/)
2. Drag-and-drop the `oceanic-order` folder to deploy
3. Get a URL like `oceanic-order.netlify.app`

---

## Troubleshooting

### Website Issues

| Problem | Solution |
|---------|----------|
| Map doesn't load | Check internet connection (Leaflet tiles load from CDN) |
| "Demo mode" message | Update `supabase-config.js` with your credentials |
| No boats showing | Ensure boats exist in Supabase `boats` table |
| Positions not updating | Check that `boat_positions` is added to Realtime publication |

### Hardware Issues

| Problem | Solution |
|---------|----------|
| GPS shows "Waiting for fix" | Move outdoors, ensure GPS antenna faces sky, wait 1–2 min for cold start |
| WiFi won't connect | Check SSID/password, ensure 2.4 GHz network (ESP32 doesn't support 5 GHz) |
| Supabase returns 401 | Check your `apikey` header — use the anon key, not the service role key |
| SIM800L not responding | Check power (needs 3.7–4.2V, 2A peak), check SIM card is inserted correctly |
| ESP32 keeps restarting | Power issue — use a reliable power source, add a capacitor near SIM800L |

### Supabase Issues

| Problem | Solution |
|---------|----------|
| RLS blocking inserts | Run: `CREATE POLICY "allow inserts" ON boat_positions FOR INSERT WITH CHECK (true);` |
| Realtime not working | Ensure table is added to publication: `ALTER PUBLICATION supabase_realtime ADD TABLE boat_positions;` |
| Too many connections | Free tier allows 50 connections — close unused tabs/connections |

---

## Quick Reference

### Start a Race
```sql
INSERT INTO races (name, status, start_time, course, distance_nm, location)
VALUES ('My Race', 'live', NOW(), 'Windward-Leeward', 10.0, 'Marina Bay');
```

### End a Race
```sql
UPDATE races SET status = 'completed', end_time = NOW() WHERE id = 1;
```

### Add Race Results
```sql
INSERT INTO race_results (race_id, boat_id, rank, finish_time) VALUES
  (1, 3, 1, '2h 45m 18s'),
  (1, 1, 2, '2h 48m 05s'),
  (1, 2, 3, '2h 51m 33s');
```

---

**Happy Sailing! 🌊⛵**

*OCEANIC ORDER — Track Every Wave, Win Every Race*
