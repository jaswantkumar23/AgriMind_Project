# 🌱 AgriMind — AI-Powered Smart Farming Assistant

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=for-the-badge&logo=google" />
</p>

> **Final Year Project (FYP)** — An intelligent agricultural advisory system designed for farmers in Mirpurkhas Division, Sindh, Pakistan. AgriMind combines real-time soil sensor data, custom-trained Machine Learning models, and Google's Gemini AI to deliver soil diagnostics, crop recommendations, and disease detection in Urdu, Sindhi, and English.

---

## 📖 Table of Contents

- [Project Purpose](#-project-purpose)
- [Key Features](#-key-features)
- [AI & ML Integrations](#-ai--ml-integrations)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [How to Run](#-how-to-run)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [How It Works — Step by Step](#-how-it-works--step-by-step)

---

## 🎯 Project Purpose

AgriMind solves a critical problem for rural farmers in Mirpurkhas Division (Mirpur Khas, Umerkot, Tharparkar districts) who lack access to agronomists and soil testing labs. Farmers often plant crops in unsuitable soil conditions, leading to crop failure and financial loss.

**AgriMind acts as a pocket agronomist** that:
- Reads live soil data from a hardware probe (NPK + pH + Moisture sensor)
- Uses AI to compare real readings against ideal values for their chosen crop in their specific district
- Recommends the best crop to plant and the exact fertilizer to apply
- Diagnoses crop diseases from photos taken by the farmer
- Speaks the diagnosis aloud in the farmer's native language

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔬 **Soil Diagnostics** | Reads N, P, K, pH, and Moisture from hardware probe |
| 🤖 **AI Prescription** | Gemini AI analyzes soil data vs. district-specific ideal ranges |
| 🌾 **ML Crop Recommendation** | Custom Random Forest models predict the best crop to plant |
| 📸 **Crop Doctor** | Upload photos of diseased plants — AI diagnoses and prescribes treatment |
| 🎙️ **Voice Input** | Farmers speak their crop plans; AI parses them into structured data |
| 🔊 **AI Voice Output** | ElevenLabs TTS reads the diagnosis aloud in Urdu/Sindhi |
| 🌍 **Multilingual** | Full UI support in English, Urdu (اردو), and Sindhi (سنڌي) |
| 📊 **Dashboard** | Historical soil test records with NPK trend charts |
| 💾 **MongoDB Storage** | All reports saved to database for long-term tracking |
| 🌤️ **Live Weather** | Real-time temperature and wind data integrated into AI analysis |

---

## 🧠 AI & ML Integrations

AgriMind uses a **dual-intelligence system** — a local ML model for fast predictions and Google Gemini for deep, conversational analysis.

### 1. 🤖 Google Gemini AI (`gemini-2.5-flash-lite`)

**Used for:** Soil diagnosis text generation, crop doctor image analysis, and speech parsing.

**How it works:**
- The backend builds a detailed prompt containing the farmer's soil readings (N, P, K, pH, Moisture), the district, previous crop, planned crop, and live weather data
- Gemini compares this against known ideal ranges for that district's soil type
- It generates a warm, conversational diagnosis in Urdu or Sindhi explaining exactly what is wrong and prescribing the precise fertilizer fix
- It also suggests 3-4 alternative crops that would thrive in the current soil without extra fertilizer

**Retry System:** The backend uses a smart retry system with exponential backoff. If `gemini-2.5-flash-lite` is busy (503), it automatically retries up to 4 times, then falls back to `gemini-2.0-flash`, then `gemini-1.5-flash`.

**Crop Doctor:** For the crop disease feature, Gemini Vision (`gemini-2.5-flash`) analyzes uploaded plant photos and provides a diagnosis with chemical/organic treatment recommendations.

**Speech Parsing:** When a farmer speaks their crop plans via the microphone, the raw transcript is sent to Gemini, which extracts structured fields like `prevCrop`, `plannedCrop`, and `restDuration`.

---

### 2. 🌳 Custom Random Forest ML Models (scikit-learn)

**Used for:** Fast, locally-run crop and fertilizer recommendations before the Gemini AI response.

**Two specialized models are trained:**

#### Model 1: Pre-Sowing Crop Recommendation (`model1_presowing.pkl` — ~90MB)
- **Input:** District, Soil Type, Previous Crop, N, P, K, pH, Moisture
- **Output:** The single best crop to plant given current soil conditions
- **Training:** 200-tree Random Forest on 30,000 synthetic rows generated using district-specific agronomic research

#### Model 2: Growth Phase Fertilizer Recommendation (`model2_growth.pkl` — ~105MB)
- **Input:** Current Growing Crop, Growth Stage, N, P, K, pH, Moisture
- **Output:** The specific fertilizer action needed to correct deficiencies
- **Training:** 200-tree Random Forest on growth-phase data

**The ML pipeline:**
1. Node.js backend spawns a Python child process (`predict_ml.py`)
2. Input data is sent via stdin as JSON
3. Python loads the correct `.pkl` model, runs prediction, and returns JSON via stdout
4. The ML prediction is embedded into the Gemini prompt as an authoritative insight

---

### 3. 🔊 ElevenLabs Text-to-Speech

**Used for:** Converting the AI diagnosis text into natural-sounding audio for low-literacy farmers.

- Model: `eleven_multilingual_v2` (supports Urdu/Sindhi)
- Voice: Jessica (Playful, Warm, Friendly)
- The audio is returned as a Base64 MP3 and played directly in the browser
- The frontend includes a full media player with Play/Pause, Fast-forward, and Rewind controls

---

### 4. 📊 Synthetic Training Dataset (`generate_soil_data.py`)

AgriMind's ML models were trained on a **30,000-row synthetic agricultural dataset** (`mirpurkhas_agri_data.csv`) generated using:
- Per-district soil type profiles (Clay Loam for Mirpur Khas, Sandy Loam for Umerkot, Sandy for Tharparkar)
- Published agronomic research for Sindh's semi-arid zones
- Realistic NPK/pH/Moisture ranges calibrated per crop per district

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------+
|                        USER (Farmer)                        |
|            Browser @ http://localhost:3000                  |
+----------------------------+--------------------------------+
                             |  HTTP Requests (proxied via Vite)
                             v
+-------------------------------------------------------------+
|              Node.js + Express Backend (Port 5000)          |
|                                                             |
|   /api/predict        /api/crop-doctor    /api/parse-speech |
|   (Soil AI)           (Vision AI)         (Speech AI)       |
|         |                   |                   |           |
|         +-------------------+-------------------+           |
|                             |                               |
|                             v                               |
|       Google Gemini AI (with Smart Retry + Fallback)        |
|   gemini-2.5-flash-lite -> gemini-2.0-flash ->              |
|   gemini-1.5-flash                                          |
|                             |                               |
|         +-------------------+-------------------+           |
|         |                                       |           |
|         v                                       v           |
|   Python Child Process              MongoDB (History DB)    |
|   predict_ml.py                     /api/save-test          |
|   - Model 1: Pre-Sowing             /api/history            |
|   - Model 2: Growth Phase                                   |
|                                                             |
|   ElevenLabs TTS (/api/generate-speech)                     |
|   Open-Meteo Weather API (live weather context)             |
+-------------------------------------------------------------+
```

---

## 📁 Project Structure

```
AgriMind_Project/
|
+-- backend/                      # Node.js + Express API server
|   +-- server.js                 # Main server - all API routes + AI integration
|   +-- predict_ml.py             # Python script - loads & runs ML models
|   +-- .env                      # API keys (not committed to git)
|   +-- package.json
|
+-- frontend/                     # React + Vite frontend
|   +-- src/
|   |   +-- App.js                # Main React app - all UI tabs and logic
|   |   +-- App.css               # Custom CSS styles
|   |   +-- index.css             # Tailwind CSS directives
|   |   +-- index.js              # React DOM entry point
|   +-- vite.config.js            # Vite config - dev server + /api proxy
|   +-- tailwind.config.js        # Tailwind with custom agri-green color
|   +-- index.html                # Root HTML
|   +-- package.json
|
+-- models/                       # Trained ML model files (binary)
|   +-- model1_presowing.pkl      # Random Forest - crop recommendation (~90MB)
|   +-- model2_growth.pkl         # Random Forest - fertilizer recommendation (~105MB)
|
+-- data/
|   +-- mirpurkhas_agri_data.csv  # 30,000-row synthetic training dataset
|
+-- generate_soil_data.py         # Script to regenerate the training dataset
+-- train_models.py               # Script to retrain the ML models
+-- .gitignore
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Axios, Recharts, Lucide Icons |
| **Backend** | Node.js, Express 5, dotenv |
| **Database** | MongoDB (via Mongoose) |
| **AI / LLM** | Google Gemini AI (`@google/genai`) |
| **ML Models** | Python, scikit-learn (Random Forest), pandas, pickle |
| **TTS Voice** | ElevenLabs API |
| **Weather** | Open-Meteo API (free, no key required) |
| **Geolocation** | Browser Geolocation API + Nominatim (OpenStreetMap) |

---

## ✅ Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher — https://nodejs.org/
- **Python** 3.8 or higher — https://www.python.org/
- **MongoDB** (local) OR a MongoDB Atlas connection string
- **Python packages:** `pip install pandas numpy scikit-learn`

---

## 📦 Installation & Setup

### Step 1 — Clone the repository
```bash
git clone <your-repo-url>
cd AgriMind_Project
```

### Step 2 — Install Backend dependencies
```bash
cd backend
npm install
```

### Step 3 — Install Frontend dependencies
```bash
cd ../frontend
npm install
```

### Step 4 — Configure environment variables
Create/edit `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/agrimind
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
PYTHON_CMD=python
```

> Get a **free** Gemini API key at: https://aistudio.google.com/app/apikey

### Step 5 — (Optional) Retrain ML models
Only needed if you want to regenerate the dataset or retrain models:
```bash
cd AgriMind_Project
python generate_soil_data.py   # generates data/mirpurkhas_agri_data.csv
python train_models.py          # trains and saves models/*.pkl files
```

---

## 🚀 How to Run

You need **two terminals** running simultaneously.

### Terminal 1 — Start the Backend
```bash
cd AgriMind_Project/backend
npm start
```
You should see:
```
📡 Server is running on port: 5000
🚀 Mubarak ho! MongoDB Atlas se connection ho gaya
```

### Terminal 2 — Start the Frontend
```bash
cd AgriMind_Project/frontend
npm run dev
```
You should see:
```
VITE v6.x  ready in ~1000ms
  Local:   http://localhost:3000/
```

Open your browser at **http://localhost:3000**

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs API key (voice feature) |
| `PYTHON_CMD` | Yes | Python executable (`python` or `python3`) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict` | Main soil analysis — runs ML + Gemini AI |
| `POST` | `/api/crop-doctor` | Analyzes crop disease from image(s) using Gemini Vision |
| `POST` | `/api/parse-speech` | Parses farmer speech transcript into structured form data |
| `POST` | `/api/generate-speech` | Converts AI diagnosis text to audio via ElevenLabs |
| `POST` | `/api/save-test` | Saves a soil test report to MongoDB |
| `GET`  | `/api/history` | Retrieves all historical soil test records |
| `GET`  | `/` | Health check — returns "AgriMind Backend is Running!" |

---

## 🔄 How It Works — Step by Step

### Flow 1: Soil AI Diagnosis

```
1. Farmer clicks "📡 Dip Probe & Read Values"
   -> Sensor values (N, P, K, pH, Moisture) are read from hardware probe

2. Farmer selects soil source district, previous crop, rest duration,
   and planned crop (or speaks it via microphone)
   -> Voice is transcribed by browser and parsed by Gemini AI

3. Frontend sends POST /api/predict with all data

4. Backend:
   a. Fetches live weather from Open-Meteo API
   b. Spawns Python process -> runs Random Forest model
   c. Gets ML crop recommendation (e.g., "Wheat")
   d. Builds detailed prompt combining all data
   e. Calls Gemini AI (with retry/fallback on 503 errors)
   f. Gemini compares readings vs. ideal district ranges
   g. Returns JSON: { decision, diagnosisText, waitTime, alternatives }

5. Frontend displays:
   - PROCEED / STOP & WAIT decision
   - Detailed Urdu/Sindhi diagnosis text
   - Alternative crop cards with detailed explanations
   - ElevenLabs voice playback with full media controls
```

### Flow 2: Crop Doctor (Disease Detection)

```
1. Farmer takes 1-5 photos of diseased crop leaves using camera
2. Frontend encodes images as Base64
3. POST /api/crop-doctor -> Gemini Vision analyzes all images together
4. Returns: disease name, diagnosis, treatment recommendation
5. ElevenLabs reads the diagnosis aloud in farmer's language
```

### Flow 3: Historical Dashboard

```
1. Farmer clicks "Save to DB" after receiving diagnosis
2. POST /api/save-test -> stored in MongoDB
3. Dashboard tab -> GET /api/history retrieves all records
4. Recharts LineChart shows NPK trend over time
5. Recent tests list shows PROCEED/STOP decision per date
```

---

*AgriMind — "Har Kisan ka Digital Mushir" (Every Farmer's Digital Advisor)*

Made for the farmers of Sindh, Pakistan.
