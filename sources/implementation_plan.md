# HireMind — Complete Implementation Plan

## AI-Powered Recruitment Intelligence Platform | Spectrum Circle Hackathon (June 5–7, 2026)

---

## Context & Analysis

### Problem Statement (PS-3) — What Judges Want

From the [Problem Statement](file:///c:/project/hiremind/HireMind/sources/Problem%20Statement%20-%203.jpeg):

| Requirement | What It Means |
|---|---|
| **Multi-source candidate analysis** | Resume + GitHub + LeetCode + portfolio links analyzed together |
| **Explainable AI recommendations** | SELECT / REJECT / REVIEW with plain-English reasoning |
| **3 User Roles** | Recruiter/HR, Candidate, Admin |
| **Inputs** | Resume PDF/DOC, Education, Skills, Certifications, Projects, Portfolio Links, Job Description |
| **Core Functionality** | Extract & structure data, analyze across sources, match to JD, filter inconsistencies, rank candidates, explain decisions |

### Evaluation Criteria (How We Win)

| Criterion | Weight | Our Strategy |
|---|---|---|
| **Decision Accuracy** | HIGH | Multi-source enrichment (GitHub + LeetCode) + weighted scoring + AI-powered matching |
| **Explainability & Clarity** | HIGH | Streaming AI explanations + Skill Gap Heatmap + plain-English reasoning |
| **Frontend Experience** | HIGH | Premium dark/light mode, animations, real-time WebSocket progress, blind screening |
| **Backend Architecture** | MEDIUM | Clean REST + WebSocket, modular AI orchestration, MongoDB flexible schema |
| **Scalability & Performance** | MEDIUM | Batch processing (4 concurrent), capacity-based AI, queued pipeline |
| **Innovation in Solution Design** | HIGH | JD Quality Scorer, Blind Screening, Interview Coach, Feedback Loop |

### Current Codebase Audit

The existing project has a **MERN scaffold with mock data**. Here's what exists vs. what needs to be built:

| Component | Status | What Exists | What's Missing |
|---|---|---|---|
| **Auth** | 🟡 Partial | JWT login/register routes, token-based auth | Candidate role support, admin role |
| **Job Management** | 🟡 Partial | CRUD routes, basic extraction | AI-powered JD analysis, quality scoring, weights wizard |
| **Resume Upload** | 🟡 Partial | Multer upload, basic filename parsing | Real PDF text extraction (`pdf-parse`), AI-powered structured extraction |
| **AI Integration** | 🔴 Missing | No Featherless.ai integration | OpenAI SDK setup, all AI prompts, streaming SSE |
| **Candidate Scoring** | 🟡 Mock | Hardcoded scores in `data.ts` | Real AI scoring via Featherless.ai |
| **GitHub/LeetCode** | 🟡 Mock | Cached mock data in `external.ts` | Real API calls to GitHub REST + LeetCode GraphQL |
| **Skill Heatmap** | 🟡 Mock | Data structure exists | Frontend visualization component |
| **Streaming Explanations** | 🔴 Missing | Not implemented | SSE endpoint + frontend streaming consumer |
| **Blind Screening** | 🟡 Partial | `BlindToggle.tsx` exists, schema has `blindId` | Full context integration across all views |
| **Pipeline Kanban** | 🔴 Missing | No pipeline stages | Drag-and-drop Kanban board |
| **Feedback Loop** | 🟡 Partial | Feedback route + schema exists | Admin accuracy dashboard, bias detection |
| **Candidate Dashboard** | 🟡 Partial | `CandidateDashboard.tsx` page exists | Real candidate self-service, interview coach |
| **WebSocket (Socket.io)** | 🔴 Missing | Not installed or configured | Real-time parsing progress |
| **MongoDB** | 🟡 Optional | Mongoose schemas defined, runs on in-memory mock | Need to connect to Atlas for persistence |
| **Dark/Light Mode** | 🟡 Partial | Tailwind darkMode config exists | Full integration across every component |

> [!IMPORTANT]
> **The entire AI pipeline is currently mocked.** The #1 priority is wiring Featherless.ai into the backend so every AI feature (resume parsing, scoring, explanations, JD analysis, interview coach) runs on real AI inference. This is the single biggest differentiator.

---

## Proposed Changes — 6 Phases, 30+ Chunks

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite + Tailwind)               │
│  Recruiter UI │ Candidate UI │ Admin UI                          │
│  Dark/Light Mode │ Framer Motion │ Recharts │ Socket.io-client   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST + SSE + WebSocket
┌────────────────────────────▼─────────────────────────────────────┐
│                    SERVER (Node.js + Express + TypeScript)        │
│  Routes → Services → AI Service (Featherless.ai) → MongoDB      │
│  pdf-parse │ Socket.io │ OpenAI SDK │ GitHub/LeetCode APIs       │
└──────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: Foundation & Infrastructure (Hours 0–4)

