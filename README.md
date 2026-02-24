# Your Voice

An open-source AI script writing tool that learns your voice over time.

## What It Does

Your Voice helps content creators write scripts that actually sound like them. It uses a **recursive learning loop** — every time you give feedback on a generated script, the system extracts a rule and adds it to your personal voice profile. Over time, the AI gets closer and closer to how you actually talk and write.

It also lets you feed it YouTube videos from experts in your niche. It extracts their knowledge, perspectives, and communication style — so your scripts are grounded in your specific domain, not generic AI responses.

**Use cases:** video scripts, podcast outlines, social content, presentations, speeches — anything where your authentic voice matters.

---

## How It Works (Architecture)

The app has two modes that share the same frontend codebase:

**Local development** — runs an Express server alongside Vite. You bring your own API keys via `.env`. No cloud services required beyond Supabase (for auth and database).

**Deployed/hosted** — the frontend is served as a static site (Netlify). The API routes run as Supabase Edge Functions. Your OpenAI key lives in Supabase's encrypted secrets vault and never touches the browser.

The switch between modes is a single environment variable (`VITE_API_BASE`).

---

## Tech Stack

- **React 19** + **Vite** — frontend
- **Tailwind CSS** — styling
- **Supabase** — auth, database, and Edge Functions (serverless API)
- **OpenAI API** — script generation and voice rule extraction
- **Express** — local dev API server
- **Netlify** — production static hosting

---

## Local Development Setup

This is the fastest way to get running. You run everything locally with your own API keys.

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account and project (free tier works)
- An [OpenAI](https://platform.openai.com) API key

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

Get your Supabase URL and anon key from your [Supabase project settings → API](https://supabase.com/dashboard/project/_/settings/api).

> **Note:** Do not add `VITE_API_BASE` to your local `.env`. Its absence is what tells the app to use the local Express server.

### 3. Run database migrations

Install the Supabase CLI if you haven't:

```bash
npm install -g supabase
```

Link to your project and push the schema:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Your project ref is the ID in your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR-REF-HERE`

### 4. Enable Email Auth in Supabase

In your Supabase dashboard:
1. Go to **Authentication → Providers** and make sure **Email** is enabled
2. Go to **Authentication → URL Configuration** and add `http://localhost:3005` to the allowed redirect URLs

### 5. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:3005](http://localhost:3005). This starts both the Vite frontend and the Express API server together.

---

## Production Deployment (Netlify + Supabase Edge Functions)

In production, the Express server is replaced by Supabase Edge Functions. Your OpenAI key is stored as an encrypted Supabase secret — it never appears in the frontend bundle or any source file.

### 1. Deploy the Edge Functions

```bash
supabase login
supabase link --project-ref your-project-ref
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
supabase functions deploy create-content
supabase functions deploy feedback
supabase functions deploy expertise-extract
```

### 2. Push database migrations

```bash
supabase db push
```

### 3. Deploy to Netlify

1. Push your repo to GitHub
2. Connect the repo in [Netlify](https://app.netlify.com) — build settings are pre-configured in `netlify.toml`
3. Add these environment variables in **Netlify → Site → Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_BASE` | `https://your-project-ref.supabase.co/functions/v1` |

4. Trigger a deploy. The `VITE_API_BASE` variable is what switches the app from Express to Edge Functions.

### 4. Update Supabase Auth redirect URLs

In your Supabase dashboard under **Authentication → URL Configuration**, add your Netlify URL (e.g. `https://your-site.netlify.app`) to the allowed redirect URLs.

---

## Environment Variables Reference

| Variable | Required | Where | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Yes | `.env` + Netlify | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | `.env` + Netlify | Supabase public key (safe to expose — protected by RLS) |
| `OPENAI_API_KEY` | Yes | `.env` (local) or Supabase secret (production) | OpenAI API key — never put this in Netlify env vars |
| `VITE_API_BASE` | Production only | Netlify only | Points the frontend at Edge Functions. Leave unset for local dev. |

---

## Security Model

- **`OPENAI_API_KEY`** — never reaches the browser in any mode. Locally it stays in `.env` and is read by the Express server. In production it lives in Supabase's encrypted secrets vault, accessible only inside Edge Functions.
- **`VITE_SUPABASE_ANON_KEY`** — intentionally public. Supabase's security model is built around this: the anon key alone can't access anything your Row Level Security (RLS) policies don't explicitly allow. This is the same pattern Stripe uses with publishable keys.
- **`SUPABASE_SERVICE_ROLE_KEY`** — never use this in this project. It bypasses RLS entirely.

---

## Available Scripts

```bash
npm run dev      # Start local dev server (Vite + Express)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## Database Schema

Migrations live in `supabase/migrations/` and are applied in order via `supabase db push`. The schema includes:

- `profiles` — user profile and voice preferences
- `voice_rules` — per-user communication style rules (category: `voice`) and expertise items (category: `expertise`)
- `scripts` — saved generated scripts
- `script_feedback` — feedback submissions used to extract new voice rules
