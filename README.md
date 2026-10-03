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
- User profile banner showing avatar, rank badge, level progress, and XP percentage.
- 4 custom gradient themes: *Ruby Poly*, *Purple Glow*, *Midnight Blue*, and *Dark Slate*.

### 3. 🏆 Guild Leaderboard
- Server/guild rank tables displaying top members, customized avatars, ranks, and XP values.

### 4. 💬 Quote Card
- Elegant typographic card generator with custom avatar, handle, and message quotation.

### 5. 🎨 Custom Studio
- Visual drag-and-drop designer for arbitrary custom banners.
- Support for Text, Images, Avatars, Badges, Progress Bars, and Glassmorphic Containers.

### 6. 🎬 Animation Studio (GIF & WebP)
- **Interactive Multi-Track Timeline**:
  - **Timeline Scrubbing**: Click and drag across the time ruler (`0ms`, `300ms`, `600ms`, `900ms`, `1200ms`, `1500ms`...) or track lanes to smoothly scrub the playhead with live frame updates.
  - **Draggable Keyframes**: Drag keyframe diamonds horizontally across track lanes to reposition their timing with live playhead feedback.
  - **Drag-and-Drop Layer Reordering**: Drag tracks up and down in either the Timeline column or the Layers sidebar to change layer order (`zIndex`) instantly.
  - **Keyframe Easing Curves**: Supports `Ease In-Out`, `Linear`, `Ease In`, `Ease Out`, and `Bounce` overshoot animations.
  - **Direct Canvas Manipulation**: Click any element to select, drag to reposition, and grab corner handles to scale dimensions with live pixel coordinates.
  - **1-Click Starter Templates**: Built-in animation templates including *Welcome Discord Card*, *Now Playing Wave*, and *Rank Up / XP Banner*.
  - **Template Variables**: Automatically parse `{userName}`, `{guildName}`, `{userAVTurl}` or custom variables inside Text Content and Image URLs, with 1-click insert chips and live preview.
  - **API Payload Inspector (Compact Keyframes)**: View, edit, and export API JSON payloads in **⚡ Siêu ngắn (Compact Keyframes)** format (~50 lines instead of 3,000 lines, reducing payload size by ~98% by defining base canvas + keyframe tracks). Supports unparsed template variables (`{vars}`) or resolved values, syntax check, live editor, download `.json`, cURL generator, and instant test render.
  - **Color Palette & Native Picker**: Built-in color picker with curated swatch palette (White, Purple Glow, Violet, Neon Pink, Rose, Amber, Gold, Emerald, Cyan, Blue, etc.) for text, backgrounds, and progress bars.
  - **Export Options**: Export high-quality **GIF** and **Animated WebP** with custom FPS (10, 12, 15, 20, 24) and duration.

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
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "profile",
    "data": {
      "username": "ziji",
      "rank": "#1",
      "level": 42,
      "currentXp": 8500,
      "requiredXp": 10000,
      "balance": "1,250,000",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      "theme": "purple-glow"
    }
  }' \
  --output profile.png
```

---

### Example 3: Animated GIF / WebP Banner
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: image/gif" \
  -d '{
    "type": "animated",
    "data": {
      "title": "Welcome Animation",
      "format": "gif",
      "loop": 0,
      "delay": [100, 100, 100],
      "frames": [
        {
          "title": "Frame 1",
          "width": 930,
          "height": 280,
          "background": "#090614",
          "elements": [
            {
              "id": "welcome-txt",
              "type": "text",
              "x": 200,
              "y": 80,
              "width": 500,
              "height": 50,
              "content": "Welcome!",
              "color": "#ffffff",
              "fontSize": 42,
              "opacity": 0.2
            }
          ]
        },
        {
          "title": "Frame 2",
          "width": 930,
          "height": 280,
          "background": "#090614",
          "elements": [
            {
              "id": "welcome-txt",
              "type": "text",
              "x": 200,
              "y": 80,
              "width": 500,
              "height": 50,
              "content": "Welcome!",
              "color": "#ffffff",
              "fontSize": 42,
              "opacity": 1
            }
          ]
        }
      ]
    }
  }' \
  --output animated-welcome.gif
```

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

