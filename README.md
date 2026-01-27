# API-First Video App

This repository contains a React Native (Expo) mobile app backed by a Flask API with MongoDB. The mobile app is designed as a thin client — it calls APIs, stores a JWT securely, renders server-provided data, and sends user actions. All business logic lives on the backend.

## System Architecture

```mermaid
graph TD
  RN[React Native App (Expo)] --> API[Flask API]
  API --> DB[MongoDB]
  API --> YT[YouTube (hidden behind backend logic)]
  style YT fill:#fff,stroke:#333,stroke-dasharray: 5 5
```

- The app never directly uses raw YouTube links.
- The backend provides an embed-safe stream endpoint protected by a short-lived playback token.

## Repository Structure
- Backend: [backend/](backend)
  - Flask app entry: [backend/app.py](backend/app.py)
  - Routes: [backend/routes/auth.py](backend/routes/auth.py), [backend/routes/video.py](backend/routes/video.py)
  - Utilities: [backend/utils/jwt_helper.py](backend/utils/jwt_helper.py), [backend/utils/auth_middleware.py](backend/utils/auth_middleware.py), [backend/utils/video_token.py](backend/utils/video_token.py)
  - Dependencies: [backend/requirements.txt](backend/requirements.txt)
  - Environment example: [backend/.env.example](backend/.env.example)
- Mobile App (Expo): [videoApp/](videoApp)
  - Auth screens: [videoApp/app/login.tsx](videoApp/app/login.tsx), [videoApp/app/signup.tsx](videoApp/app/signup.tsx)
  - Tabs + Dashboard: [videoApp/app/(tabs)/index.tsx](videoApp/app/(tabs)/index.tsx)
  - Player: [videoApp/app/player.tsx](videoApp/app/player.tsx)
  - Settings (placeholder): [videoApp/app/(tabs)/explore.tsx](videoApp/app/(tabs)/explore.tsx)
  - API client: [videoApp/src/services/api.ts](videoApp/src/services/api.ts)

## Running the Backend (Windows)

Prerequisites:
- Python 3.11+
- MongoDB running locally or remotely
- Configure environment variables in `.env`

Setup:
```powershell
cd C:\Users\jayan\Desktop\api-first-video-app\backend
python -m venv venv
venv\Scripts\Activate
pip install -r requirements.txt
# Copy .env.example to .env and set values
# MONGO_URI=mongodb://localhost:27017
# SECRET_KEY=your_secret_key
python app.py
```
- The server runs on `http://127.0.0.1:5000` and your LAN IP (e.g., `http://192.168.1.67:5000`).
- For physical devices, ensure Windows Firewall allows port 5000:
```powershell
New-NetFirewallRule -DisplayName "Flask 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

## Running the Frontend (Windows)

Prerequisites:
- Node.js 18+

Setup:
```powershell
cd C:\Users\jayan\Desktop\api-first-video-app\videoApp
npm install
npm start -- --clear
```
Optional environment override (device or explicit control):
- Create `videoApp/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.67:5000
```
Restart Expo after setting this.

## App Screens & Behavior

- No business logic, filtering, or hardcoded content in the app.
- The app calls APIs, stores a JWT, renders server data, and sends user actions.

1. Authentication
- Signup: Name, Email, Password — on success store JWT and go to Dashboard.
- Login: Email, Password — on success store JWT and go to Dashboard.

2. Dashboard (Home)
- Shows 2 active videos from the backend.
- Each tile: Thumbnail, Title, Description.
- Tap a tile to open the Video Player.

3. Video Player
- Plays video via backend-abstracted stream endpoint.
- Controls: Play/Pause, Seek, Mute/Unmute (via WebView/YouTube embed controls).
- The app consumes `stream_url` returned after validating `playback_token` — no raw YouTube links.

4. Settings
- Shows user name and email.
- Logout button clears JWT.

## API Reference

### Auth Endpoints
- POST `/auth/signup`
  - Body: `{ name, email, password }`
  - Returns: `{ token }`
- POST `/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ token }`
- GET `/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Returns: `{ name, email }`
- POST `/auth/logout`
  - Mock or invalidate token.

### Video Endpoints
- GET `/dashboard`
  - Header: `Authorization: Bearer <token>`
  - Returns: `[{ id, title, description, thumbnail_url, playback_token }]` (2 items only)
- GET `/video/<id>/stream?token=<playback_token>`
  - Validates the signed playback token and returns `{ stream_url }` (embed-safe URL).

### YouTube Abstraction
- Server returns a short-lived `playback_token` per video in `/dashboard`.
- App requests `/video/<id>/stream?token=...`.
- App renders the returned `stream_url` via `WebView` without exposing raw YouTube URLs.

## Data Models

User:
```
{
  _id: ObjectId,
  name: string,
  email: string,
  password_hash: bytes,
  created_at?: Date
}
```

Video:
```
{
  _id: ObjectId,
  title: string,
  description: string,
  youtube_id: string,
  thumbnail_url: string,
  is_active: boolean
}
```

## Implementation Notes

- JWT: [backend/utils/jwt_helper.py](backend/utils/jwt_helper.py) (`HS256`, 1-hour expiry).
- Playback Token: [backend/utils/video_token.py](backend/utils/video_token.py) (short-lived, video-bound).
- Auth Middleware: [backend/utils/auth_middleware.py](backend/utils/auth_middleware.py) guards protected routes; allows CORS preflight.
- Dashboard returns only active videos: [backend/routes/video.py](backend/routes/video.py).
- Frontend axios base URL is platform-aware: [videoApp/src/services/api.ts](videoApp/src/services/api.ts).
  - Uses `EXPO_PUBLIC_API_URL` if set.
  - Web uses current hostname.
  - Native uses Expo host (maps Android emulator `localhost` → `10.0.2.2`).

## Quick Test (cURL)

```bash
# Signup
curl -X POST http://127.0.0.1:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret"}'

# Login
curl -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
# => save token

# Me
curl http://127.0.0.1:5000/auth/me -H "Authorization: Bearer <token>"

# Dashboard
curl http://127.0.0.1:5000/dashboard -H "Authorization: Bearer <token>"

# Stream (replace <id> and <playback_token> from dashboard response)
curl "http://127.0.0.1:5000/video/<id>/stream?token=<playback_token>"
```

## Optional Enhancements
- Refresh tokens + silent renew.
- Token expiry handling in app (auto-redirect on 401).
- Rate limiting `/auth/login`.
- Basic logging.
- Deployment pipeline.
- Pagination-ready dashboard.
- Video watch tracking endpoint.

---

If helpful, we can add a `videoApp/.env.example` with `EXPO_PUBLIC_API_URL` to simplify device testing.