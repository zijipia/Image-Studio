# Image Studio

> Dynamic visual social card, leaderboard, profile banner, and **Animation Studio** powered by React, Satori, Sharp, and Express.

![Image Studio](https://raw.githubusercontent.com/zijipia/zijipia/refs/heads/main/Assets/zilove.png)

## 🌟 Highlights & Features

Image Studio provides a full-featured visual creation suite optimized for Discord bots, social share cards, automated media generation, and interactive animated banners.

### 1. 🎵 Song Search Card
- Dynamic 1130px social card generator for playlist and track search results.
- 4 automatic or manual layouts: **Auto**, **List**, **Grid**, and **Classic**.
- High-res cover art, track numbering, duration, and artist metadata formatting.

### 2. 👤 Profile & Rank Card
- User profile banner showing avatar, rank badge, level progress, XP percentage, and coin balance.
- **4 Distinct Artwork Themes**:
  - `ruby-poly`: Crimson angular geometric shards, circular glowing avatar, 3D XP bar, Lv badge, and balance.
  - `cyber-neon`: Cyberpunk Sci-Fi HUD ID card with dual cyan/magenta laser scanners, square tech avatar, telemetry status, and NET_WORTH stats.
  - `glass-minimal`: Frosted emerald glass aesthetic, glowing matrix telemetry, and sleek rounded level pills.
  - `gold-legend`: Imperial gold sovereign rank card with laurel filigree, regal golden crown, and imperial ascendancy XP bar.

### 3. 🏆 Guild Leaderboard
- Server/guild rank tables displaying top members, customized guild icon, avatars, ranks, and XP values.
- **4 Distinct Layouts**:
  - `podium`: 3D Olympic podium for Top 3 with imperial gold crown on 1st place, followed by compact rows for subsequent ranks.
  - `compact-list`: Classic Discord table with 🥇🥈🥉 medals, colored level badges, and XP values.
  - `cyber-grid`: 2-column cyberpunk duel arena cards with neon rank tags and square avatars.
  - `minimal-cards`: Frosted glass floating cards with percentage progress bar relative to leader.

### 4. 💬 Quote Card
- Elegant typographic card generator with custom avatar, author, handle, and message quotation.
- **4 Distinct Layouts**:
  - `split-portrait`: Cinematic split layout with left character portrait fading smoothly into right typography.
  - `centered-minimal`: Editorial centered typography with glowing gradient avatar ring and watermark.
  - `modern-card`: Frosted glass card floating on blurred backdrop with verified author badge.
  - `neon-cyber`: Sci-Fi terminal cyber HUD with corner brackets, audio telemetry bars, and recording indicator.

### 5. 🎨 Custom Freeform Canvas Studio
- Freeform drag-and-drop layer canvas generator (`/custom`).
- Add and position arbitrary layers: Text, Badges, Avatars, Custom Images, Progress Bars, and Particle Emitters.
- Rich typography styling: custom fonts, line heights, letter spacing, text shadows, and glowing aura.

### 6. 💾 Presets & Template Manager (Local Storage)
- **Built-in Curated Templates**: Instantly switch between curated configurations for Song Search, Profile Cards, Guild Leaderboards, and Quotes.
- **Save to Local Storage**: Save custom configurations with custom names and notes directly to your browser's persistent storage.
- **1-Click Apply & Management**: Load saved presets with a single click, view badge summaries, and remove outdated presets easily.

### 7. 🎬 Animation Studio (GIF & WebP)
- **Interactive Multi-Track Timeline**:
  - **Timeline Scrubbing**: Click and drag across the time ruler (`0ms`, `300ms`, `600ms`, `900ms`, `1200ms`, `1500ms`...) or track lanes to smoothly scrub the playhead with live frame updates.
  - **Draggable Keyframes**: Drag keyframe diamonds horizontally across track lanes to reposition their timing with live playhead feedback.
  - **Drag-and-Drop Layer Reordering**: Drag tracks up and down in either the Timeline column or the Layers sidebar to change layer order (`zIndex`) instantly.
  - **Keyframe Easing Curves**: Supports `Ease In-Out`, `Linear`, `Ease In`, `Ease Out`, and `Bounce` overshoot animations.
  - **Direct Canvas Manipulation**: Click any element to select, drag to reposition, and grab corner handles to scale dimensions with live pixel coordinates.
  - **7 Built-in Starter Templates**: *Welcome Card*, *Cyber Dynamic Entrance*, *Now Playing Wave*, *Rank Up / XP*, *✨ Spark Magic Banner*, *🌸 Sakura Petals Anime*, and *🎵 Music Neon Wave*.
  - **Template Variables**: Automatically parse `{userName}`, `{guildName}`, `{userAVTurl}` or custom variables inside Text Content and Image URLs, with 1-click insert chips and live preview.
  - **API Payload Inspector (Compact Keyframes)**: View, edit, and export API JSON payloads in **⚡ Siêu ngắn (Compact Keyframes)** format (~50 lines instead of 3,000 lines, reducing payload size by ~98% by defining base canvas + keyframe tracks). Supports unparsed template variables (`{vars}`) or resolved values, syntax check, live editor, download `.json`, cURL generator, and instant test render.
  - **Particle Effects System**: Ambient particles with customizable shapes: `spark` (diamond stars), `petals` (cherry blossoms), `snow` (snowflakes), `fire` (flame embers), `stars` (night cosmos), and `music` (neon notes).
  - **Color Palette & Native Picker**: Built-in color picker with curated swatch palette (White, Purple Glow, Violet, Neon Pink, Rose, Amber, Gold, Emerald, Cyan, Blue, etc.) for text, backgrounds, and progress bars.
  - **Export Options**: Export high-quality **GIF** and **Animated WebP** with custom FPS (10, 12, 15, 20, 24) and duration, or extract instantaneous single PNG frames.

---

## 🌐 Direct Page URLs & Routing

All studios support dedicated, shareable, and direct URLs:
- `/song` (or `/`): Song Search Card Studio
- `/profile`: User Profile & Rank Card Studio
- `/leaderboard`: Guild Leaderboard Studio
- `/quote`: Stylized Quote Card Studio
- `/custom`: Custom Freeform Canvas Studio
- `/animation`: Multi-track Animation Studio (GIF & WebP)

Supports HTML5 History API, deep linking, browser back/forward navigation, and opening in new tabs.

---

## 📊 Live Generation Stats Counter

- **Server Counter & Persistence**: Every exported image and animation is counted via `POST /api/generate` with an atomic server counter persisted to `.app-stats.json`.
- **API Endpoint**: `GET /api/stats` returns `{ "totalGenerated": number, "lastGeneratedAt": string }`.
- **Live UI Header Badge**: Prominently displayed in the top bar with a live pulsing status indicator and synced counter.
- **Client Cache**: Synchronized with `localStorage` for offline support and immediate client-side count reflection.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 22+
- npm (Node Package Manager)

### Installation
```bash
# Clone the repository
git clone https://github.com/zijipia/Image-Studio.git
cd Image-Studio

# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

The app will run at `http://localhost:3000` (or `http://0.0.0.0:3000`).

### Build for Production
```bash
# Build the client bundle with Vite
npm run build

# Start production server
npm start
```

---

## 📡 API Reference (`POST /api/generate`)

All card and animation generators are backed by a single REST endpoint: `POST /api/generate`.

### Header Requirements
- `Content-Type: application/json`
- `Accept: image/png` (for static cards) or `Accept: image/gif` / `Accept: image/webp` (for animations)

---

### Example 1: Song Search Results Card
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "song",
    "title": "Top Hits 2026",
    "layout": "auto",
    "items": [
      {
        "index": 1,
        "displayName": "Blinding Lights",
        "author": "The Weeknd",
        "time": "3:20",
        "source": "youtube",
        "avatar": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150"
      },
      {
        "index": 2,
        "displayName": "Starboy",
        "author": "The Weeknd",
        "time": "3:50",
        "source": "spotify",
        "avatar": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150"
      }
    ]
  }' \
  --output songs.png
