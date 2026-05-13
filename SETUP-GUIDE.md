# ICONMIC - Complete Setup Guide

This guide walks you through setting up the ICONMIC e-book platform from scratch, including VS Code setup, Supabase database configuration, deployment, and QR code card creation.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [VS Code Setup](#2-vs-code-setup)
3. [Running Locally](#3-running-locally)
4. [Supabase Setup](#4-supabase-setup)
5. [Connecting Supabase to the App](#5-connecting-supabase-to-the-app)
6. [Database Schema](#6-database-schema)
7. [Adding Books](#7-adding-books)
8. [QR Code Cards (Hardware)](#8-qr-code-cards-hardware)
9. [Deploying as a Website](#9-deploying-as-a-website)
10. [Converting to a Mobile App (PWA)](#10-converting-to-a-mobile-app-pwa)
11. [Security & Anti-Piracy Notes](#11-security--anti-piracy-notes)

---

## 1. Prerequisites

Before you begin, make sure you have:

- **A computer** with Windows, macOS, or Linux
- **A web browser** (Chrome recommended for testing PWA features)
- **Visual Studio Code** - Download from [https://code.visualstudio.com](https://code.visualstudio.com)
- **A Supabase account** (free tier) - Sign up at [https://supabase.com](https://supabase.com)
- **Git** (optional) - Download from [https://git-scm.com](https://git-scm.com)

---

## 2. VS Code Setup

### Step 2.1: Install VS Code

1. Go to [https://code.visualstudio.com](https://code.visualstudio.com)
2. Download the installer for your operating system
3. Run the installer and follow the prompts
4. Launch VS Code

### Step 2.2: Install Recommended Extensions

Open VS Code and install these extensions (click the Extensions icon on the left sidebar or press `Ctrl+Shift+X`):

1. **Live Server** by Ritwick Dey - Required for local development
   - Search for "Live Server" and click Install
   - This lets you run the website locally with auto-refresh

2. **Prettier** by Prettier - Code formatter (optional)
   - Search for "Prettier" and click Install

3. **HTML CSS Support** - Autocomplete for HTML/CSS (optional)

### Step 2.3: Open the Project

1. Download or clone this repository to your computer
2. In VS Code, go to **File > Open Folder**
3. Select the `ICONMIC` folder
4. You should see all the project files in the left sidebar

---

## 3. Running Locally

### Step 3.1: Start Live Server

1. Open `index.html` in VS Code
2. Right-click anywhere in the file
3. Select **"Open with Live Server"**
4. Your browser will open at `http://127.0.0.1:5500/index.html`
5. The website should load with the ICONMIC landing page

### Step 3.2: Test the Pages

Navigate through the site to verify everything works:

- **Home** (`index.html`) - Landing page with genres and trending books
- **Library** (`library.html`) - Browse and search books
- **Login** (`login.html`) - Sign in form
- **Register** (`register.html`) - Create account form
- **Scanner** (`scanner.html`) - QR code scanner
- **Profile** (`profile.html`) - User profile (accessible after demo login)

### Step 3.3: Try the Demo

1. Click **"Try Demo Account"** on the login page
2. This logs you in as a demo user (no Supabase needed)
3. You can now browse books, read them, and see the reader with anti-piracy features

---

## 4. Supabase Setup

### Step 4.1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Log in to the Supabase dashboard

### Step 4.2: Create a New Project

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `iconmic`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the one closest to your users
3. Click **"Create new project"**
4. Wait for the project to be provisioned (~2 minutes)

### Step 4.3: Get Your API Keys

1. In your Supabase project, go to **Settings > API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (a long string starting with `eyJ...`)
3. Keep these handy for Step 5

### Step 4.4: Enable Email Auth

1. Go to **Authentication > Providers**
2. Ensure **Email** is enabled
3. Optionally configure:
   - **Confirm email**: Toggle on for production, off for testing
   - **Secure email change**: Enable for security

---

## 5. Connecting Supabase to the App

### Step 5.1: Update the Configuration

1. Open `js/supabase-config.js` in VS Code
2. Replace the placeholder values at the top:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

3. Save the file

### Step 5.2: Verify Connection

1. Refresh your local site
2. Try registering a new account
3. Check the Supabase dashboard > **Authentication > Users** to see if the user appeared

---

## 6. Database Schema

### Step 6.1: Create Tables

Go to **SQL Editor** in Supabase and run the following SQL:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  favorite_genre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create genres table
CREATE TABLE genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT
);

-- Create books table
CREATE TABLE books (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT REFERENCES genres(id),
  description TEXT,
  cover_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  pages INTEGER DEFAULT 0,
  year INTEGER,
  is_published BOOLEAN DEFAULT true,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create book content table (chapters)
CREATE TABLE book_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  chapter_title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reading history table
CREATE TABLE reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  progress DECIMAL(5,2) DEFAULT 0,
  last_chapter INTEGER DEFAULT 1,
  UNIQUE(user_id, book_id)
);

-- Create QR codes table (for tracking physical cards)
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  book_id TEXT REFERENCES books(id),
  is_active BOOLEAN DEFAULT true,
  scans INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Policies: Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies: Genres (public read)
CREATE POLICY "Anyone can view genres" ON genres FOR SELECT TO anon, authenticated USING (true);

-- Policies: Books (public read for published)
CREATE POLICY "Anyone can view published books" ON books FOR SELECT TO anon, authenticated USING (is_published = true);

-- Policies: Book Content (authenticated read)
CREATE POLICY "Authenticated users can read content" ON book_content FOR SELECT TO authenticated USING (true);

-- Policies: Reading History
CREATE POLICY "Users can view own history" ON reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON reading_history FOR UPDATE USING (auth.uid() = user_id);

-- Policies: QR Codes (public read for active)
CREATE POLICY "Anyone can view active QR codes" ON qr_codes FOR SELECT TO anon, authenticated USING (is_active = true);
```

### Step 6.2: Seed Initial Data

Run this SQL to add genres and sample books:

```sql
-- Insert genres
INSERT INTO genres (id, name, icon, color, description) VALUES
  ('fiction', 'Fiction', '📚', '#6C5CE7', 'Novels, short stories & literary works'),
  ('mystery', 'Mystery', '🔍', '#E17055', 'Thrillers, detective & crime stories'),
  ('romance', 'Romance', '❤️', '#FD79A8', 'Love stories & romantic tales'),
  ('scifi', 'Sci-Fi', '🚀', '#00CEC9', 'Science fiction & futuristic worlds'),
  ('fantasy', 'Fantasy', '🧙', '#A29BFE', 'Magic, dragons & mythical realms'),
  ('horror', 'Horror', '👻', '#2D3436', 'Scary stories & supernatural terror'),
  ('nonfiction', 'Non-Fiction', '🌍', '#00B894', 'Real-world knowledge & learning'),
  ('biography', 'Biography', '👤', '#FDCB6E', 'Life stories of remarkable people'),
  ('selfhelp', 'Self-Help', '💪', '#74B9FF', 'Personal growth & motivation'),
  ('comics', 'Comics', '💬', '#FF7675', 'Manga, graphic novels & comics'),
  ('children', 'Children', '🌟', '#55EFC4', 'Stories for young readers'),
  ('poetry', 'Poetry', '✍️', '#DFE6E9', 'Verses, poems & spoken word');

-- Insert sample books
INSERT INTO books (id, title, author, genre, description, rating, pages, year, qr_code) VALUES
  ('book-1', 'The Last Algorithm', 'Sarah Chen', 'scifi', 'In a world where AI controls everything, one programmer discovers the code that could set humanity free.', 4.5, 342, 2024, 'ICONMIC-BOOK-001'),
  ('book-2', 'Whispers in the Dark', 'James Morrison', 'mystery', 'Detective Lena Park uncovers a web of secrets in the quiet town of Millbrook.', 4.2, 289, 2024, 'ICONMIC-BOOK-002'),
  ('book-3', 'Starbound Hearts', 'Maria Lopez', 'romance', 'When astronaut Kai meets botanist Luna at a space station, their worlds collide.', 4.7, 256, 2023, 'ICONMIC-BOOK-003'),
  ('book-4', 'The Dragon''s Promise', 'Wei Zhang', 'fantasy', 'A young mage must fulfill an ancient pact with the last dragon.', 4.8, 412, 2024, 'ICONMIC-BOOK-004'),
  ('book-5', 'Mind Over Matter', 'Dr. Alex Turner', 'selfhelp', 'Practical strategies for building mental resilience.', 4.3, 198, 2024, 'ICONMIC-BOOK-005');

-- Insert QR codes for physical cards
INSERT INTO qr_codes (code, book_id) VALUES
  ('ICONMIC-BOOK-001', 'book-1'),
  ('ICONMIC-BOOK-002', 'book-2'),
  ('ICONMIC-BOOK-003', 'book-3'),
  ('ICONMIC-BOOK-004', 'book-4'),
  ('ICONMIC-BOOK-005', 'book-5');
```

---

## 7. Adding Books

### Adding a New Book

1. Go to **Supabase > Table Editor > books**
2. Click **"Insert row"**
3. Fill in the fields:
   - `id`: A unique ID (e.g., `book-6`)
   - `title`: Book title
   - `author`: Author name
   - `genre`: Must match a genre ID (e.g., `fiction`, `scifi`)
   - `description`: Short description
   - `rating`: 0-5 rating
   - `pages`: Number of pages
   - `year`: Publication year
   - `qr_code`: Unique QR code string (e.g., `ICONMIC-BOOK-006`)
4. Click **"Save"**

### Adding Book Content (Chapters)

1. Go to **Table Editor > book_content**
2. Click **"Insert row"**
3. Fill in:
   - `book_id`: The book's ID (e.g., `book-6`)
   - `chapter_number`: `1`, `2`, `3`, etc.
   - `chapter_title`: Chapter title
   - `content`: The chapter text (HTML allowed)
4. Click **"Save"**

---

## 8. QR Code Cards (Hardware)

This section explains how to create physical ICONMIC cards with QR codes to sell to customers.

### Step 8.1: QR Code Format

Each QR code should encode a URL in this format:

```
https://your-domain.com/scanner.html?code=ICONMIC-BOOK-001
```

Or simply the code:
```
ICONMIC-BOOK-001
```

### Step 8.2: Generating QR Codes

You can use free tools to generate QR codes:

1. **QR Code Generator** - [https://www.qr-code-generator.com](https://www.qr-code-generator.com)
   - Enter the URL or code
   - Download as PNG or SVG

2. **Bulk Generation** - For creating many codes at once:
   - Use [https://www.qrbatch.com](https://www.qrbatch.com)
   - Upload a CSV file with your codes:
     ```
     ICONMIC-BOOK-001
     ICONMIC-BOOK-002
     ICONMIC-BOOK-003
     ```
   - Download all QR codes as a ZIP file

3. **Python Script** (for developers):
   ```bash
   pip install qrcode pillow
   ```
   ```python
   import qrcode

   books = ['ICONMIC-BOOK-001', 'ICONMIC-BOOK-002', 'ICONMIC-BOOK-003']
   
   for code in books:
       qr = qrcode.make(f'https://your-domain.com/scanner.html?code={code}')
       qr.save(f'{code}.png')
       print(f'Generated: {code}.png')
   ```

### Step 8.3: Card Design

Design your physical cards using these specifications:

- **Card Size**: Standard credit card size (85.6mm x 53.98mm) or custom
- **Material**: PVC plastic cards, thick cardboard, or laminated paper
- **Front Side**:
  - ICONMIC logo and branding
  - Book title and cover artwork
  - A brief description or tagline
- **Back Side**:
  - QR code (minimum 2cm x 2cm for reliable scanning)
  - Unique code printed below QR (e.g., `ICONMIC-BOOK-001`)
  - Instructions: "Scan to read on ICONMIC"
  - Website URL

### Step 8.4: Printing Options

Choose a printing method based on your budget and quantity:

| Method | Best For | Cost | Notes |
|--------|----------|------|-------|
| **Home Printer** | Testing/prototypes | Low | Print on card stock, laminate |
| **Online Print Service** | Small batches (50-500) | Medium | Services: Vistaprint, MOO, Canva Print |
| **PVC Card Printer** | Medium batches (100-1000) | Medium-High | Fargo, Evolis printers |
| **Professional Printer** | Large batches (1000+) | Low per unit | Contact local print shops |

### Step 8.5: Recommended Card Design Tools

- **Canva** ([canva.com](https://canva.com)) - Free, easy card templates
- **Adobe Illustrator** - Professional design
- **Figma** ([figma.com](https://figma.com)) - Free, collaborative design

### Step 8.6: Packaging Suggestions

- Wrap each card in a sealed plastic sleeve
- Include a small insert with instructions
- Consider themed packaging for gift sets (e.g., "Mystery Collection" with 5 mystery book cards)

---

## 9. Deploying as a Website

### Option A: Netlify (Recommended - Free)

1. Go to [https://netlify.com](https://netlify.com) and sign up
2. Click **"Add new site" > "Deploy manually"**
3. Drag and drop the entire `ICONMIC` folder
4. Your site will be live at a Netlify URL (e.g., `https://iconmic.netlify.app`)
5. Optionally add a custom domain in **Site settings > Domain management**

### Option B: Vercel (Free)

1. Go to [https://vercel.com](https://vercel.com) and sign up
2. Click **"Add New" > "Project"**
3. Import from GitHub or upload files
4. Your site will be live instantly

### Option C: GitHub Pages (Free)

1. Push your code to a GitHub repository
2. Go to **Repository Settings > Pages**
3. Under "Source", select **main** branch
4. Your site will be at `https://username.github.io/ICONMIC/`

### Post-Deployment

After deploying, update these:

1. **QR Code URLs** - Update your QR codes to point to your live domain
2. **PWA manifest** - Update `start_url` in `manifest.json` if needed
3. **Supabase Auth** - Go to Supabase > **Authentication > URL Configuration** and add your live URL to "Redirect URLs"

---

## 10. Converting to a Mobile App (PWA)

ICONMIC is already a Progressive Web App (PWA). This means users can install it like a native app!

### How Users Install the App

**On Android (Chrome)**:
1. Visit your ICONMIC website
2. Chrome will show a "Add to Home Screen" banner, OR
3. Tap the three-dot menu > "Install app" or "Add to Home Screen"
4. The app appears on the home screen with the ICONMIC icon

**On iOS (Safari)**:
1. Visit your ICONMIC website in Safari
2. Tap the Share button (box with up arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

**On Desktop (Chrome/Edge)**:
1. Visit the website
2. Click the install icon in the address bar, OR
3. Click the three-dot menu > "Install ICONMIC"

### PWA Features Included

- **Offline Access**: Previously viewed pages are cached
- **Home Screen Icon**: Custom ICONMIC icon
- **Standalone Mode**: Opens without browser chrome
- **Push Notifications**: Can be added via Supabase Edge Functions
- **Background Sync**: Coming soon

### To Build a Native App (Optional)

If you need a native app store listing later:

1. **Use PWABuilder** ([https://pwabuilder.com](https://pwabuilder.com)):
   - Enter your deployed URL
   - Download packages for Android (APK/AAB) and iOS
   - Submit to Google Play Store and Apple App Store

2. **Use Capacitor** (for more control):
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init ICONMIC com.iconmic.app
   npx cap add android
   npx cap add ios
   npx cap sync
   ```

---

## 11. Security & Anti-Piracy Notes

### Current Protections

- **Right-click disabled** on reader pages
- **Text selection disabled** on book content
- **Copy/paste blocked** via keyboard shortcuts
- **Print blocked** via CSS `@media print`
- **Screenshot partially blocked** via PrintScreen key interception
- **Content blurred** when tab loses focus (potential screen recording)
- **User watermark** displayed on all reader pages
- **Dev tools shortcuts blocked** (F12, Ctrl+Shift+I, etc.)

### Important Notes

- **No client-side DRM is 100% secure**. These measures deter casual piracy but cannot prevent determined users.
- For maximum protection, consider:
  - **Server-side rendering** of book content as images
  - **DRM solutions** like Widevine for premium content
  - **Watermarking** with unique user identifiers
  - **Rate limiting** on content access APIs
  - **Legal measures** (copyright notices, DMCA)

### Supabase Security

- **Row Level Security (RLS)** is enabled on all tables
- Book content requires authentication to access
- User data is isolated per user
- The `anon` key can only perform read operations on public data

---

## Troubleshooting

### Live Server not starting
- Make sure the Live Server extension is installed
- Try right-clicking `index.html` > "Open with Live Server"
- Check the VS Code bottom status bar for the Live Server port

### Supabase connection not working
- Double-check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/supabase-config.js`
- Make sure there are no extra spaces or quotes
- Check the browser console (F12 > Console) for error messages

### QR Scanner not working
- Make sure you're using HTTPS (required for camera access)
- Grant camera permissions when prompted
- Try using the manual code entry as a fallback
- On desktop, an external webcam may be required

### PWA not installable
- The site must be served over HTTPS
- Check the browser console for manifest errors
- Ensure `manifest.json` is accessible
- Use Chrome DevTools > Application > Manifest to debug

---

## Support

For questions or issues, please open an issue in this repository.

**Happy Reading! - The ICONMIC Team**
