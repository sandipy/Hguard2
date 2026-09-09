# HGuard Home Monitor: Senior-Friendly Security & Surveillance System

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Web%20App-brightgreen?logo=github)](https://sandipy.github.io/Hguard/)
[![Repository](https://img.shields.io/badge/GitHub-sandipy%2FHguard-blue?logo=github)](https://github.com/sandipy/Hguard)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Built%20with-Vite%20%2B%20React%2018-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌐 Live Web Application & URLs

- **GitHub Pages Web URL**: [https://sandipy.github.io/Hguard/](https://sandipy.github.io/Hguard/)
- **GitHub Source Repository**: [https://github.com/sandipy/Hguard](https://github.com/sandipy/Hguard)
- **Offline Standalone Bundle**: Download `hguard-offline.zip` directly from the repository or within the app to run completely offline without any internet connection.

---

## 🛡️ Overview

**HGuard** transforms any spare smartphone, tablet, laptop, or computer into a high-reliability, senior-friendly home security surveillance camera and multi-screen monitoring station. 

Designed specifically with senior accessibility and phone longevity in mind, HGuard solves the common pitfalls of repurposing old mobile phones as 24/7 security cameras—such as battery swelling from continuous 100% charging, device overheating, complicated interfaces, and confusing alert streams.

---

## ✨ Key Features & Capabilities

### 1. 3-Camera + 1-Viewer Architecture
- **Camera Role**: Repurpose up to 3 old devices as dedicated security cameras:
  - **Camera 1**: Front Door / Porch
  - **Camera 2**: Living Room / Senior Area
  - **Camera 3**: Backyard / Driveway
- **Master Viewer Role**: Monitor all 3 cameras concurrently on a high-visibility multi-screen grid, or click into a single focused viewport with 4x digital zoom.
- **Auto Sync**: Cross-tab, local network, and cloud sync allows viewing live feeds instantly.

### 2. Battery 80% Longevity Protection & Acoustic Chime
- **Lithium-Ion Safety**: Continuous charging at 100% causes phone battery swelling and permanent battery failure.
- **Smart 80% Cutoff Reminder**: Automatically detects battery level and triggers an acoustic chime and high-contrast alert whenever the battery reaches 80%, reminding users or caregivers to unplug the charger.
- **Low Battery Alert**: Alerts if the device drops below 20% to avoid sudden shutdown.

### 3. Eco-Cool Blackout & Thermal Overheat Guard
- **OLED/LCD Blackout Mode**: Darkens the camera display completely with a minimal clock overlay, reducing screen heat dissipation by up to 75% and preventing display burn-in while the camera continues recording.
- **Thermal Status Sensor**: Monitors device hardware metrics to display thermal status (`nominal`, `fair`, `critical`) and automatically throttles frame rate if the device gets warm.

### 4. Multimodal Gemini Vision AI Detection
- **Smart Filtering**: Classifies camera frames into distinct, actionable categories:
  - 🚶 **Person Detection**: Distinguishes human visitors from ambient motion.
  - 🐾 **Pet Detection**: Identifies dogs and cats to eliminate false intruder alarms.
  - 🚗 **Vehicle Detection**: Alerts on arriving delivery trucks or cars in driveway.
  - 👶 **Baby / Distress Sound Detection**: Audio anomaly and cry detection.
  - ⏳ **Lingering / Loitering Detection**: Flags subjects staying in front of the door for over 3 minutes.
- **AI Frame Bounding Boxes**: Overlays bounding boxes and confidence scores directly over detected subjects in the live viewer.

### 5. 30-Day Cloud Storage Vault & Timeline Scrubber
- **Automatic Clip Archiving**: Saves 15-second high-definition clips when motion or AI events are detected.
- **Chronological Timeline Scrubber**: Visually scrub through recorded history by hour and day.
- **Filter by Camera & Category**: Filter events instantly by specific camera (Front Door, Living Room, Backyard) and event type (Person, Pet, Vehicle, Motion).

### 6. Senior Mode & Accessibility
- **High-Contrast Display**: 18px+ high-contrast typography, large touch targets (min 48px), and clear status badges designed for seniors and caregivers.
- **Spoken Senior Voice Alerts**: Uses the Web Speech synthesis engine to speak alerts aloud (e.g., *"Motion detected at Front Door"*, *"Battery reached 80%, please unplug charger"*).
- **One-Tap Emergency Siren & Talkback**: Loud 95dB acoustic siren to deter intruders, plus a two-way intercom for voice communication.

### 7. End-to-End AES-256 GCM Encryption
- **Encrypted Snapshots & Logs**: All security snapshots and telemetry are encrypted client-side with AES-256 GCM using a user-selected 4-digit PIN before storage.
- **Zero-Knowledge Architecture**: Raw video streams are never transmitted unencrypted.

---

## 🚀 Running Locally or Deploying

### Option 1: Live via GitHub Pages
Visit: [https://sandipy.github.io/Hguard/](https://sandipy.github.io/Hguard/)  
No installation or server setup required. All camera streams, motion detection, senior voice alerts, and battery guards run directly inside modern web browsers (Chrome, Edge, Safari, Firefox).

### Option 2: Run Offline Standalone
1. Download `hguard-offline.zip` from this repository.
2. Unpack the zip file into any folder.
3. Open `index.html` in your browser, or start a local HTTP server:
   ```bash
   python3 -m http.server 8080
   # Open http://localhost:8080
   ```

### Option 3: Run Full-Stack Development Server
Requires Node.js 18+ installed:

```bash
# 1. Clone repository
git clone https://github.com/sandipy/Hguard.git
cd Hguard

# 2. Install dependencies
npm install

# 3. Start development server (Port 3000)
npm run dev

# 4. Open in browser
http://localhost:3000
```

### Production Build:
```bash
npm run build
npm run start
```

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas 2D API
- **Motion & Audio Processing**: WebRTC / MediaDevices API, Web Audio API (Synthesizers & Sound Analysis), Web Speech Synthesis API
- **Encryption**: Web Crypto API (SubtleCrypto AES-256-GCM + PBKDF2 Key Derivation)
- **Backend (Optional Full-Stack Mode)**: Express, Node.js, `@google/genai` (Gemini Vision Multimodal AI)
- **Continuous Deployment**: GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys to GitHub Pages on every push to `main`.

---

## 📡 API Reference (Full-Stack Mode)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, active Gemini API key status, and cloud clip count |
| `GET` | `/api/git-info` | Current GitHub repository and GitHub Pages configuration |
| `GET` | `/api/download-offline-zip` | Downloads the ready-to-run offline standalone bundle |
| `POST` | `/api/ai-detect` | Multimodal Gemini Vision snapshot classification and bounding boxes |
| `GET` | `/api/cloud-storage/events` | Retrieves 30-day cloud recorded security clips |
| `POST` | `/api/cloud-storage/save` | Stores a recorded surveillance clip |
| `DELETE` | `/api/cloud-storage/delete/:id` | Deletes a stored clip |

---

## 👥 Authors & Credits

- **Repository**: [https://github.com/sandipy/Hguard](https://github.com/sandipy/Hguard)
- **Developer**: sandipy
- **Powered by**: Google AI Studio & Gemini Multimodal Vision