```

---

### Example 2: User Rank / Profile Card
Supports `"theme": "ruby-poly" | "cyber-neon" | "glass-minimal" | "gold-legend"`.

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "profile",
    "data": {
      "username": "__ziji",
      "rank": "#1",
      "level": 42,
      "currentXp": 8500,
      "requiredXp": 10000,
      "balance": "13,080 xu",
      "badge": "★ TOP 1 GUILD",
      "title": "Ruby Grandmaster",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      "theme": "cyber-neon"
    }
  }' \
  --output profile.png
```

---

### Example 3: Guild Leaderboard
Supports `"layout": "podium" | "compact-list" | "cyber-grid" | "minimal-cards"`.

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "leaderboard",
    "data": {
      "guildName": "Celestial Realm",
      "season": "SEASON 4",
      "layout": "podium",
      "guildIcon": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
      "items": [
        { "rank": 1, "username": "Aurelius", "handle": "@aurelius_rex", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", "level": 99, "xp": 94820 },
        { "rank": 2, "username": "Valkyrie", "handle": "@valk_prime", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", "level": 88, "xp": 82140 },
        { "rank": 3, "username": "Kage", "handle": "@shadow_blade", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", "level": 75, "xp": 67390 }
      ]
    }
  }' \
  --output leaderboard.png
```

---

### Example 4: Quote Card
Supports `"layout": "split-portrait" | "centered-minimal" | "modern-card" | "neon-cyber"`.

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quote",
    "data": {
      "quote": "Stay hungry, stay foolish.",
      "author": "Steve Jobs",
      "handle": "@stevejobs",
      "tag": "Stanford 2005",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
      "layout": "split-portrait"
    }
  }' \
  --output quote.png
```

---

### Example 5: Custom Freeform Canvas Card
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "data": {
      "title": "Welcome Card",
      "width": 930,
      "height": 280,
      "background": "linear-gradient(135deg, #090614 0%, #1e1035 100%)",
      "elements": [
        {
          "id": "avatar",
          "type": "avatar",
          "x": 40,
          "y": 40,
          "width": 140,
          "height": 140,
          "imageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
          "borderRadius": 999
        },
        {
          "id": "title",
          "type": "text",
          "x": 210,
          "y": 60,
          "width": 680,
          "height": 50,
          "content": "Welcome to Image Studio!",
          "color": "#ffffff",
          "fontSize": 40,
          "fontWeight": 700
        }
      ]
    }
  }' \
  --output custom-card.png
```

---

### Example 6: Single Frame PNG Extraction & Animation
Extract a single PNG frame from animation presets via GET (with automatic `{userName}`, `{guildName}`, `{userAVTurl}` replacement):
```bash
# Presets: welcome | cyber-rotation | music | rank-up | spark-magic | sakura-petals | music-neon
curl "http://localhost:3000/api/animation/frame?preset=welcome&time=350&userName=Alex&guildName=Legends" \
  --output welcome-frame.png
```

Or render full animated GIF / WebP (Compact Keyframe format):
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: image/gif" \
  -d '{
    "type": "animated",
    "data": {
      "title": "Welcome Animation",
      "format": "gif",
      "duration": 1500,
      "fps": 12,
      "loop": 0,
      "canvas": {
        "title": "Welcome Card",
        "width": 930,
        "height": 280,
        "background": "#090614",
        "elements": [
          { "id": "avatar", "type": "avatar", "x": 36, "y": 40, "width": 140, "height": 140, "imageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" },
          { "id": "title", "type": "text", "x": 205, "y": 55, "width": 650, "height": 52, "content": "Welcome, Adventurer!", "color": "#ffffff", "fontSize": 44, "fontWeight": 700 }
        ]
      },
      "tracks": [
        {
          "elementId": "avatar",
          "keyframes": [
            { "time": 0, "scaleX": 0.2, "scaleY": 0.2, "opacity": 0 },
            { "time": 600, "scaleX": 1.0, "scaleY": 1.0, "opacity": 1, "easing": "bounce" }
          ]
        }
      ]
    }
  }' \
  --output animated-welcome.gif
```

> 💡 **Tip**: All card endpoints (`song`, `profile`, `leaderboard`, `quote`) accept an optional `"particleConfig": { "preset": "spark" | "petals" | "snow" | "fire" | "stars" | "music" }` object for animated ambient particles.

> 📖 **Full API Reference**: Check out [`docs/api.md`](docs/api.md) for complete schemas, response headers, Python, Node.js, and Discord bot integration examples.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite.
- **Rendering Engine**: [Satori](https://github.com/vercel/satori) (JSX/HTML-to-SVG conversion) + [Sharp](https://github.com/lovell/sharp) (high-speed SVG-to-PNG / multi-frame GIF & WebP encoding).
- **Backend API**: Express 4 server with streaming binary responses.
- **International Typography**: Dynamic Google Fonts unicode asset loader supporting Vietnamese, CJK (Japanese, Korean, Chinese), Cyrillic, Thai, Arabic, Devanagari, and Latin Extended.

---

## 📄 License
MIT License. Open source and ready for bot integrations and production workflows.

## Support 
<img width="256" height="256" alt="image" src="https://github.com/user-attachments/assets/ebbf178f-a0af-468c-bc6d-34f0502f30a8" />

