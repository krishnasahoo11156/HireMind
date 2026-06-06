# TalentIQ — Complete Product Deep Dive  
## An AI-Powered Recruitment Intelligence Platform for Hackathon Winners

***

## What This Project Is About

**TalentIQ** is a full-stack, AI-native recruitment intelligence platform that transforms the chaotic, manual, and bias-prone process of screening hundreds of resumes into an intelligent, explainable, and visually stunning pipeline. Instead of recruiters manually reading PDFs, cross-checking GitHub profiles, and guessing who fits best, TalentIQ **ingests multi-source candidate data** (resumes, GitHub, LeetCode, LinkedIn, certifications), **structures it into clean JSON**, **scores every candidate against a job description using AI**, and **returns a ranked shortlist with plain-English explanations** for every decision (Select / Reject / Review).

This is not just a “resume parser.” It’s a **candidate intelligence operating system** built for the 2026 hackathon stage, designed to feel like a premium SaaS product from a Series B startup — not a weekend prototype. Every page is built with **light + dark mode from day one**, with smooth transitions, animated score bars, real-time WebSocket progress, and a skill heatmap that makes explainability instant and visual.

The product name can be **TalentIQ**, **HireLens**, or **CandidateOS**. For this document, we’ll use **TalentIQ**.

***

## Product Requirements Document (PRD)

### Product Metadata

| Field | Value |
|-------|-------|
| **Product Name** | TalentIQ |
| **Version** | 1.0 MVP |
| **Theme** | Full Stack Development (Spectrum Circle Hackathon) |
| **Timeline** | 3 days (June 5–7, 2026) |
| **Team Size** | 4 developers |
| **Core AI Provider** | featherless.ai (DeepSeek-V3.2 for reasoning & coding)  |
| **Primary Goal** | Build an AI-powered recruitment platform that aggregates candidate info from resumes + online profiles, evaluates suitability for a job, and provides explainable hiring recommendations (Select, Reject, Review)  |

### Problem Statement (PS-3)

Recruiters handle large volumes of candidate data spread across resumes, certifications, projects, and online profiles. This information is often **unstructured, inconsistent, and difficult to evaluate efficiently**, leading to **slow screening processes** and **missed talent opportunities**.

**Goal:** Build a full-stack AI-powered recruitment platform that intelligently analyzes multi-source candidate information and generates **reliable, explainable hiring recommendations** (Select / Reject / Review).

### User Roles

| Role | Responsibilities |
|------|------------------|
| **Recruiter / HR** | Uploads job descriptions, manages candidate pipeline, receives AI rankings, makes final decisions, tracks model accuracy over time, toggles blind screening |
| **Candidate** | Creates profile, uploads resume, links GitHub/LeetCode/LinkedIn, tracks application status, receives profile completeness feedback & AI interview coach questions |
| **Admin** | Monitors platform health, views all jobs & candidates across organization, manages user accounts, reviews model performance analytics, exports reports |

### Success Metrics (for Hackathon Demo)

| Metric | Target |
|--------|--------|
| Resume parsed to structured JSON | ≤ 3 seconds after upload |
| AI ranking generated for batch of 5 resumes | ≤ 8 seconds |
| Match score explanation visible | Immediate on click (streamed) |
| Blind screening toggle | Working on live data with zero backend changes |
| GitHub stats visible on candidate card | Real-time from public API |
| Dark/light mode toggle | Smooth transition on every page |
| Skill heatmap rendered | Instant color-coded grid per candidate |

***

## Feature Map — Every Single Feature Explained

TalentIQ has **10 core features** that together create a “winner’s project” feel. Each feature is explained with **what it does**, **why it’s impressive**, and **how it works technically**.