*Goal: Get the plumbing right so every feature built later "just works."*

---

### Chunk 1.1: Featherless.ai Service Layer

#### [NEW] [ai.service.ts](file:///c:/project/hiremind/HireMind/server/src/services/ai.service.ts)

Create the centralized AI service using the OpenAI SDK pointed at Featherless.ai:

```typescript
// OpenAI SDK with Featherless.ai base URL
const client = new OpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY
});
```

Functions to implement:
- `analyzeJobDescription(jdText: string)` → returns `{ required_skills, nice_to_have, red_flags, clarity_score, ambiguous_areas }`
- `extractResumeData(rawText: string)` → returns structured candidate JSON
- `scoreCandidate(jdData, candidateData, githubStats, leetcodeStats, weights)` → returns `{ match_score, decision, confidence, strengths, gaps, explanation }`
- `generateExplanation(jdData, candidateData, streamCallback)` → SSE streaming
- `generateInterviewQuestions(jdData, candidateData)` → returns 5 questions with hints

**Model**: `deepseek-ai/DeepSeek-V3-0324` for all calls (advanced reasoning & coding, Feather Premium)

**Error handling**: Retry logic for 503 (cold model), API key validation for 401, model unlock prompt for 403

#### [MODIFY] [.env.example](file:///c:/project/hiremind/HireMind/server/.env.example)
Add `FEATHERLESS_API_KEY` and `FEATHERLESS_MODEL` entries

---

### Chunk 1.2: Install Core Dependencies

#### [MODIFY] [package.json](file:///c:/project/hiremind/HireMind/server/package.json)

Add to server dependencies:
- `openai` — SDK for Featherless.ai (OpenAI-compatible API)
- `pdf-parse` — Extract text from uploaded PDF resumes
- `socket.io` — Real-time WebSocket for parsing progress

Add to client dependencies:
- `socket.io-client` — WebSocket client
- `react-dropzone` — Drag-and-drop file upload
- `@hello-pangea/dnd` — Kanban drag-and-drop

---

### Chunk 1.3: MongoDB Atlas Connection

#### [MODIFY] [index.ts](file:///c:/project/hiremind/HireMind/server/src/index.ts)

