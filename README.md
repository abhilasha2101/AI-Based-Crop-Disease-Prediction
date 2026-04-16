# 🌾 AI-Based Crop Disease Detection & Prediction System

An AI-powered full-stack system that **predicts whether crops could get diseases** based on weather conditions. Also supports image-based detection, real-time weather data, and mandi (market) prices for Indian agriculture.

**Supported Crops:** Rice 🍚 | Potato 🥔 | Tea 🍵 | Makhana 🫘

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [MongoDB Collections](#mongodb-collections)
- [Configuration](#configuration)
- [Training ML Models](#training-ml-models)

---

## 🏗️ Architecture

```
User → React Frontend (Port 5173)
           ↓
     Spring Boot API (Port 8080)
        ↓         ↓           ↓
  Python ML    OpenWeather   MongoDB
  Service      Map API       (Port 27017)
  (Port 8000)
```

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | React 19 + Vite | `5173` |
| Backend | Spring Boot 3.2 (Java 17) | `8080` |
| ML Service | Python FastAPI | `8000` |
| Database | MongoDB 7 | `27017` |

---

## ✨ Features

- **Disease Prediction** — Predict if a plant *could* get a disease based on temperature, humidity, rainfall
- **Image Detection** — Upload leaf images for CNN-based disease classification
- **JWT Authentication** — Secure signup/login with role-based access (Farmer/Admin)
- **Weather Data** — Real-time weather for 30+ Indian districts via OpenWeatherMap
- **Mandi Prices** — Crop market prices with 30-day trends and charts
- **Dashboard** — Aggregated view with stats, predictions, weather & prices

---

## 📁 Project Structure

```
AI-Based-Crop-Disease-Prediction/
│
├── ml-service/                  # Python ML Microservice
│   ├── main.py                  # FastAPI server
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   ├── weather_predictor.py # Weather-based disease prediction
│   │   └── image_classifier.py  # CNN image classification
│   ├── training/
│   │   └── train_model.py       # Model training pipeline
│   └── saved_models/
│       ├── potato_mega_model.pkl # Pre-trained potato model
│       └── rice_mega_model.pkl   # Pre-trained rice model
│
├── backend/                     # Spring Boot Backend
│   ├── pom.xml                  # Maven dependencies
│   ├── mvnw / mvnw.cmd          # Maven wrapper
│   └── src/main/
│       ├── resources/
│       │   └── application.yml  # App configuration
│       └── java/com/cropai/
│           ├── CropAiApplication.java
│           ├── config/          # SecurityConfig
│           ├── controller/      # Auth, Crop, Weather, Mandi, Dashboard
│           ├── dto/             # Request/Response DTOs
│           ├── model/           # MongoDB documents
│           ├── repository/      # MongoDB repositories
│           ├── security/        # JWT provider & filter
│           └── service/         # Business logic
│
├── frontend/                    # React Frontend
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Routing & layout
│       ├── index.css            # Design system (700+ lines)
│       ├── context/
│       │   └── AuthContext.jsx   # Authentication state
│       ├── services/
│       │   └── api.js           # Axios API client
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── SignupPage.jsx
│           ├── DashboardPage.jsx
│           ├── PredictionPage.jsx
│           ├── DetectionPage.jsx
│           ├── WeatherPage.jsx
│           └── MandiPage.jsx
│
└── docker-compose.yml           # MongoDB container
```

---

## 🛠️ Prerequisites

You need these installed on your machine before starting:

### Required Software

| Software | Version | Check Command | Install Command (macOS) |
|----------|---------|--------------|------------------------|
| **Java JDK** | 17+ | `java --version` | `brew install openjdk@17` |
| **Maven** | 3.8+ | `mvn --version` | `brew install maven` |
| **Python** | 3.9+ | `python3 --version` | `brew install python3` |
| **pip** | Latest | `pip3 --version` | Comes with Python |
| **Node.js** | 18+ | `node --version` | `brew install node` |
| **npm** | 9+ | `npm --version` | Comes with Node.js |
| **MongoDB** | 6+ | `mongosh --version` | `brew install mongodb-community` |

### Optional

| Software | Purpose | Install |
|----------|---------|---------|
| Docker | Run MongoDB in container | `brew install docker` |
| OpenWeatherMap API Key | Live weather data | [Sign up free](https://openweathermap.org/api) |

---

## 📦 Installation

Open your terminal and run these commands **step by step**:

### Step 1: Clone / Navigate to Project

```bash
cd ~/AI-Based-Crop-Disease-Prediction
```

### Step 2: Install Python ML Service Dependencies

```bash
cd ml-service
pip3 install -r requirements.txt
cd ..
```

This installs:
- `fastapi` — API framework
- `uvicorn` — ASGI server
- `tensorflow` — Deep learning
- `scikit-learn` — ML models
- `joblib` — Model loading
- `Pillow` — Image processing
- `numpy` — Numerical computing
- `python-multipart` — File uploads
- `pydantic` — Data validation

### Step 3: Install React Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

This installs:
- `react` / `react-dom` — UI framework
- `react-router-dom` — Page routing
- `axios` — HTTP client
- `recharts` — Charts & graphs
- `lucide-react` — Icons
- `react-is` — React utilities

### Step 4: Install Spring Boot Backend Dependencies

```bash
cd backend
./mvnw clean compile -DskipTests
cd ..
```

Maven will automatically download:
- `spring-boot-starter-web` — REST APIs
- `spring-boot-starter-data-mongodb` — MongoDB ORM
- `spring-boot-starter-security` — Authentication
- `spring-boot-starter-webflux` — Reactive HTTP client
- `jjwt` — JWT token generation
- `lombok` — Code generation

### Step 5: Start MongoDB

**Option A — If MongoDB is installed locally:**
```bash
# macOS (Homebrew)
brew services start mongodb-community
```

**Option B — Using Docker:**
```bash
docker-compose up -d
```

### Step 6: Configure API Keys (Optional)

Edit `backend/src/main/resources/application.yml`:
```yaml
app:
  weather:
    api-key: YOUR_OPENWEATHERMAP_API_KEY   # Replace with your key
```

> **Without an API key**, weather data will use simulated values (the app still works fine).

---

## 🚀 Running the Application

You need **3 terminal windows** — one for each service:

### Terminal 1 — Start ML Service (Python)

```bash
cd ~/AI-Based-Crop-Disease-Prediction/ml-service
python3 main.py
```

Expected output:
```
✅ Potato weather prediction model loaded
✅ Rice weather prediction model loaded
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Start Backend (Spring Boot)

```bash
cd ~/AI-Based-Crop-Disease-Prediction/backend
./mvnw spring-boot:run
```

Expected output:
```
✅ Seeded 480 mandi price records
Started CropAiApplication in X.XX seconds
```

### Terminal 3 — Start Frontend (React)

```bash
cd ~/AI-Based-Crop-Disease-Prediction/frontend
npm run dev
```

Expected output:
```
VITE v8.x.x  ready in XXms
➜  Local: http://localhost:5173/
```

### Open in Browser

Go to: **http://localhost:5173**

1. Click **"Create Account"** to sign up
2. Fill in your name, email, password, and select role (Farmer)
3. You'll be taken to the **Dashboard**

---

## 📡 API Reference

### Authentication (No JWT required)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | `{ name, email, password, role }` | Create account |
| `POST` | `/api/auth/login` | `{ email, password }` | Login → returns JWT |

### Disease Prediction (JWT required)

| Method | Endpoint | Body / Params | Description |
|--------|----------|--------------|-------------|
| `POST` | `/api/crop/predict` | `{ crop, temperature, humidity, rainfall, waterDepth }` | Predict disease risk |
| `POST` | `/api/crop/upload` | `FormData: crop, image` | Upload image for detection |
| `GET` | `/api/crop/results` | — | Get prediction history |
| `GET` | `/api/crop/uploads` | — | Get upload history |

### Weather (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/weather/{district}` | Weather for a district |
| `GET` | `/api/weather/all` | All districts weather |
| `GET` | `/api/weather/districts` | List of districts |

### Mandi Prices (Public)

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/mandi/prices` | `crop`, `state` | Prices by crop |
| `GET` | `/api/mandi/trends` | `crop`, `days` | Price trend |
| `GET` | `/api/mandi/summary` | — | All crops summary |

### Dashboard (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Aggregated user dashboard |

---

## 🗄️ MongoDB Collections

The database `cropai` contains 5 collections:

| Collection | Description |
|-----------|-------------|
| `users` | User accounts (name, email, hashed password, role) |
| `crop_uploads` | Uploaded crop images metadata |
| `disease_results` | Prediction/detection results with confidence scores |
| `weather_cache` | Cached weather data (6-hour TTL) |
| `mandi_prices` | Crop market prices (auto-seeded with 30 days of data) |

---

## ⚙️ Configuration

All backend configuration is in `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8080                              # Backend port

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/cropai # MongoDB connection

app:
  jwt:
    secret: YourSecretKey                  # Change in production!
    expiration-ms: 86400000                # Token validity (24 hours)
  ml-service:
    url: http://localhost:8000             # Python ML service URL
  weather:
    api-key: YOUR_KEY                      # OpenWeatherMap API key
  upload:
    dir: ./uploads                         # Image upload directory
```

---

## 🧠 Training ML Models

To train CNN models on your own dataset:

```bash
cd ml-service

# Dataset structure required:
# data/
#   potato/
#     Healthy/        (images)
#     Early_Blight/   (images)
#     Late_Blight/    (images)
#   rice/
#     Healthy/        (images)
#     Rice_Blast/     (images)
#     ...

# Train single crop
python3 training/train_model.py --crop potato --data-dir ./data --epochs 30

# Train all crops
python3 training/train_model.py --crop all --data-dir ./data --epochs 30
```

Trained models will be saved to `ml-service/saved_models/`.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB connection refused` | Run `brew services start mongodb-community` or `docker-compose up -d` |
| `ML Service connection error` | Make sure Terminal 1 is running `python3 main.py` |
| `Port 8080 already in use` | Kill existing process: `lsof -i :8080` then `kill -9 <PID>` |
| `npm install fails` | Try `rm -rf node_modules package-lock.json && npm install` |
| `Maven build fails` | Run `./mvnw clean compile -DskipTests` |
| `Weather shows simulated data` | Add your OpenWeatherMap API key in `application.yml` |

---

## 📜 License

This project is for educational purposes.

---

**Built with ❤️ for Indian Agriculture**