| # | Feature | User-Facing Value | Technical Core |
|---|---------|-------------------|----------------|
| 1 | JD Creation Wizard with AI Quality Scorer | Recruiters don’t just paste text — they configure weights and get AI feedback on JD clarity | POST `/api/jobs` → featherless.ai extracts `required_skills`, `nice_to_have`, `red_flags`, `clarity_score`  |
| 2 | Batch Resume Upload & Real-Time AI Pipeline | Drag-drop 10 PDFs, watch cards appear live via WebSocket | `pdf-parse` → featherless.ai JSON extraction → Firestore → WebSocket emit  |
| 3 | AI Match Scoring & Ranking Engine | Ranked list with 0–100 score, SELECT/REJECT/REVIEW decision, confidence level | Scoring prompt includes JD + candidate JSON + GitHub/LeetCode + recruiter weights  |
| 4 | Skill Gap Heatmap (3-Color Visual) | Green/amber/red pills show skill match in 2 seconds | Frontend computes color based on skill presence in candidate’s skills/experience/absent  |
| 5 | Streaming AI Explanation Panel (SSE) | “Why #1?” slides in with word-by-word streaming like Claude | `text/event-stream` + `ReadableStream` consumer on frontend  |
| 6 | Blind Screening Mode | Hides name/photo/college to reduce unconscious bias | UI-only toggle in React context — suppresses fields, zero backend changes  |
| 7 | GitHub & LeetCode Enrichment | Public repo count, stars, commit frequency, problems solved on candidate card | GitHub REST API + LeetCode GraphQL (no auth needed for public data)  |
| 8 | Feedback Loop & Model Accuracy Widget | Shows % AI decisions matching human, highlights skill types AI misses | `FeedbackEvent` in Firestore → admin dashboard aggregates over 30 days  |
| 9 | Candidate-Facing AI Interview Coach | 5 likely interview questions with “why asked” + “how to approach” hints | Single featherless.ai call based on JD + candidate resume  |
| 10 | Pipeline Stage Kanban (Applied→Hired) | Drag-drop candidates between stages, stage counts update live | `@hello-pangea/dnd` or CSS drag → PATCH `/api/candidates/:id/stage`  |

***

## Feature Deep Dive — Technical Explanation of Every Feature

### Feature 1: JD Creation Wizard with AI Quality Scorer

**What the recruiter experiences:**  
Recruiter opens “Create Job” and goes through a **3-step wizard**:

1. **Job title + department** (e.g., “Frontend Engineer – Product Team”)
2. **Required skills** (tag input: React, TypeScript, Tailwind) + **Years of experience** (slider 0–10)
3. **Evaluation weights** (sliders):  
   - “How important is GitHub activity?” (0–100)  
   - “How important is LeetCode rating?” (0–100)  
   - “How important is formal education?” (0–100)

Before publishing, the AI returns a **JD Quality Score** with copy like:  
> “Your JD is missing clarity on remote/onsite, seniority level is ambiguous.”

**Technical implementation:**

- Frontend: React form with `react-hook-form` + `@dnd-kit` for drag tags
- POST `/api/jobs` sends:
  ```json
  {
    "title": "Frontend Engineer",
    "department": "Product",
    "required_skills": ["React", "TypeScript"],
    "experience_years_min": 3,
    "weights": { "github": 80, "leetcode": 60, "education": 40 },
    "jd_text": "We are looking for..."
  }
  ```
- Backend (Node.js/Express):
  - Sends `jd_text` to **featherless.ai** with prompt:
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
  - Uses **DeepSeek-V3.2** model (advanced reasoning & coding) 
  - Saves extracted JSON + weights into Firestore `Job` document:
    ```js
    {
      _id, title, department, required_skills, nice_to_have, red_flags,
      clarity_score, ambiguous_areas, weights, jd_text, createdAt, status: "draft|published"
    }
    ```
- Frontend shows the extracted structure + clarity score as a **JD Health Card** before publishing.

**Why this wins:** Most teams just paste text. You’re showing **structured AI analysis** of the JD itself — a meta-layer that judges remember.

***

### Feature 2: Batch Resume Upload & Real-Time AI Pipeline

**User experience:**  
Recruiter drags 3–10 PDFs into a **drop zone** with a progress ring. As each resume finishes parsing, a **new candidate card appears live** in the dashboard with an animated entrance. A progress bar shows “3/5 parsed”.

**Technical flow:**

1. Frontend: `react-dropzone` sends `multipart/form-data` to `POST /api/candidates/batch`.
2. Backend:
   - Loops through files, uses `pdf-parse` to extract raw text:
     ```js
     const text = await pdf.parse(buffer).then(d => d.text);
     ```
   - For each `text`, calls **featherless.ai** with a **structured JSON extraction prompt**:
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
   - Model: **DeepSeek-V3.2** (excellent for structured extraction) 
   - Saves parsed JSON as `Candidate` document in Firestore, linked to `jobId`.
