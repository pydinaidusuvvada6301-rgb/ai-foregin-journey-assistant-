# VisaVoyage AI — Frontend Tier (`frontend/`)

This directory contains the **Client-Side Single-Page Application (SPA)**. It is built strictly for browser presentation, client routing, and secure JWT token forwarding.

---

## 🎯 Role & Responsibilities (Frontend Only)
- **UI Components & Views**: Render interactive dashboards, journey planning forms, day-by-day itineraries, visa rule cards, and document scanner interfaces.
- **Client Routing**: Managed via `react-router-dom` with authentication route guards (`<ProtectedRoute />`).
- **Supabase GoTrue Auth Client**: Handles user login and signup directly with Supabase Auth, receiving short-lived JWT Bearer tokens stored securely in client state/cookies.
- **API Communication**: Uses Axios (`src/lib/api.ts`) to communicate with the Node.js Express backend via standard REST contracts, injecting `Authorization: Bearer <SUPABASE_JWT>`.

---

## 🚫 Explicit Frontend Prohibitions (Security Boundaries)
1. **NO AI Keys**: The frontend **never** imports `@google/genai` or references `GEMINI_API_KEY`.
2. **NO Service Role Keys**: Privileged database administrative keys (`SUPABASE_SERVICE_ROLE_KEY`) are **strictly prohibited** in the client bundle.
3. **NO Direct Database Mutations**: All business logic, itinerary persistence, and visa check records flow through authenticated Express backend endpoints.

---

## 📦 Tech Stack
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS (Dark-mode first, glassmorphism, glowing accents)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Type Checking**: TypeScript + Zod

---

## 🏃 Running the Frontend
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`.
