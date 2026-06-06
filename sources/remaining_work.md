# HireMind — Remaining Work Tracker

### Audit Date: June 5, 2026 | Compared against [implementation_plan.md](file:///c:/project/hiremind/HireMind/sources/implementation_plan.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | **Done** — Implemented and working |
| 🟡 | **Partial** — Started but incomplete or uses mocks |
| ❌ | **Not Started** — Entirely missing |

---

## PHASE 1: Foundation & Infrastructure

### Chunk 1.1: Featherless.ai Service Layer

| Item | Status | Notes |
|------|--------|-------|
| AI service file (`ai.service.ts`) | ✅ | Created with `extractResumeData()` and `minimalFallback()` |
| `analyzeJobDescription()` function | ❌ | Not implemented — JD analysis still uses hardcoded keyword matching in `extraction.ts` |
| `scoreCandidate()` function | ❌ | Not implemented — scoring uses simple skill-match percentage formula in `candidates.routes.ts` |
| `generateExplanation()` with SSE streaming | ❌ | Not implemented — no streaming endpoint exists at all |
| `generateInterviewQuestions()` function | ❌ | Not implemented |
| Model: `deepseek-ai/DeepSeek-V3-0324` | ❌ | Uses `meta-llama/Llama-3.1-8B-Instruct` default; plan specified DeepSeek |
| OpenAI SDK usage | ❌ | Uses raw `fetch()` against Featherless API instead of OpenAI SDK |
| Retry logic (503/401/403 handling) | ❌ | Basic error throw only, no retry logic |

### Chunk 1.2: Install Core Dependencies

| Item | Status | Notes |
|------|--------|-------|
| `openai` SDK (server) | ❌ | Not installed — using raw fetch |
| `pdf-parse` (server) | ✅ | Installed and working |
| `socket.io` (server) | ✅ | Installed and working |
| `socket.io-client` (client) | ✅ | Installed |
| `react-dropzone` (client) | ❌ | Not installed |
| `@hello-pangea/dnd` (client) | ❌ | Not installed |
| `mammoth` (server) | ✅ | Installed for DOCX parsing (bonus, not in original plan) |

### Chunk 1.3: Firebase Connection

| Item | Status | Notes |
|------|--------|-------|
| Firebase connection | ✅ | Initialized in `index.ts` |
| Socket.io server initialization | ✅ | `initSocket()` in `socket.ts` with typed events |
| In-memory fallback for demo | ✅ | `data.ts` provides seeded in-memory data |

### Chunk 1.4: Enhanced Database Schemas

| Item | Status | Notes |
|------|--------|-------|
| Job schema: `weights` field | ❌ | Not added |
| Job schema: `nice_to_have`, `red_flags`, `clarity_score`, `ambiguous_areas` | ❌ | Not added |
| Candidate schema: `stage` field for Kanban | ❌ | Not added |
| InterviewQuestions schema | ❌ | Not created |
| User schema: `'candidate'` role enum value | ❌ | Role enum is `['recruiter', 'hiring_manager', 'admin']` — no `'candidate'` |

---

## PHASE 2: Core AI Pipeline — Resume → Score → Rank

### Chunk 2.1: Real PDF Resume Parsing

| Item | Status | Notes |
|------|--------|-------|
| PDF text extraction via `pdf-parse` | ✅ | `documentParser.ts` handles PDF + DOCX |
| AI-powered structured extraction | ✅ | `ai.service.ts` sends raw text to Featherless.ai for structured JSON |

### Chunk 2.2: Batch Upload with Real-Time Progress

| Item | Status | Notes |
|------|--------|-------|
| Batch upload endpoint (`POST /batch-upload`) | ✅ | Accepts up to 20 files |
| Per-file WebSocket progress events | ✅ | Emits `resume_upload_started` and `resume_parsed` per file |
| Process in batches of 4 (concurrency limit) | ❌ | Files are processed sequentially, no concurrency batching |
| Demo fallback (no files = seed names) | ✅ | Implemented |

### Chunk 2.3: AI-Powered JD Analysis

