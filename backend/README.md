# VisaVoyage AI — Backend Tier (`backend/`)

This directory contains the **Server-Side REST API and AI Orchestration Engine**. It provides a secure, hardened boundary between untrusted browser clients, Google Gemini AI models, and the Supabase PostgreSQL database.

---

## 🎯 Role & Responsibilities (Backend Only)
- **Authentication Verification**: The `requireAuth` middleware validates incoming `Authorization: Bearer <JWT>` tokens against Supabase Auth, extracting and verifying `req.user.id`.
- **Payload Validation**: Strict Zod schemas (`itineraryInputSchema`, `visaCheckInputSchema`) validate and sanitize all incoming request bodies before processing.
- **Exclusive AI Orchestration**: Secure server-side instantiation of the `@google/genai` SDK using `GEMINI_API_KEY`, communicating with `gemini-2.5-flash` with structured JSON schema outputs.
- **Multimodal File Processing**: Multer middleware safely buffers passport/visa image uploads into memory and passes them to Gemini multimodal vision models.
- **Database Persistence**: Writes verified records to Supabase PostgreSQL using the authenticated user ID, upholding Row-Level Security (RLS).
- **Security Hardening**:
  - `helmet`: Sets secure HTTP headers, CSP, and CORS policies.
  - `express-rate-limit`: Prevents brute-force API abuse (150 requests per 15 minutes per IP).

---

## 🚫 Explicit Backend Prohibitions
1. **NO UI Rendering**: The backend does not serve JSX, React, or server-side rendered HTML templates. It is a pure, headless JSON REST API.
2. **NO Anonymous AI Calls**: AI endpoints (`/api/ai/*`) cannot be triggered without a verified Supabase JWT Bearer token.

---

## 📦 Tech Stack
- **Runtime**: Node.js (ESM modules)
- **Framework**: Express.js
- **AI SDK**: `@google/genai` (Model: `gemini-2.5-flash`)
- **Database/Auth**: `@supabase/supabase-js`
- **Validation**: Zod
- **Security**: Helmet, CORS, Express-Rate-Limit, Multer

---

## 🏃 Running the Backend
```bash
npm install
npm run dev
```
Runs at `http://localhost:5000`.