- Ensure MongoDB Atlas connection works with the existing schemas
- Add Socket.io server initialization alongside Express
- Keep the in-memory fallback for demo safety (if MongoDB is unavailable, mock data still works)

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// Export io for use in routes
export { io };
```

---

### Chunk 1.4: Enhanced Database Schemas

#### [MODIFY] [schemas.ts](file:///c:/project/hiremind/HireMind/server/src/models/schemas.ts)

Enhance existing schemas to support the full feature set:

- **Job schema**: Add `weights` (github/leetcode/education importance sliders), `nice_to_have`, `red_flags`, `clarity_score`, `ambiguous_areas`
- **Candidate schema**: Add `stage` field (`applied | screening | interview | offer | hired | rejected`) for Kanban
- **Add InterviewQuestions schema**: `{ candidateId, jobId, questions: [{ question, why_asked, how_to_approach }] }`
- **User schema**: Add `'candidate'` to role enum

---

## PHASE 2: Core AI Pipeline — Resume → Score → Rank (Hours 4–12)

*Goal: The complete pipeline from PDF upload to AI-ranked candidate list. This is the **demo backbone**.*

---

### Chunk 2.1: Real PDF Resume Parsing

#### [MODIFY] [extraction.ts](file:///c:/project/hiremind/HireMind/server/src/services/extraction.ts)

Replace the mock `parseResumeFile` with real parsing:

```typescript
import pdf from 'pdf-parse';

export async function parseResumePDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text; // Raw text from PDF
}
```

Then send raw text to Featherless.ai for structured extraction:

```
Extract structured data from this resume. Return ONLY valid JSON:
{
  "name": "string",
  "email": "string", 
  "phone": "string",
  "education": [{ "degree", "institution", "year" }],
  "experience": [{ "company", "role", "duration_months", "description" }],
  "skills": ["string"],
  "github_url": "string | null",
  "leetcode_url": "string | null",
  "linkedin_url": "string | null",
  "total_experience_years": number
}
```

---

### Chunk 2.2: Batch Upload with Real-Time Progress

#### [MODIFY] [resumes.routes.ts](file:///c:/project/hiremind/HireMind/server/src/routes/resumes.routes.ts)

Replace mock upload with real pipeline:

1. Accept `multipart/form-data` with up to 10 PDFs
2. For each PDF:
   - Extract raw text via `pdf-parse`
   - Send to Featherless.ai for structured extraction
   - Save to MongoDB as `Resume` document
   - Emit WebSocket event: `io.to(jobId).emit('resume_parsed', { resumeId, name, status })`
3. Process in batches of 4 (Featherless concurrency limit)

---

### Chunk 2.3: AI-Powered JD Analysis

#### [MODIFY] [jobs.routes.ts](file:///c:/project/hiremind/HireMind/server/src/routes/jobs.routes.ts)

Replace the mock `extractJobData` with a real Featherless.ai call:

```
Extract structured requirements from this job description.
Return ONLY valid JSON:
{
  "required_skills": ["string"],
  "nice_to_have": ["string"],
  "red_flags": ["string"],
  "clarity_score": 0-100,
  "ambiguous_areas": ["string"]
}
```

Add the 3-step JD creation wizard support:
- Step 1: Title + Department
- Step 2: Required skills (tag input) + Experience years
- Step 3: Evaluation weights (github/leetcode/education importance)

---

### Chunk 2.4: AI Match Scoring & Ranking Engine

#### [MODIFY] [candidates.routes.ts](file:///c:/project/hiremind/HireMind/server/src/routes/candidates.routes.ts)

Replace the mock scoring in `POST /analyze` with real AI scoring:

1. Build scoring prompt with JD + candidate JSON + GitHub stats + LeetCode stats + recruiter weights
2. Call Featherless.ai for `{ match_score, decision, confidence, strengths, gaps, explanation }`
3. Decision mapping: `SELECT` (≥80), `REVIEW` (41-79), `REJECT` (≤40)
4. Save results to candidate document
5. Auto-generate ranking for the job

#### [MODIFY] [rankings.routes.ts](file:///c:/project/hiremind/HireMind/server/src/routes/rankings.routes.ts)

Add `POST /rankings/generate/:jobId` — triggers batch scoring for all candidates in a job

---

### Chunk 2.5: Real GitHub & LeetCode Enrichment

#### [MODIFY] [external.ts](file:///c:/project/hiremind/HireMind/server/src/services/external.ts)

Replace mock data with real API calls:

**GitHub REST API** (no auth needed for public data):
```typescript
const user = await fetch(`https://api.github.com/users/${username}`);
const repos = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=5`);
const events = await fetch(`https://api.github.com/users/${username}/events?per_page=100`);
// Extract: repos count, stars, top languages, commit frequency
```

**LeetCode GraphQL** (public query):
```typescript
const query = `query { matchedUser(username: "${username}") { submitStats { acSubmissionNum { difficulty count } } profile { ranking } } }`;
// Extract: problems solved by difficulty, ranking
```

Add caching to avoid rate limits (cache for 10 minutes).

> [!NOTE]
> GitHub has a rate limit of 60 requests/hour without auth. For the demo, this is fine (we'll have ~5-10 candidates). If needed, add a GitHub personal access token for 5,000/hour.

---

### Chunk 2.6: Streaming AI Explanation Panel (SSE)

#### [NEW] [ai.routes.ts](file:///c:/project/hiremind/HireMind/server/src/routes/ai.routes.ts)

Add `POST /api/ai/explain` endpoint:

```typescript
// Set SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Stream from Featherless.ai
const stream = await client.chat.completions.create({
  model: 'deepseek-ai/DeepSeek-V3-0324',
  messages: [...],
  stream: true
});