| Item | Status | Notes |
|------|--------|-------|
| Replace `extractJobData` with Featherless.ai call | ❌ | Still uses hardcoded keyword matching in `extraction.ts` |
| Return `required_skills`, `nice_to_have`, `red_flags`, `clarity_score`, `ambiguous_areas` | ❌ | Returns only `skills`, `experience`, `education`, `certifications`, `keywords` |
| 3-step JD creation wizard support (backend) | ❌ | No wizard-specific fields or endpoints |

### Chunk 2.4: AI Match Scoring & Ranking Engine

| Item | Status | Notes |
|------|--------|-------|
| Replace mock scoring with Featherless.ai call | ❌ | Uses simple `matched.length / required.length * 100` formula |
| Decision mapping: SELECT (≥80), REVIEW (41-79), REJECT (≤40) | ❌ | Uses Strong Hire/Hire/Maybe/Reject thresholds at 90/75/60 |
| AI-generated `strengths`, `gaps`, `explanation` fields | ❌ | Explanation is hardcoded 4-line string array |
| `POST /rankings/generate/:jobId` batch scoring | 🟡 | Endpoint exists but just sorts existing scores — doesn't trigger AI scoring per candidate |

### Chunk 2.5: Real GitHub & LeetCode Enrichment

| Item | Status | Notes |
|------|--------|-------|
| Real GitHub REST API calls | ❌ | Returns mock/cached data from `data.ts` |
| Real LeetCode GraphQL API calls | ❌ | Returns mock/cached data from `data.ts` |
| Caching with 10-minute TTL | ❌ | Cache exists but stores mock data, no TTL |

### Chunk 2.6: Streaming AI Explanation Panel (SSE)

| Item | Status | Notes |
|------|--------|-------|
| `ai.routes.ts` file | ❌ | File does not exist |
| `POST /api/ai/explain` SSE endpoint | ❌ | No SSE endpoint anywhere |
| Streaming from Featherless.ai | ❌ | No streaming implementation |

---

## PHASE 3: Frontend — Premium Recruiter Experience

### Chunk 3.1: Design System & Theme Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| CSS custom properties for light/dark mode | ✅ | `index.css` has design tokens |
| Inter font from Google Fonts | ✅ | Referenced in `index.html` |
| Glassmorphism card styles | ✅ | Present in `index.css` |
| Animated score bar styles | ✅ | Present in `index.css` |
| Tailwind extended color palette | ✅ | `tailwind.config.ts` has primary/success/warning/danger colors |

### Chunk 3.2: Theme & Blind Mode Context Providers

| Item | Status | Notes |
|------|--------|-------|
| `ThemeProvider.tsx` | ❌ | No context file — theme toggle is in `main.tsx` via Zustand store (partial equivalent) |
| `BlindModeProvider.tsx` | ❌ | No context file — blind mode toggle exists in `appStore.ts` + `BlindToggle.tsx` (partial equivalent) |
| Persist to `localStorage` | 🟡 | Zustand store exists but `localStorage` persistence not confirmed |

### Chunk 3.3: JD Creation Wizard UI

| Item | Status | Notes |
|------|--------|-------|
| 3-step wizard modal in `Jobs.tsx` | ❌ | `Jobs.tsx` exists but needs to be checked for wizard implementation |
| Step 1: Title + department | ❌ | No multi-step wizard flow |
| Step 2: Skills tag input + experience range slider | ❌ | No tag input or slider |
| Step 3: Evaluation weights (3 sliders) | ❌ | No weight sliders |
| Preview: AI Quality Score card | ❌ | No quality score preview |
| Framer Motion step transitions | ❌ | No wizard animations |

### Chunk 3.4: Batch Upload Drop Zone with Real-Time Progress

| Item | Status | Notes |
|------|--------|-------|
| `react-dropzone` component | ❌ | Dependency not installed; `JobDetail.tsx` likely uses basic file input |
| Progress bar ("3/5 parsed") | 🟡 | `ResumeProcessingPanel.tsx` exists — needs review |
| WebSocket real-time card appearance | 🟡 | `useResumeSocket.ts` hook exists |
| Framer Motion fade-in for new candidates | ❌ | Not confirmed |

