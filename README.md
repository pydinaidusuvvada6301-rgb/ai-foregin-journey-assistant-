# VisaVoyage AI — Intelligent Foreign Journey Advisory Assistant

**VisaVoyage AI** is an enterprise-grade, high-security international mobility SaaS platform built with strict architectural separation between client rendering, server-side business logic and AI orchestration, and database/auth persistence.

---

## 🏛️ Architectural Separation

```
visavoyage-ai/
├── frontend/                   # 🖥️ FRONTEND ONLY (React 18 + Vite + Tailwind CSS)
│   ├── src/components/         # Itinerary cards, Visa wizard, Doc scanner, Badges
│   ├── src/pages/              # Landing, Login, Signup, Dashboard, Itinerary, VisaChecker, DocScanner, Settings
│   ├── src/schemas/            # Frontend Zod validation schemas
│   ├── src/context/            # Supabase AuthContext & Instant Demo Session
│   └── src/lib/                # Supabase JS client & Axios with Bearer JWT injection
├── backend/                    # ⚙️ BACKEND ONLY (Node.js + Express.js + TypeScript ESM)
│   ├── src/controllers/        # AI orchestration, Itineraries, Visa checks, Profiles
│   ├── src/middleware/         # Supabase JWT verification (requireAuth), Error handlers
│   ├── src/schemas/            # Backend Zod validation schemas
│   ├── src/routes/             # /api/ai, /api/itineraries, /api/visa-checks, /api/profile
│   └── src/services/           # @google/genai SDK (gemini-2.5-flash) & Supabase Admin Client
├── start-frontend.bat          # Standalone 1-click Frontend runner
├── start-backend.bat           # Standalone 1-click Backend runner
└── supabase-schema.sql         # Production PostgreSQL schema with Row-Level Security (RLS)
```

---

## 🚀 Key Features

1. **Strict Frontend/Backend Boundary**: The browser client never touches or holds Google Gemini API keys or privileged Supabase service role keys. All AI processing and privileged writes are brokered by the Express backend.
2. **Supabase Authentication & Row-Level Security (RLS)**: Client login/signup flows emit standard JWT bearer tokens. The backend `requireAuth` middleware verifies the JWT against Supabase GoTrue Auth, and database queries strictly enforce `auth.uid() = user_id`.
3. **AI Foreign Journey & Visa Advisor**: Powered by the official `@google/genai` SDK using `gemini-2.5-flash`, providing structured JSON outputs for:
   - Phased day-by-day itineraries with morning/afternoon/evening activities
   - Itemized budget breakdowns (Accommodation, Transit & Food, Activities, Total range)
   - Emergency contacts, cultural etiquette, and essential travel tips
4. **Global Visa Policy & Immigration Wizard**:
   - Automated passport origin to destination matching
   - Real-time verdict (Visa Free, eVisa, Visa on Arrival, Embassy Visa Required)
   - Permitted stay duration, processing turnaround, and fees
   - Mandatory document checklist with interactive checkboxes
   - Solvency proof guidelines and mandatory health/vaccine mandates
5. **Multimodal Document & Passport Scanner**:
   - Gemini 2.5 Flash multimodal vision analysis for passports and visas
   - Verification of the international 6-month validity standard
   - Machine Readable Zone (MRZ) and ICAO 9303 compliance inspection
   - Travel Readiness Score gauge (0–100%)
6. **Instant Interactive Demo Mode**: Reviewers and evaluators can click "Launch Interactive Demo" to test all features end-to-end immediately without needing pre-existing Supabase credentials.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend Concurrently
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 3. Environment Configuration

#### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Google Gemini API Key (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-google-genai-api-key

# Supabase Credentials (https://supabase.com)
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Frontend (`frontend/.env`)
```ini
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

Execute the contents of [`supabase-schema.sql`](supabase-schema.sql) in your **Supabase Project → SQL Editor**. It creates:
- `public.profiles`
- `public.travel_itineraries`
- `public.visa_checks`
- `public.document_checks`
- Row-Level Security policies: `auth.uid() = user_id`
- Automatic user profile creation trigger on signup
- Performance indexes on `user_id` and `created_at`