for await (const chunk of stream) {
  const token = chunk.choices[0]?.delta?.content;
  if (token) res.write(token);
}
res.end();
```

---

## PHASE 3: Frontend — Premium Recruiter Experience (Hours 12–22)

*Goal: Build the "wow factor" UI that makes judges remember this project.*

---

### Chunk 3.1: Design System & Theme Infrastructure

#### [MODIFY] [index.css](file:///c:/project/hiremind/HireMind/client/src/index.css)

Establish the complete design system:
- CSS custom properties for light/dark mode colors
- Inter font from Google Fonts
- Smooth transition variables
- Glassmorphism card styles
- Animated score bar styles

#### [MODIFY] [tailwind.config.ts](file:///c:/project/hiremind/HireMind/client/tailwind.config.ts)

Extend with full color palette:
- Primary: `#2563EB` (blue)
- Success: `#1D9E75` (green — SELECT)
- Warning: `#EF9F27` (amber — REVIEW)
- Danger: `#E24B4A` (red — REJECT)
- Background: `#FFFFFF` / `#0F172A`
- Surface: `#F8FAFC` / `#1E293B`

---

### Chunk 3.2: Theme & Blind Mode Context Providers

#### [NEW] [ThemeProvider.tsx](file:///c:/project/hiremind/HireMind/client/src/contexts/ThemeProvider.tsx)
#### [NEW] [BlindModeProvider.tsx](file:///c:/project/hiremind/HireMind/client/src/contexts/BlindModeProvider.tsx)

- `ThemeProvider`: Light/dark toggle with `document.documentElement.classList.toggle('dark')`
- `BlindModeProvider`: When enabled, suppresses name/photo/college across all components
- Both persist to `localStorage`

---

### Chunk 3.3: JD Creation Wizard UI

#### [MODIFY] [Jobs.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/Jobs.tsx)

Build the 3-step wizard modal:

1. **Step 1**: Job title + department dropdown
2. **Step 2**: Required skills (tag input with autocomplete) + Experience years (range slider)
3. **Step 3**: Evaluation weights (3 sliders: GitHub importance, LeetCode importance, Education importance)
4. **Preview**: AI Quality Score card showing `clarity_score`, `ambiguous_areas`, and extracted `required_skills`

Use Framer Motion for step transitions.

---

### Chunk 3.4: Batch Upload Drop Zone with Real-Time Progress

#### [MODIFY] [JobDetail.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/JobDetail.tsx)

- `react-dropzone` component with animated border
- Progress bar: "3/5 parsed" with animated fill
- As each resume finishes via WebSocket, a new candidate card fades in with Framer Motion
- Socket.io client subscribes to `jobId` channel