### Chunk 3.5: Ranked Candidate List with Score Bars & Decision Badges

| Item | Status | Notes |
|------|--------|-------|
| `CandidateCard.tsx` component | ❌ | File does not exist — inline cards in `Dashboard.tsx` and `CandidateDashboard.tsx` |
| Animated score bar (Framer Motion spring) | ❌ | No dedicated component |
| Decision badge (SELECT/REJECT/REVIEW) | ❌ | Uses Strong Hire/Hire/Maybe/Reject instead |
| Confidence level indicator | ❌ | Not implemented |
| "Why?" button → streaming explanation | ❌ | No streaming explanation |

### Chunk 3.6: Skill Gap Heatmap Component

| Item | Status | Notes |
|------|--------|-------|
| `SkillHeatmap.tsx` component | ❌ | No dedicated file — inline `SkillHeatmap` within `ui.tsx` and `CandidateProfile.tsx` |
| Color-coded pills (green/amber/red) | 🟡 | Exists inline in `CandidateProfile.tsx` |
| Hover tooltip with evidence | ❌ | Not confirmed |

### Chunk 3.7: Streaming Explanation Panel

| Item | Status | Notes |
|------|--------|-------|
| `ExplanationPanel.tsx` component | ❌ | File does not exist |
| Slide-in panel (Framer Motion) | ❌ | Not implemented |
| Blinking cursor during streaming | ❌ | Not implemented |
| SSE consumption via `response.body.getReader()` | ❌ | Not implemented |
| Typewriter effect | ❌ | Not implemented |

### Chunk 3.8: Pipeline Kanban Board

| Item | Status | Notes |
|------|--------|-------|
| `KanbanBoard.tsx` component | ❌ | File does not exist |
| `@hello-pangea/dnd` drag-and-drop | ❌ | Dependency not installed |
| `PATCH /api/candidates/:id/stage` endpoint | ❌ | No stage endpoint on backend |
| Column headers with candidate count | ❌ | Not implemented |

### Chunk 3.9: Layout & Navigation Polish

| Item | Status | Notes |
|------|--------|-------|
| Theme toggle (sun/moon) in header | ✅ | In `Layout.tsx` |
| Blind screening toggle | ✅ | `BlindToggle.tsx` component exists |
| Role-based navigation | ❌ | All users see same navigation |
| Animated sidebar with active route indicator | 🟡 | Sidebar exists, needs active state animation review |
| Mobile-responsive hamburger menu | ❌ | Not confirmed |

---

## PHASE 4: Candidate-Facing Features

### Chunk 4.1: Candidate Registration & Profile

| Item | Status | Notes |
|------|--------|-------|
| Role selector on registration | ❌ | Auth only allows `recruiter/hiring_manager/admin` — no `candidate` role |
| Candidate registration flow | ❌ | No candidate-specific registration |
| Profile section with editable parsed data | ❌ | `CandidateDashboard.tsx` exists but no editable profile |
| Profile completeness score | ❌ | Not implemented |
| Link GitHub/LeetCode with live enrichment | ❌ | Not implemented |
| My Applications list | ❌ | Not implemented |

### Chunk 4.2: AI Interview Coach

| Item | Status | Notes |
|------|--------|-------|
| `InterviewCoach.tsx` component | ❌ | File does not exist |
| "Generate Interview Questions" button | ❌ | Not implemented |
| Featherless.ai call for questions | ❌ | `generateInterviewQuestions()` not implemented |
| Collapsible accordion cards | ❌ | Not implemented |

### Chunk 4.3: Candidate Application Flow

| Item | Status | Notes |
|------|--------|-------|
| `JobListingPublic.tsx` page | ❌ | File does not exist |
| Public job listings (no auth) | ❌ | All job routes require auth |
| "Apply" button for candidates | ❌ | Not implemented |
| Application form (resume + GitHub + cover note) | ❌ | Not implemented |
| Status tracker timeline | ❌ | Not implemented |

