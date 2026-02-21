# Your Voice

A React 19 web app built with Vite, Tailwind CSS, and Supabase.

## About

Your Voice is a website for content creators who want to write scripts that accurately replicate their own voice—how they would write and refine their own scripts for making content. The system uses a **recursive learning loop** to document someone's nuances until it sounds like their voice, as if they had authentically written the script themselves.

This allows people to develop their own authentic, unique-sounding version of themselves while still benefiting from the speed and generation capabilities of AI. The system is designed to be easy to use for non-coders. Use cases include:

- Script writing for videos, podcasts, and social content
- Presentations and speeches
- Any content where your authentic voice matters

### Niche Expertise

Your Voice includes a section for the AI to gain expertise on the creator's niche—understanding their knowledge, perspectives, and domain expertise. Rather than pulling from the full spectrum of the LLM's generic responses, the system draws from the creator's **specific knowledge base**, ensuring outputs stay true to both their voice and their unique expertise.

## Tech Stack

- **React 19** - Latest React
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend (auth, database, storage)
- **ESLint 9** - Linting with flat config
- **Netlify** - Deployment

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Get your Supabase URL and anon key from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

### Development

```bash
npm run dev
```

Runs at [http://localhost:3005](http://localhost:3005)

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Deployment (Netlify)

1. Push your code to GitHub
2. Connect your repo in [Netlify](https://app.netlify.com)
3. Build settings are pre-configured in `netlify.toml`
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in Netlify
