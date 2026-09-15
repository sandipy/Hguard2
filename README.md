# HGuard2 Home Monitor: Senior-Friendly Security & Surveillance System

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Web%20App-brightgreen?logo=github)](https://sandipy.github.io/Hguard2/)
[![Repository](https://img.shields.io/badge/GitHub-sandipy%2FHguard2-blue?logo=github)](https://github.com/sandipy/Hguard2)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite%20%2B%20React%2018-646CFF?logo=vite)](https://vitejs.dev/)
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Styling](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌐 Live Web Application & Deployment URLs

- **GitHub Pages Web URL**: [https://sandipy.github.io/Hguard2/](https://sandipy.github.io/Hguard2/)
- **GitHub Source Repository**: [https://github.com/sandipy/Hguard2](https://github.com/sandipy/Hguard2)
- **Offline Standalone Bundle**: Download `hguard-offline.zip` from this repository to run 100% offline in any browser without an internet connection or backend server.

---

## 🛡️ Overview

**HGuard2** transforms any spare smartphone, tablet, laptop, or desktop computer into an advanced, senior-friendly home security surveillance camera and multi-screen monitoring station.

Engineered specifically with senior accessibility (designed for 95-year-old seniors with zero button presses needed) and old-phone longevity in mind, HGuard2 eliminates the hazards of repurposing old mobile phones as 24/7 security cameras—preventing battery swelling, overheating, confusing interfaces, and complicated setups.

---

## ✨ Comprehensive Features & Capabilities

### 1. 🌙 Automatic Night Vision (IR Mode) on Low Light
- **Optical Luminance Sensor**: Analyzes real-time pixel luminance on a 0–100% scale using downscaled optical sampling to preserve CPU and battery.
- **Automatic IR Activation**: When ambient room lighting falls below the configurable threshold (default 35%), the system automatically engages high-contrast infrared monochrome AGC mode.
- **De-bouncing & Hysteresis**: Employs temporal smoothing (multi-frame confirmation) and brightness hysteresis to prevent rapid flickering when light is fluctuating.
- **Audible & Visual Confirmation**: Voice announcements notify the room when night vision engages, and real-time HUD badges display current luminance percentage.

### 2. 💡 Automatic Flashlight / Torch on Pitch Darkness
- **Hardware Torch Integration**: Directly controls the rear camera hardware LED torch via standard MediaStream track constraints (`applyConstraints({ advanced: [{ torch: true }] })`).
- **Screen Floodlight Fallback**: If the device lacks a hardware LED (e.g., front selfie camera, tablet, or laptop), it automatically lights the screen pure white at 100% brightness as an optical floodlight.
- **Pitch Dark Auto-Trigger**: Automatically turns on the torch when ambient luminance drops below the pitch-dark threshold (default 15%), and turns it off once ambient light is restored.
- **Remote Viewer Control**: Viewers can toggle flashlight or night mode on any individual camera or all cameras simultaneously with a single tap.

### 3. 📻 Walkie-Talkie Mode & Remote Camera Speaker Announcements
- **Two-Way Walkie-Talkie Intercom**: Speak directly from the viewer station through the camera phone's loudspeaker using real-time audio recording, push-to-talk transmission, and acoustic roger beeps.
- **Loudspeaker Announcements**: Type or choose from pre-set urgent announcements (e.g., *"Dinner is ready"*, *"Caregiver arriving now"*, *"Please stay seated"*) to broadcast audibly on the camera phone.
- **Zero-Touch Auto-Answer**: The camera phone automatically answers intercom calls and plays announcements hands-free—seniors never have to touch or answer the phone.

### 4. 👵 Zero-Setup Senior Companion Mode (Engineered for 95-Year-Olds)
- **Zero Button Operation**: Once launched, the camera runs 100% autonomously 24/7. Seniors never need to operate, touch, or understand the phone.
- **Autonomous Status Station**: Displays clean, glanceable status confirming camera is running on charger with zero buttons required.
- **1-Touch Big Red SOS Button**: A prominent 🚨 *"CALL FAMILY NOW"* button allows the senior to alert family viewers immediately with one touch.
- **5+ Foot Optical Fall Detection**: Tracks human optical centroid velocity down to the floor without requiring wearable pendants or wristbands. Flags rapid plunge followed by floor immobility.
- **Hands-Free Emergency Voice Keyword Detection**: Continuously listens for distress keywords like *"Help"*, *"Emergency"*, or *"I fell"*, instantly alerting all connected family viewer phones. Accidental triggers can be cancelled verbally by saying *"I am okay"*.
- **Bathroom Privacy Shield**: Optically blurs video for senior privacy and dignity while keeping optical fall detection and voice keywords active.
- **⚠️ Legal Disclaimer**: HGuard is an informational DIY monitoring tool for personal and family communication. It is not an alarm company, certified life-safety device, fire/smoke alarm, or replacement for 911 emergency services.

### 5. 📱 Instant QR Code Pairing for Zero Configuration
- **Visual QR Pairing Modal**: Generate a unique, encrypted QR code on the master viewer.
- **Old Phone QR Scanner**: Point the old phone camera at the screen for instant zero-touch pairing—no Wi-Fi configurations, manual logins, or URLs to type.

### 6. 🔋 Battery 80% Swelling Protection & Acoustic Chime
- **Lithium-Ion Safety**: Continuous charging at 100% causes dangerous lithium battery swelling and hardware degradation.
- **Acoustic Unplug Reminder**: Constantly tracks battery level and sounds an acoustic alarm when battery reaches 80%, reminding caregivers to unplug the charger.
- **Low-Battery Safety Warning**: Warns if the phone drops below 20% to prevent unexpected shutdowns.

### 7. ❄️ Eco-Cool Blackout & Thermal Overheat Guard
- **OLED/LCD Blackout Mode**: Darkens the screen completely to prevent display burn-in and heat accumulation, lowering thermal dissipation by up to 75% while surveillance runs silently in the background.
- **Thermal Status Sensor & Dynamic Throttling**: Monitors frame rates and hardware temperature, dynamically throttling FPS from 15 FPS to 5 FPS if device warms up.

### 8. 👁️ Up to 6 Cameras + Up to 3 Viewers Multi-Screen Grid
- **6 Camera Locations**: Supports Front Door, Living Room, Bedroom, Kitchen, Backyard, and Driveway.
- **3 Concurrent Viewer Stations**: Support for multiple family members viewing concurrently (e.g., Living Room Tablet, Caregiver Phone, Office Computer).
- **4x Digital Zoom & Pan**: Digital zoom with smooth touch/cursor panning in focused single-camera view.

### 9. 🔒 End-to-End Client-Side AES-256 GCM Encryption
- **Encrypted Local Logs & Snapshots**: All event logs and snapshots are encrypted client-side with AES-256 GCM using a user-chosen 4-digit PIN.
- **Zero-Knowledge Architecture**: Video streams and snapshot archives are never sent unencrypted.

---

## 🚀 Deployment & Offline Usage

### Option 1: Live via GitHub Pages
Visit: [https://sandipy.github.io/Hguard2/](https://sandipy.github.io/Hguard2/)  
Runs instantly in any modern web browser without server setup or dependencies.

### Option 2: Run Completely Offline
1. Download `hguard-offline.zip` from this repository or download it from within the app UI.
2. Unpack the zip file into any folder.
3. Open `index.html` directly in Chrome, Edge, Safari, or Firefox, or run a local HTTP server:
   ```bash
   python3 -m http.server 8080
   # Open http://localhost:8080
   ```

### Option 3: Run Full-Stack Local Development
```bash
# 1. Clone the repository
git clone https://github.com/sandipy/Hguard2.git
cd Hguard2

# 2. Install dependencies
npm install

# 3. Start development server (Port 3000)
npm run dev

# 4. Open in browser
http://localhost:3000
```

### Production Build & Sync Script:
```bash
# Automated build, offline zip packaging, and push to GitHub (main + gh-pages)
python3 scripts/deploy_github.py
```

---

## 📡 Full-Stack API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, camera count, and storage status |
| `GET` | `/api/git-info` | Current GitHub repository and GitHub Pages configuration |
| `GET` | `/api/download-offline-zip` | Serves the ready-to-run offline standalone bundle |
| `POST` | `/api/ai-detect` | Multimodal Gemini Vision snapshot classification and bounding boxes |
| `GET` | `/api/cloud-storage/events` | Retrieves 30-day recorded security events |
| `POST` | `/api/cloud-storage/save` | Stores a recorded surveillance clip |
| `DELETE` | `/api/cloud-storage/delete/:id` | Deletes a stored clip |

---

## 👥 Authors & Credits

- **Repository**: [https://github.com/sandipy/Hguard2](https://github.com/sandipy/Hguard2)
- **Live Web Application**: [https://sandipy.github.io/Hguard2/](https://sandipy.github.io/Hguard2/)
- **Developer**: sandipy
- **Powered by**: Google AI Studio & Gemini Multimodal Vision