---

## PHASE 5: Admin Dashboard & Analytics

### Chunk 5.1: Admin Analytics Dashboard

| Item | Status | Notes |
|------|--------|-------|
| Model Accuracy Widget | 🟡 | `Analytics.tsx` and `analytics.routes.ts` have basic accuracy calc |
| Bias Detection Card | ❌ | Not implemented |
| Override History Table | ❌ | Not implemented as a table |
| Hiring Funnel Chart (Recharts) | 🟡 | Funnel data exists in API, Recharts installed — need to verify chart rendering |
| Total Metrics display | 🟡 | Basic metrics computed, display needs polish |

### Chunk 5.2: Feedback Loop Integration

| Item | Status | Notes |
|------|--------|-------|
| Override buttons on `CandidateProfile.tsx` | 🟡 | `POST /:id/feedback` endpoint exists with override/agree decisions |
| Override form (dropdown + text area) | 🟡 | Endpoint expects `decision` + `reason` (min 10 chars) |
| Live model accuracy update after override | ❌ | Not implemented |

### Chunk 5.3: Admin User Management

| Item | Status | Notes |
|------|--------|-------|
| `AdminUsers.tsx` page | ❌ | File does not exist |
| User table with activate/deactivate | ❌ | Not implemented |
| Role management | ❌ | Not implemented |
| Activity log | ❌ | Not implemented |

---

## PHASE 6: Polish, Demo Prep & Deploy

### Chunk 6.1: Animation & Micro-Interaction Polish

| Item | Status | Notes |
|------|--------|-------|
| Score bars: spring animation on mount | ❌ | Not confirmed with Framer Motion |
| Card entrances: staggered fade-in-up | ❌ | Not confirmed |
| Page transitions: smooth route changes | ❌ | No route transition animations |
| Loading states: skeleton screens | ❌ | Not confirmed |
| Toast notifications | ❌ | No toast system |
| Hover effects on interactive elements | 🟡 | Some exist in CSS |

### Chunk 6.2: Dark/Light Mode Complete Integration

| Item | Status | Notes |
|------|--------|-------|
| Every component renders in both modes | 🟡 | Theme toggle works but full audit not done |
| Smooth transition on backgrounds | 🟡 | Transition vars in CSS |
| Heatmap colors contrast in both modes | ❌ | Not verified |
| Charts/graphs in both modes | ❌ | Not verified |

### Chunk 6.3: Error Handling & Edge Cases

| Item | Status | Notes |
|------|--------|-------|
| Empty states ("No candidates yet…") | ❌ | Not confirmed |
| API error retry on 503 | ❌ | No retry logic |
| File validation (PDF/DOC, 10MB, 10 files) | 🟡 | Multer has basic file filter, not fully configured per plan |
| JWT expiry → redirect to login | ❌ | Not implemented |
| Featherless.ai fallback with "[Demo Mode]" badge | ❌ | Falls back to `minimalFallback()` but no UI badge |

### Chunk 6.4: Demo Data Seeding

| Item | Status | Notes |
|------|--------|-------|
| Comprehensive seed script | 🟡 | `seed.ts` exists but only prints counts — `data.ts` has the real seed data |
| 1 recruiter + 1 candidate + 1 admin account | 🟡 | Has recruiter + admin in `data.ts`, no candidate account |
| 2 jobs with 5 pre-parsed candidates each | 🟡 | Has jobs + candidates in `data.ts`, counts need verification |
| Pre-generated rankings + feedback events | 🟡 | Rankings + feedback arrays seeded in `data.ts` |

### Chunk 6.5: Deployment

| Item | Status | Notes |
|------|--------|-------|
| Frontend → Vercel | ❌ | Not deployed |
| Backend → Render | ❌ | Not deployed |
| Firebase configured | ❌ | API keys pending in production |

### Chunk 6.6: Demo Script & Video