3. WebSocket (Socket.io):
   - After each candidate is saved, server emits:
     ```js
     io.to(jobId).emit('candidate_parsed', { candidateId, status: 'parsed', name });
     ```
   - Frontend subscribes to `jobId` channel, listens for `candidate_parsed`, and **appends a new card** with a fade-in animation.

**Concurrency note:** Featherless uses **capacity-based concurrency**, not token billing. For DeepSeek v3.2, your Premium tier allows **4 concurrent inferences** . For 10 resumes, you’ll process in batches of 4.

**Why this wins:** Real-time progress + live card appearance creates a **“watching intelligence come alive”** demo effect. Most teams show a static list after 30 seconds; you show results streaming in.

***

### Feature 3: AI Match Scoring & Ranking Engine

**User experience:**  
After parsing, the recruiter sees a **ranked list** of candidates. Each card shows:

- Match score (0–100) with animated bar
- AI decision: **SELECT** (green), **REJECT** (red), **REVIEW** (amber)
- Confidence: HIGH / MEDIUM / LOW
- Top 3 strengths & top 2 gaps
- Plain-English explanation (truncated, click for full)

**Technical flow:**

1. Backend builds a **scoring prompt** for each candidate:
   ```
   You are a senior hiring manager. Evaluate this candidate against the job.

   JOB DESCRIPTION:
   { jd_text }
   REQUIRED SKILLS: { required_skills }
   EVALUATION WEIGHTS: { github: 80, leetcode: 60, education: 40 }

   CANDIDATE DATA:
   { candidate_json }
   GITHUB STATS: { repos, stars, commit_frequency }
   LEETCODE STATS: { solved_problems, rating }

   Return ONLY valid JSON:
   {
     "match_score": 0-100,
     "decision": "SELECT | REJECT | REVIEW",
     "confidence": "HIGH | MEDIUM | LOW",
     "strengths": ["string"],
     "gaps": ["string"],
     "explanation": "3-5 sentences in plain English"
   }
   ```
2. Calls **featherless.ai** with `POST /v1/chat/completions`:
   ```js
   const response = await client.chat.completions.create({
     model: "deepseek-ai/DeepSeek-V3-0324",
     messages: [
       { role: "system", content: "You are a senior hiring manager..." },
       { role: "user", content: scoringPrompt }
     ]
   });
   const result = JSON.parse(response.choices.message.content);
   ```
3. Saves `match_score`, `decision`, `confidence`, `strengths`, `gaps`, `explanation` into `Candidate` document.
4. Frontend sorts candidates by `match_score` descending, renders **animated score bars** using Framer Motion.

**Decision logic:**

- `match_score ≥ 80` → SELECT
- `match_score ≤ 40` → REJECT
- Otherwise → REVIEW

**Why this wins:** The **explainability** is explicit: strengths, gaps, and plain-English explanation. Judges can click and see *why* the AI made the call — directly addressing the “Explainability & Clarity” evaluation criterion .

***

### Feature 4: Skill Gap Heatmap

**User experience:**  
Each candidate card has a **grid of skill pills**. For a Frontend Engineer role requiring React, TypeScript, Tailwind, Node, AWS:

- **Green (#1D9E75)**: Skill appears in candidate’s `skills` array
- **Amber (#EF9F27)**: Skill mentioned in `experience.description` but not in `skills`
- **Red (#E24B4A)**: Skill absent entirely

The recruiter sees the heatmap and instantly knows **why** someone is ranked where they are — no reading required.

**Technical implementation:**

- Frontend-only computation (no extra AI call):
  ```js
  const skillColor = (skill) => {
    if (candidate.skills.includes(skill)) return '#1D9E75'; // green
    if (candidate.experience.some(exp => exp.description.includes(skill)))
      return '#EF9F27'; // amber
    return '#E24B4A'; // red
  };
  ```
- Renders as a **flex grid** of pills with hover tooltips showing where the skill was found (explicit vs. inferred).

**Why this wins:** It’s a **2-second visual diagnosis** of fit. Most teams show a text list of skills; you show a **color-coded heatmap** that feels like a professional analytics dashboard.

***

### Feature 5: Streaming AI Explanation Panel (SSE)

**User experience:**  
Recruiter clicks **“Why was this person ranked #1?”** → a panel slides in from the right. The explanation **streams word-by-word** like watching Claude respond, with a blinking cursor. After 3–5 sentences, it stops.

**Technical implementation:**

1. Frontend:
   - Calls `POST /api/ai/explain` with `{ jobId, candidateId }`.
   - Uses `fetch` with `reader.read()` on `response.body.getReader()`:
     ```js
     const response = await fetch('/api/ai/explain', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ jobId, candidateId })
     });
     const reader = response.body.getReader();
     const decoder = new TextDecoder();
     while (true) {
       const { done, value } = await reader.read();
       if (done) break;
       const chunk = decoder.decode(value);
       setText(prev => prev + chunk); // word-by-word append
     }
     ```
2. Backend:
   - Calls **featherless.ai** with `stream: true`:
     ```js
     const response = await client.chat.completions.create({
       model: "deepseek-ai/DeepSeek-V3-0324",
       messages: [same scoring prompt but with system: "Explain in plain English"],
       stream: true
     });
     for await (const chunk of response) {
       const token = chunk.choices.delta.content;
       res.write(token); // SSE stream
     }
     res.end();
     ```

**Why this wins:** The **streaming effect** is the single most impressive UI moment in the demo. It signals “this is modern AI,” not a static precomputed result.

***

### Feature 6: Blind Screening Mode

**User experience:**  
A toggle in the recruiter’s header labeled **“Blind screening”** with an accessibility icon. When enabled:

- Name → “Candidate #4”
- Profile photo → hidden
- College name → “University — hidden”
- LinkedIn URL → hidden
- Only **skills, experience years, match score, heatmap, GitHub/LeetCode stats** remain visible.

**Technical implementation:**

- React Context:
  ```js
  const BlindContext = createContext({ blindMode: false, toggleBlind: () => {} });
  ```
- Toggle sets `blindMode: true` in context.
- CandidateCard component:
  ```js
  const { blindMode } = useBlindContext();
  const displayName = blindMode ? `Candidate #${index}` : candidate.name;
  const displayCollege = blindMode ? 'University — hidden' : candidate.college;
  ```
- **Zero backend changes** — purely UI suppression.

**Why this wins:** It’s a **60-minute implementation** that becomes a **core talking point** about bias reduction. Judges remember the “blind screening” feature for the rest of the session.

***

### Feature 7: GitHub & LeetCode Enrichment

**User experience:**  
Candidate card shows:

- GitHub badge: “42 commits/month”, “12 repos”, “⭐ 87 stars”
- LeetCode badge: “1,840 problems solved”, “Rating: 2,100”
- Top languages: JavaScript, TypeScript, Python

**Technical implementation:**

- GitHub REST API (no auth for public data):
  ```js
  const user = await fetch(`https://api.github.com/users/${username}`)
    .then(r => r.json());
  const repos = await fetch(`https://api.github.com/users/${username}/repos`)
    .then(r => r.json());
  const commitEvents = await fetch(`https://api.github.com/users/${username}/events`)
    .then(r => r.json());
  const commitCount = countCommitsLast30Days(commitEvents);
  ```
- LeetCode GraphQL:
  ```js
  const query = `query { userProfile { username, solvedBeatsStats { difficulty, count } } }`;
  const data = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables: { username } })
  }).then(r => r.json());
  ```
- Saves into `Candidate` document:
  ```js
  {
    github: { repos, stars, languages, commitFrequency },
    leetcode: { solved, rating }
  }
  ```

**Why this wins:** The problem statement explicitly asks for **multi-source enrichment** . Most teams ignore it; you make it **visible on every card**.

***

### Feature 8: Feedback Loop & Model Accuracy Widget

**User experience:**  
Admin dashboard shows:

- “Model Accuracy: 82% (last 30 days)”
- “AI consistently undervalues bootcamp educated candidates”
- List of overrides: “AI said REJECT → Recruiter clicked SELECT”

**Technical implementation:**

- When recruiter overrides:
  ```js
  await fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      jobId, candidateId, aiDecision, humanDecision, reason, timestamp
    })
  });
  ```
- Firestore `FeedbackEvent` collection:
  ```js
  {
    jobId, candidateId, aiDecision, humanDecision, reason, timestamp
  }
  ```
- Admin widget aggregates:
  ```js
  const accuracy = feedbackEvents.filter(e => e.aiDecision === e.humanDecision).length / feedbackEvents.length;
  const educationBias = groupBy(feedbackEvents, 'candidate.education_type');
  ```

**Why this wins:** Shows you understand the **full product lifecycle**, not just the MVP. Real products need feedback loops; you demonstrate that in 3 days.

***

### Feature 9: Candidate-Facing AI Interview Coach

**User experience:**  
Candidate dashboard → “Interview Prep” section → click “Generate questions” → AI returns:

1. “Explain how React’s concurrent rendering works.”  
   *Why this might be asked:* JD mentions React 18, candidate has 2 years React.  
   *How to approach:* Focus on Suspense, streaming, and automatic batching.

2. “Design a URL shortening service.”  
   *Why this might be asked:* JD mentions system design, candidate lacks it in gaps.  
   *How to approach:* Start with API design, then scaling, then DB sharding.

**Technical implementation:**

- Single featherless.ai call:
  ```js
  const prompt = `
    Generate 5 likely interview questions for this candidate based on the JD and their resume.
    For each question, include:
    - "question": string
    - "why_asked": string
    - "how_to_approach": string

    JD: { jd_text }
    Candidate: { candidate_json }

    Return ONLY valid JSON: [{ question, why_asked, how_to_approach }]
  `;
  ```
- Saves into `InterviewQuestions` collection, shown in candidate dashboard.

**Why this wins:** No competitor will build this because they’re focused on recruiters. It makes the platform **bilateral** (recruiter + candidate), which is what real products need.

***

### Feature 10: Pipeline Stage Kanban

**User experience:**  
Recruiter job view has a Kanban board:

- **Applied** → **Screening** → **Interview** → **Offer** → **Hired**
- **Rejected** lane (separate)

Drag candidates between stages. Stage counts update live.

**Technical implementation:**

- Frontend: `@hello-pangea/dnd` (maintained fork of `react-beautiful-dnd`).
- On drop:
  ```js
  await fetch(`/api/candidates/${candidateId}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage: 'Interview' })
  });
  ```
- Firestore `Candidate.stage` updates.
- Frontend re-renders column counts.

**Why this wins:** Standard HR workflow that makes the platform feel like a **complete product**, not a prototype.

***

## System Architecture

### High-Level Architecture Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Recruiter UI │  │ Candidate UI │  │ Admin UI                 │  │
│  │ (JD Wizard,  │  │ (Profile,    │  │ (Analytics, Users,       │  │
│  │  Pipeline,   │  │  Interview   │  │  Model Accuracy)         │  │
│  │  Blind Mode) │  │  Coach)      │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                     │                  │
│         └─────────────────┴─────────────────────┘                  │
│                         React + Tailwind                           │
│                  Light/Dark Mode (Context + CSS)                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │ HTTPS / REST + WebSocket
┌───────────────────────────▼───────────────────────────────────────┐
│                        API LAYER (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Express Server                                               │ │
│  │  - POST /api/jobs (JD Wizard + AI Quality)                   │ │
│  │  - POST /api/candidates/batch (Batch Upload + Parsing)       │ │
│  │  - POST /api/ai/explain (Streaming SSE)                      │ │
│  │  - PATCH /api/candidates/:id/stage (Kanban)                  │ │
│  │  - POST /api/feedback (Override Logging)                     │ │
│  │  - GET  /api/admin/accuracy (Model Metrics)                  │ │
│  └───────────────────────────┬──────────────────────────────────┘ │
│                              │                                     │
│         ┌────────────────────┼────────────────────┐               │
│         ▼                    ▼                    ▼               │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐       │
│  │ pdf-parse   │    │ GitHub REST  │    │ LeetCode GraphQL│       │
│  │ (Resume)    │    │ API          │    │ API             │       │
│  └─────────────┘    └──────────────┘    └─────────────────┘       │
│                              │                                     │
│                              ▼                                     │
│                  ┌─────────────────────┐                          │
│                  │ featherless.ai      │                          │
│                  │ DeepSeek-V3.2       │                          │
│                  │ (Chat Completions)  │                          │
│                  │ Stream + JSON Mode  │                          │
│                  └─────────────────────┘                          │
└───────────────────────────┬───────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER (Firestore)                         │
│  ┌──────────────┐  ┌──────────────�┐  ┌────────────────────────┐   │
│  │ Job          │  │ Candidate    │  │ FeedbackEvent          │   │
│  │ { jd_text,   │  │ { name,      │  │ { jobId, candidateId,  │   │
│  │  required_   │  │  skills,     │  │  aiDecision,           │   │
│  │  skills,     │  │  github,     │  │  humanDecision }       │   │
│  │  weights }   │  │  leetcode,   │  │                        │   │
│  └──────────────┘  │  match_score,│  └────────────────────────┘   │
│                    │  decision }  │                              │
│                    └──────────────┘                              │
└───────────────────────────────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | React 18 + TypeScript + Tailwind CSS + Framer Motion | Modern, type-safe, animated UI, easy dark mode |
| **State** | React Context + Zustand | Light/dark mode, blind mode, pipeline state |
| **Backend** | Node.js + Express | Simple, fast, great for AI orchestration |
| **Database** | Firestore | Flexible schema for JSON-like candidate data |
| **AI** | featherless.ai (DeepSeek-V3.2) | Unlimited access, advanced reasoning & coding, streaming support  |
| **Real-Time** | Socket.io | Live candidate parsing progress |
| **File Parsing** | `pdf-parse` | Lightweight, no external dependencies |
| **External APIs** | GitHub REST, LeetCode GraphQL | Public data, no auth needed |
| **Deploy** | Vercel (Frontend) + Render (Backend) + Firebase | Free tier friendly, fast deploy |

### Featherless.ai Integration Details

**Setup steps** (from hackathon guide) :

1. **Sign up for Feather Premium**  
   - Scan QR or click link  
   - Enter code `SUMMERHACK26` → 1 month free  
2. **Get API Key**  
   - Top-right → API Keys → Create key → copy to `.env`  
3. **Choose Model**  
   - Model catalog → **DeepSeek-V3.2** (advanced reasoning & coding)   
   - Copy model ID: `deepseek-ai/DeepSeek-V3-0324`

**API Call (OpenAI SDK)** :

```js
import { OpenAI } from 'openai';

const client = new OpenAI({
  base_url: 'https://api.featherless.ai/v1',
  api_key: process.env.FEATHERLESS_API_KEY
});

const response = await client.chat.completions.create({
  model: 'deepseek-ai/DeepSeek-V3-0324',
  messages: [
    { role: 'system', content: 'You are a senior hiring manager.' },
    { role: 'user', content: 'Your prompt here' }
  ],
  stream: true // for streaming explanations
});
```

**Concurrency limits** :

- DeepSeek v3.2 → **4 concurrent inferences** (Feather Premium only)
- Process resumes in batches of 4 for 10 PDFs

**Error handling** :

- 401 → Check API key
- 403 → Model gated → unlock on model page
- 500 → Unsupported parameters
- 503 → Cold model → retry 3 times

***

## User Flow — End-to-End Journeys

### Recruiter Journey

1. **Sign up / Log in** → Dashboard with “Create Job” button
2. **Create Job** → 3-step JD Wizard → AI Quality Score → Publish
3. **Upload Resumes** → Drag-drop 5–10 PDFs → Real-time progress bar
4. **Watch AI Parse** → Candidate cards appear live via WebSocket
5. **View Ranked List** → Sorted by match score, SELECT/REJECT/REVIEW badges
6. **Click “Why #1?”** → Streaming explanation panel slides in
7. **Toggle Blind Screening** → Names/photos hidden, skills & scores visible
8. **Drag to Kanban** → Move candidate from Screening → Interview
9. **Override AI** → Click “SELECT” (AI said REJECT) → Feedback logged
10. **View Model Accuracy** → Admin widget shows 82% match rate

### Candidate Journey

1. **Sign up** → Create profile (name, email, photo)
2. **Upload Resume** → PDF parsed → structured profile shown
3. **Link Profiles** → GitHub username, LeetCode username, LinkedIn URL
4. **View Enrichment** → GitHub stats, LeetCode rating appear
5. **Apply to Job** → Select job → submit application
6. **Track Status** → See stage: Applied → Screening → Interview
7. **Interview Prep** → Click “Generate Questions” → AI returns 5 questions with hints
8. **Receive Feedback** → Profile completeness score + “Add GitHub to improve fit”

### Admin Journey

1. **Log in** → Admin dashboard
2. **View All Jobs** → List of all jobs with candidate counts
3. **View All Candidates** → Global candidate table
4. **Model Accuracy Widget** → 82% AI–human match rate
5. **Bias Detection** → “AI undervalues bootcamp candidates”
6. **Manage Users** → Activate/deactivate recruiters & candidates
7. **Export Reports** → CSV of decisions, feedback, accuracy

***

## Premium UI/UX — Modern, Light + Dark Mode from Day One

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Light + Dark Mode** | Tailwind `dark:` classes + React Context toggle; every page supports both |
| **Smooth Transitions** | `transition-colors duration-300` on all backgrounds/text |
| **Modern Visual Hierarchy** | Large headings, generous whitespace, subtle shadows |
| **Animated Feedback** | Framer Motion for score bars, card entrances, panel slides |
| **Color Palette** | Primary: `#2563EB` (blue), Success: `#1D9E75`, Warning: `#EF9F27`, Danger: `#E24B4A` |
| **Typography** | Inter (Google Fonts), 16px base, 1.5 line height |
| **Accessibility** | Blind mode toggle with icon, ARIA labels, keyboard navigation |

### Dark Mode Implementation

**Tailwind config:**

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: { light: '#FFFFFF', dark: '#0F172A' },
        surface: { light: '#F8FAFC', dark: '#1E293B' },
        text: { light: '#0F172A', dark: '#F1F5F9' }
      }
    }
  }
};
```

**React Context:**

```js
const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Usage in components:**

