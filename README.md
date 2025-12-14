# S-Laundry AIOps Dashboard

S-Laundry AIOps is an internal analytics dashboard used by Snoonu to monitor and understand customer feedback for the laundry vertical.

The app ingests customer reviews from multiple sources, classifies them by sentiment and operational aspect (e.g. timeliness, driver behavior), and provides an AI-powered “Ask your data” interface so ops and CX teams can quickly investigate issues without digging manually through raw text.

> Note: This is an internal MVP, not a public-facing product.

---

## Core Purpose

The main goal of this dashboard is to help Snoonu teams answer questions like:

- “Are we getting better or worse this week?”
- “What are customers most unhappy about right now?”
- “Is the main problem delivery timeliness, order completeness, driver behavior, or cleaning quality?”
- “Can I get a concise explanation of what’s going on from recent reviews?”

Instead of manually exporting CSVs and reading thousands of comments, the dashboard gives:
- **High-level KPIs**
- **Aspect-level breakdowns**
- **AI summaries and explanations** over the live review data

---

## Key Features

### 1. Review Ingestion & Sentiment Analytics
- Fetches customer reviews from the backend (`/api/reviews/`).
- Each review includes:
  - Source (e.g. app, platform)
  - Original complaint text
  - Detected language
  - Overall sentiment (Positive / Neutral / Negative)
  - Aspect sentiments:
    - Timeliness  
    - Order completeness  
    - Driver behavior  
    - Cleaning quality  

### 2. KPI Overview
The top overview section summarizes, for the current filters:

- **Total reviews**  
- **Negative share (%)** – percentage of reviews that are negative  
- **Net sentiment score** – from –100 (all negative) to +100 (all positive)  
- **Top pain point** – the aspect with the most negative mentions

This gives an “at-a-glance” view of overall health and where to focus.

### 3. Aspect-Level Breakdown
- Compact cards for each aspect:
  - Timeliness
  - Order completeness
  - Driver behavior
  - Cleaning quality
- Each card shows:
  - How many reviews mention that aspect
  - How many are negative, positive, and neutral
- (Optional interaction) Aspect selection can drive the main sentiment chart, so you can focus on a single dimension.

### 4. Sentiment Overview Chart
- A simple bar chart showing counts of Positive / Neutral / Negative for the current slice of data (or for a selected aspect).
- Helps visualize the balance of sentiment at a glance.

### 5. Filters & Search
- **Text search**: filter by complaint text, source, or language.
- **Sentiment filter**: All / Positive / Neutral / Negative.
- **Date range filter**: “From” and “To” dates using `created_ts`.
- All filters apply consistently to:
  - KPIs
  - Chart
  - Aspect stats
  - Reviews table

### 6. “Ask Your Data” (AI Q&A)
- Textarea where ops/CX users can ask natural-language questions, e.g.:
  - “Why are customers unhappy with delivery times this week?”
  - “What are the main complaints from the last 7 days?”
- Backend endpoint (`/api/ask/`) calls an LLM (currently via local or external model, depending on configuration) with:
  - The user’s question
  - A selection of relevant reviews as context
- Response is shown in a clean, non-technical format focused on operational insights (not just generic text).

### 7. Review Table
- Scrollable table of recent reviews, aligned with all active filters.
- Shows:
  - Source
  - Complaint text
  - Overall sentiment (with a badge)
  - Language
- Designed as a “drill-down” view after looking at KPIs and charts.

---

## Tech Stack

**Frontend**

- Next.js (App Router)
- React
- Tailwind CSS (utility-first styling)
- Recharts (for the sentiment bar chart)
- TypeScript

**Backend (separate project / service)**

- Django
- REST API endpoints:
  - `GET /api/reviews/` – returns the classified review data.
  - `POST /api/ask/` – accepts `{ question }` and returns an AI-generated answer.
- (Optional) Local LLM via Ollama or external LLM provider for AI summaries.

---

## Architecture Overview

At a high level:

1. **Data pipeline / backend** collects and preprocesses reviews:
   - Scraping / ingestion (outside this repo)
   - Cleaning, language detection, sentiment & aspect classification
   - Storage in a database (accessed by Django)

2. **Django API** exposes:
   - `/api/reviews/` – front-end uses this for metrics, charts, and table
   - `/api/ask/` – front-end uses this for AI Q&A

3. **Next.js dashboard**:
   - On load, calls `/api/reviews/` using `NEXT_PUBLIC_API_BASE_URL`.
   - Computes all KPIs and charts client-side, based on current filters.
   - Sends Q&A requests to `/api/ask/` for AI explanations.

---

## Getting Started (Frontend Only)

This repo is the **Next.js dashboard**. It expects a backend running and exposing `/api/reviews/` and `/api/ask/`.

### Prerequisites

- Node.js (LTS version recommended)
- A running backend (Django or other API) reachable at some base URL.

### 1. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