---

### Chunk 3.5: Ranked Candidate List with Score Bars & Decision Badges

#### [NEW] [CandidateCard.tsx](file:///c:/project/hiremind/HireMind/client/src/components/CandidateCard.tsx)

Each card shows:
- **Name** (or "Candidate #N" in blind mode)
- **Match score** — animated bar (Framer Motion spring animation)
- **Decision badge** — SELECT (green), REJECT (red), REVIEW (amber)
- **Confidence level** — HIGH / MEDIUM / LOW with icon
- **Top 3 strengths** — truncated pill chips
- **"Why?" button** — opens streaming explanation panel

---

### Chunk 3.6: Skill Gap Heatmap Component

#### [NEW] [SkillHeatmap.tsx](file:///c:/project/hiremind/HireMind/client/src/components/SkillHeatmap.tsx)

Color-coded skill pills:
- **Green `#1D9E75`**: Skill matched in candidate's skills
- **Amber `#EF9F27`**: Skill found in experience descriptions (partial)
- **Red `#E24B4A`**: Skill absent entirely

Hover tooltip shows evidence: "Found in resume skills" or "Mentioned in work at Nimbus Labs"

---

### Chunk 3.7: Streaming Explanation Panel

#### [NEW] [ExplanationPanel.tsx](file:///c:/project/hiremind/HireMind/client/src/components/ExplanationPanel.tsx)

- Slide-in panel from the right (Framer Motion `x: [800, 0]`)
- Blinking cursor during streaming
- Uses `fetch` with `response.body.getReader()` for SSE consumption
- Word-by-word text append with typewriter effect
- Close button or click outside to dismiss

---

### Chunk 3.8: Pipeline Kanban Board

#### [NEW] [KanbanBoard.tsx](file:///c:/project/hiremind/HireMind/client/src/components/KanbanBoard.tsx)

Columns: **Applied** → **Screening** → **Interview** → **Offer** → **Hired** | **Rejected**

- Uses `@hello-pangea/dnd` for drag-and-drop
- On drop: `PATCH /api/candidates/:id/stage`
- Column headers show candidate count
- Cards are mini versions of CandidateCard (name/score/badge)

---

### Chunk 3.9: Layout & Navigation Polish

#### [MODIFY] [Layout.tsx](file:///c:/project/hiremind/HireMind/client/src/components/Layout.tsx)

- Add theme toggle (sun/moon icon) in header
- Add blind screening toggle with accessibility icon
- Role-based navigation (Recruiter sees Jobs/Kanban, Candidate sees Profile/Applications, Admin sees Analytics)
- Animated sidebar with active route indicator
- Mobile-responsive hamburger menu

---

## PHASE 4: Candidate-Facing Features (Hours 22–28)

*Goal: Make the platform bilateral — not just for recruiters. This is innovation that most teams won't build.*

---

### Chunk 4.1: Candidate Registration & Profile

#### [MODIFY] [Auth.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/Auth.tsx)

- Add role selector on registration: "I'm a Recruiter" / "I'm a Candidate"
- Candidate registration flow: name, email, password, upload resume

#### [MODIFY] [CandidateDashboard.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/CandidateDashboard.tsx)

- **Profile section**: Parsed resume data displayed as an editable form
- **Profile completeness score**: "Your profile is 72% complete — add GitHub to improve"
- **Link GitHub/LeetCode**: Input fields for usernames, enrichment data appears live
- **My Applications**: List of jobs applied to with current stage (Applied/Screening/Interview)

---

### Chunk 4.2: AI Interview Coach

#### [NEW] [InterviewCoach.tsx](file:///c:/project/hiremind/HireMind/client/src/components/InterviewCoach.tsx)

Button: "Generate Interview Questions" → calls Featherless.ai → returns 5 questions:

```
1. "Explain how React's concurrent rendering works."
   Why asked: JD mentions React 18, candidate has 2 years React.
   How to approach: Focus on Suspense, streaming, and automatic batching.
```

Each question card is collapsible with accordion animation.

---

### Chunk 4.3: Candidate Application Flow

#### [NEW] [JobListingPublic.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/JobListingPublic.tsx)

- Public job listings page (no auth required to view)
- "Apply" button for logged-in candidates
- Application form: upload resume + link GitHub/LeetCode + cover note
- Status tracker: timeline showing current pipeline stage

---

## PHASE 5: Admin Dashboard & Analytics (Hours 28–34)

*Goal: Show the platform has a full lifecycle — not just a one-time screening tool.*

---

### Chunk 5.1: Admin Analytics Dashboard

#### [MODIFY] [Analytics.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/Analytics.tsx)

Replace the current page with a full admin dashboard:

- **Model Accuracy Widget**: "82% AI decisions match recruiter decisions" (computed from FeedbackEvents)
- **Bias Detection Card**: "AI consistently undervalues bootcamp-educated candidates" (group overrides by education type)
- **Override History Table**: AI decision → Human decision → Reason → Date
- **Hiring Funnel Chart**: Applied → Screened → Interviewed → Offered → Hired (Recharts bar chart)
- **Total Metrics**: Jobs posted, candidates screened, time saved, avg screening time

---

### Chunk 5.2: Feedback Loop Integration

#### [MODIFY] [CandidateProfile.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/CandidateProfile.tsx)

- Add override buttons: "I'd SELECT this candidate" / "I'd REJECT this candidate"
- Override form: dropdown for decision + text area for reason (min 10 chars)
- After override, show confirmation + updated model accuracy live
- Overrides feed into the admin analytics dashboard

---

### Chunk 5.3: Admin User Management

#### [NEW] [AdminUsers.tsx](file:///c:/project/hiremind/HireMind/client/src/pages/AdminUsers.tsx)

- Table of all users (recruiters + candidates)
- Activate/deactivate accounts
- Role management
- Activity log

---

## PHASE 6: Polish, Demo Prep & Deploy (Hours 34–48)

*Goal: Make it demo-ready, impressive, and bulletproof.*

---

### Chunk 6.1: Animation & Micro-Interaction Polish

- Score bars: spring animation on mount
- Card entrances: staggered fade-in-up
- Page transitions: smooth route changes
- Loading states: skeleton screens (not spinners)
- Toast notifications for actions (upload success, feedback submitted)
- Hover effects on all interactive elements

---

### Chunk 6.2: Dark/Light Mode Complete Integration

- Verify every single component renders correctly in both modes
- Smooth `transition-colors duration-300` on all backgrounds
- Test heatmap colors in both modes (ensure contrast)
- Test charts/graphs in both modes

---

### Chunk 6.3: Error Handling & Edge Cases

- Empty states: "No candidates yet — upload resumes to get started"
- API error handling: retry on 503, show user-friendly messages
- File validation: only PDF/DOC, max 10MB, max 10 files per batch
- JWT expiry handling: redirect to login
- Featherless.ai fallback: if AI is unavailable, show mock data with "[Demo Mode]" badge

---

### Chunk 6.4: Demo Data Seeding

#### [MODIFY] [seed.ts](file:///c:/project/hiremind/HireMind/server/src/seed.ts)

Create a comprehensive seed script with:
- 1 recruiter account (pre-set credentials for demo)
- 1 candidate account
- 1 admin account
- 2 jobs (Frontend Developer, Backend Engineer)
- 5 pre-parsed candidates per job with realistic data
- Pre-generated rankings and some feedback events

---

### Chunk 6.5: Deployment

- **Frontend**: Deploy to Vercel (free tier)
- **Backend**: Deploy to Render or Railway (free tier)
- **Database**: MongoDB Atlas (free tier, M0 cluster)
- Environment variables: `FEATHERLESS_API_KEY`, `MONGODB_URI`, `JWT_SECRET`