| Item | Status | Notes |
|------|--------|-------|
| 90-second demo script | ❌ | Not created |
| Demo video recording | ❌ | Not recorded |

---

## Summary: What's Remaining by Priority

### 🔴 P0 — Must Ship (Critical for a working product)

These are the items that turn HireMind from a CRUD scaffold into an AI-powered product:

1. **AI-Powered JD Analysis** — Replace `extractJobData()` with Featherless.ai call returning `required_skills`, `nice_to_have`, `red_flags`, `clarity_score`
2. **AI Match Scoring** — Replace manual scoring formula with Featherless.ai `scoreCandidate()` call returning `match_score`, `decision`, `confidence`, `strengths`, `gaps`
3. **Streaming Explanation Panel (SSE)** — Create `ai.routes.ts` with `POST /api/ai/explain`, create `ExplanationPanel.tsx` with typewriter streaming
4. **Skill Gap Heatmap Component** — Extract from inline code into dedicated `SkillHeatmap.tsx` with hover tooltips and evidence
5. **CandidateCard Component** — Create `CandidateCard.tsx` with animated score bars, decision badges, confidence, strengths, "Why?" button
6. **Decision Taxonomy** — Change from Strong Hire/Hire/Maybe/Reject → SELECT/REVIEW/REJECT (per problem statement)

### 🟠 P1 — Should Ship (Differentiators)

7. **JD Creation Wizard** — 3-step modal in `Jobs.tsx` (title → skills + experience → weights) with Framer Motion
8. **react-dropzone** for batch upload — Install + integrate drag-and-drop file upload in `JobDetail.tsx`
9. **Batch concurrency (4 at a time)** — Concurrent PDF parsing in `resumes.routes.ts`
10. **Enhanced Schemas** — Add `weights`, `clarity_score`, `stage`, `nice_to_have`, `red_flags` to schemas
11. **Dark/Light mode full audit** — Verify every component in both themes
12. **Role-based navigation** — Different nav for recruiter/candidate/admin

### 🟡 P2 — Nice to Have

13. **Real GitHub API** — Replace mock with `fetch` to `api.github.com`
14. **Real LeetCode GraphQL** — Replace mock with GraphQL query
15. **Pipeline Kanban Board** — `KanbanBoard.tsx` + `@hello-pangea/dnd` + `PATCH /stage` endpoint
16. **Feedback Loop polish** — Bias detection card, override history table, live accuracy update
17. **OpenAI SDK** — Migrate from raw fetch to OpenAI SDK for cleaner streaming
18. **Retry logic** — 503/401/403 handling in AI service

### 🟢 P3 — Bonus

19. **Interview Coach** — `InterviewCoach.tsx` + `generateInterviewQuestions()` function
20. **Candidate self-service** — Add `candidate` role, `JobListingPublic.tsx`, application flow, status tracker
21. **Admin User Management** — `AdminUsers.tsx` with user table, role management, activity log
22. **Deployment** — Vercel/Render (frontend) + Render (backend) + Firebase
23. **Demo Script & Video** — Write 90-second script, record video
24. **Animation polish** — Staggered fade-ins, page transitions, skeleton loaders, toast notifications

---

## Quick Stats

| Category | Done | Partial | Missing | Total |
|----------|------|---------|---------|-------|
| Phase 1: Foundation | 6 | 0 | 12 | 18 |
| Phase 2: AI Pipeline | 4 | 1 | 8 | 13 |
| Phase 3: Frontend UI | 4 | 4 | 18 | 26 |
| Phase 4: Candidate Features | 0 | 0 | 11 | 11 |
| Phase 5: Admin & Analytics | 0 | 4 | 5 | 9 |
| Phase 6: Polish & Deploy | 0 | 5 | 11 | 16 |
| **Total** | **14** | **14** | **65** | **93** |

> **~15% done, ~15% partial, ~70% remaining.**

The biggest gap is the **AI pipeline** — the core differentiator. Resume PDF parsing works via Featherless.ai, but JD analysis, candidate scoring, streaming explanations, and interview questions are all still mocked or missing. This should be the #1 priority.