```jsx
<div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
  <h1 className="text-2xl font-bold">TalentIQ</h1>
</div>
```

### Key UI Screens (Wireframe Descriptions)

#### 1. Recruiter Dashboard

- **Header:** Logo, Job_selector, Blind_mode_toggle, Theme_toggle, User_avatar
- **Main:**
  - JD Health Card (clarity_score, ambiguous_areas)
  - Drop_zone (drag PDFs)
  - Progress_bar (3/5 parsed)
  - Ranked_list (cards with score_bar, decision_badge, heatmap)
- **Sidebar:** Pipeline Kanban (Applied, Screening, Interview, Offer, Hired, Rejected)

#### 2. Candidate Card

- **Top row:** Name (or “Candidate #4” in blind mode), match_score bar, decision_badge
- **Middle row:** Heatmap (green/amber/red skill pills)
- **Bottom row:** GitHub badge (repos, stars, commits), LeetCode badge (solved, rating), “Why?” button → opens streaming panel

#### 3. Streaming Explanation Panel

- **Slide-in from right** (Framer Motion `x: [800, 0]`)
- **Blinking cursor** during streaming
- **Plain-English text** with bolded skills
- **Close button** (X) or click outside

#### 4. Admin Dashboard

- **Top row:** Model_accuracy_widget (82%), total_jobs, total_candidates
- **Middle:** Bias_detection_card (“AI undervalues bootcamp”)
- **Bottom:** Override_table (AI decision → Human decision → reason)

***

## Why This Is a Winner’s Project

| Evaluation Criterion | How TalentIQ Wins |
|----------------------|-------------------|
| **Decision Accuracy** | Multi-source enrichment (GitHub, LeetCode) + weighted scoring + recruiter overrides logged |
| **Explainability & Clarity** | Strengths, gaps, plain-English explanation, skill heatmap, streaming panel |
| **Frontend Experience** | Light/dark mode, streaming SSE, animated score bars, live WebSocket progress, blind mode |
| **Backend Architecture** | Clean REST + WebSocket, modular AI orchestration, Firestore flexible schema |
| **Scalability & Performance** | Batch processing (4 concurrent), featherless.ai capacity-based scaling, no token billing |
| **Innovation in Solution Design** | JD Quality Scorer, Blind Screening, Interview Coach, Feedback Loop, Skill Heatmap |

***

## Next Steps for Implementation

1. **Day 1:**  
   - Setup repo (React + Node + Firebase)  
   - Implement JD Wizard + AI Quality Scorer  
   - Implement Batch Upload + PDF parsing + WebSocket  

2. **Day 2:**  
   - Implement AI Match Scoring + Ranking  
   - Implement Skill Heatmap + Streaming Explanation Panel  
   - Implement Blind Screening + GitHub/LeetCode Enrichment  

3. **Day 3:**  
   - Implement Kanban + Feedback Loop + Admin Dashboard  
   - Implement Candidate Interview Coach  
   - Polish UI (light/dark mode, animations, accessibility)  
   - Demo rehearsal with live data  

***

This is the **complete, text-formatted deep dive** you requested: what the project is, full PRD, every feature with technical details, architecture, user flows, and premium UI/UX with light + dark mode from day one. Use this as your **master prompt** for AI assistants (Stitch AI, Claude, Gemini) to generate code, documentation, and slides.

Let me know if you want this exported as a Markdown file, Notion doc, or split into implementation tickets.