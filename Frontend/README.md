# HrVita

Heart rate variability monitoring dashboard. Register patients, stream heart rate from an ESP32 over WiFi, chart heart rate against its rolling standard deviation, and ask an AI assistant about the data.

Built with React, Vite, Tailwind CSS, Recharts, and a small Express server for the AI assistant.

## Features

- **Dashboard:** patient count, active monitoring, critical and high-priority alerts, patient cards with optional photos
- **Heart rate monitor:** connect to an ESP32 by IP, or use simulated data; live chart of BPM and standard deviation; recent readings list
- **AI assistant:** chat about HRV and current patient data, with voice input (Chrome/Edge)

## Getting started

```bash
npm install
cp .env.example .env      # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:5173. `npm run dev` starts both the web app (port 5173) and the API server (port 3001). The dashboard and monitor work without an API key; only the AI assistant needs one.

## Connecting an ESP32

1. Flash `firmware/esp32_hrv.ino` (fill in your WiFi details and sensor code).
2. Open the Serial Monitor and copy the IP address it prints.
3. In HrVita, open a patient, enter the IP, and click **Connect to ESP32**.

The app polls `GET http://<ip>/data` every 2 seconds and expects JSON like `{"bpm": 72}`.

> Browsers block `http://` requests from `https://` pages, so run the app locally (`npm run dev`) when talking to the ESP32 over your LAN.

## How alerts work

Each reading stores the heart rate and the standard deviation of the last 10 heart-rate readings. A patient's latest SD below 15 is **critical**, below 25 is **high priority**. Change these in `src/lib/hrv.js`.

## Data storage

Patients and readings are saved in the browser's localStorage (`src/lib/store.js`), so they stay on the device you use. To share data across devices, replace the functions in that file with calls to a database such as Supabase or Firebase.

## Project structure

```
src/
  components/   Layout, stat cards, add-patient dialog
  pages/        Dashboard, HeartRateMonitor, Chat
  lib/          store (persistence), hrv (math + alerts), esp32 (polling + simulator)
server/         Express proxy for the Anthropic API
firmware/       Example ESP32 sketch
```

## Disclaimer

HrVita is a prototype and is not a medical device. Don't use it for clinical decisions.
