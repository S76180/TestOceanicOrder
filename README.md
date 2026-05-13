# ICONMIC - E-Book Reading Platform

A modern, secure e-book reading platform with QR code scanning, anti-piracy protection, and PWA support. Built with vanilla HTML, CSS, and JavaScript with Supabase backend.

## Features

- **Multi-Genre Library** - Browse and read books across 12+ genres
- **QR Code Scanning** - Scan physical ICONMIC cards to unlock books instantly
- **Anti-Piracy Protection** - Content protection with watermarking, screenshot blocking, copy prevention
- **PWA (Progressive Web App)** - Install as a native-like app on any device
- **Supabase Auth** - Secure user registration and login
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Multiple Reading Themes** - Dark, Light, and Sepia reading modes
- **Offline Support** - Read cached content offline via service worker

## Project Structure

```
ICONMIC/
├── index.html              # Landing page with genre selection
├── login.html              # Login page
├── register.html           # Registration page
├── library.html            # Book catalog/library
├── reader.html             # Book reader (anti-piracy enabled)
├── scanner.html            # QR code scanner
├── profile.html            # User profile & settings
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline/PWA
├── css/
│   ├── common.css          # Shared styles & design system
│   ├── index.css           # Home page styles
│   ├── auth.css            # Login/register styles
│   ├── library.css         # Library page styles
│   ├── reader.css          # Reader page styles
│   ├── scanner.css         # Scanner page styles
│   └── profile.css         # Profile page styles
├── js/
│   ├── supabase-config.js  # Supabase initialization & database helpers
│   ├── app.js              # Common logic, navigation, PWA registration
│   ├── auth.js             # Authentication logic
│   ├── index.js            # Home page logic
│   ├── library.js          # Library/catalog logic
│   ├── reader.js           # Reader logic + anti-piracy measures
│   ├── scanner.js          # QR scanner logic
│   └── profile.js          # Profile page logic
├── images/
│   ├── icon-192.png        # PWA icon 192x192
│   └── icon-512.png        # PWA icon 512x512
└── SETUP-GUIDE.md          # Complete step-by-step setup guide
```

## Quick Start

1. Clone this repository
2. Open `index.html` in a browser (or use Live Server in VS Code)
3. The app works with demo data out of the box
4. See [SETUP-GUIDE.md](SETUP-GUIDE.md) for full Supabase setup and deployment instructions

## Anti-Piracy Measures

- Right-click context menu disabled
- Text selection disabled on book content
- Copy/paste keyboard shortcuts blocked
- Print disabled via CSS media query
- PrintScreen key intercepted
- Content blurred when tab loses focus
- User watermark overlay on all reader pages
- Dev tools keyboard shortcuts blocked

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **QR Scanning**: html5-qrcode library
- **PWA**: Service Worker + Web App Manifest
- **Fonts**: Google Fonts (Inter, Poppins, Merriweather)

## License

Copyright 2024 ICONMIC. All rights reserved.