---

### Chunk 6.6: Demo Script & Video

Script the 90-second demo flow:

1. **Recruiter logs in** → Dashboard shows "Create Job" (2s)
2. **Creates job** → 3-step JD Wizard → AI Quality Score appears (10s)
3. **Uploads 5 resumes** → Drag-drop → Progress bar → Cards appear live (15s)
4. **Views ranked list** → Sorted by score, SELECT/REJECT/REVIEW badges (5s)
5. **Clicks "Why #1?"** → Streaming explanation panel slides in, word-by-word (15s)
6. **Views Skill Heatmap** → Green/amber/red grid, instant visual diagnosis (5s)
7. **Toggles Blind Screening** → Names/photos hidden, only skills/scores visible (5s)
8. **Drags candidate in Kanban** → Screening → Interview (5s)
9. **Overrides AI decision** → REJECT → SELECT with reason (10s)
10. **Admin dashboard** → Model accuracy 82%, bias detection, funnel chart (10s)
11. **Candidate view** → Interview Coach generates 5 questions with hints (8s)

---

## Verification Plan

### Automated Tests

1. **API Health**: `curl http://localhost:5001/api/health` → `{ ok: true }`
2. **Featherless.ai Connection**: Test with simple chat completion call
3. **Resume Upload**: Upload a real PDF, verify structured JSON output
4. **AI Scoring**: Score a candidate, verify JSON response with all fields
5. **SSE Streaming**: Open `/api/ai/explain` endpoint, verify streaming tokens
6. **WebSocket**: Connect Socket.io client, verify `resume_parsed` events fire
7. **TypeScript**: `npm run typecheck` — zero errors

### Manual / Browser Verification

1. Full recruiter flow: login → create job → upload → ranked list → explain → kanban
2. Full candidate flow: register → upload resume → link GitHub → apply → view status → interview coach
3. Dark/light mode toggle on every page
4. Blind screening toggle across all candidate views
5. Mobile responsive check (resize to 375px width)
6. Demo video recording with the full script above

---

## Priority Matrix

> [!IMPORTANT]
> If time runs short, here's what to cut vs. what MUST ship:

| Priority | Feature | Reason |
|---|---|---|
| 🔴 **P0 — Must Ship** | Featherless.ai integration, Resume PDF parsing, AI scoring, Ranked list, Streaming explanations, Skill heatmap | These ARE the product. Without real AI, it's just a CRUD app. |
| 🟠 **P1 — Should Ship** | Batch upload with WebSocket progress, JD Quality Scorer, Blind screening, Dark/light mode | These are the "wow" differentiators judges remember |
| 🟡 **P2 — Nice to Have** | Pipeline Kanban, GitHub/LeetCode real APIs, Feedback loop + accuracy widget | Adds completeness, but mock data is acceptable for demo |
| 🟢 **P3 — Bonus** | Interview Coach, Candidate self-service, Admin user management, Deployment | Innovation points, but not required for a winning demo |

---

## Open Questions

> [!IMPORTANT]
> **1. Featherless.ai API Key**: Do you already have a Featherless.ai Premium subscription and API key? If not, we need to sign up with code `SUMMERHACK26` (1 month free) before we start Phase 2.

> [!IMPORTANT]
> **2. MongoDB Atlas**: Do you have a MongoDB Atlas cluster set up? Or should we continue with the in-memory mock data approach and add Atlas later?

> [!WARNING]
> **3. Team Allocation**: The roadmap mentions 4 developers. Are you the only developer, or do you have teammates working on specific features? This affects how we parallelize the phases.

> **4. Timeline Confirmation**: The hackathon is June 5–7 (3 days). Are we starting immediately, or is there prep time before June 5?

> **5. Existing Dev Server**: I see `npm run dev` is running. Should I stop it and restart after making changes, or do you want to handle that?
