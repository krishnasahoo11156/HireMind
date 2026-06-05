Since you're already ~75% complete, don't generate one giant prompt. Give your IDE/Cursor/Windsurf small implementation blocks in priority order. This prevents regressions and keeps context focused.

BLOCK 1 — Featherless AI Integration (Highest Priority)

Implement real Featherless.ai integration for the HireMind backend.

Requirements:

Create:
server/src/services/ai.service.ts
Use OpenAI SDK configured for Featherless:
const client = new OpenAI({
  baseURL: "https://api.featherless.ai/v1",
  apiKey: process.env.FEATHERLESS_API_KEY
});
Implement:
analyzeJobDescription(jdText)
extractResumeData(rawResumeText)
scoreCandidate(jobData,candidateData,githubData,leetcodeData)
generateExplanation(jobData,candidateData)
generateInterviewQuestions(jobData,candidateData)
Use model:

deepseek-ai/DeepSeek-V3-0324

Return structured JSON only.
Add retry logic:
401 → invalid API key
403 → gated model
503 → exponential retry
Add environment variables:

FEATHERLESS_API_KEY
FEATHERLESS_MODEL

Create reusable prompt templates.
Ensure all existing mock services can be replaced by this service without breaking routes.
Maintain TypeScript strict typing.
BLOCK 2 — Real Resume Parsing

Replace mock resume parsing with production-ready parsing.

Requirements:

Install:
pdf-parse
mammoth
Support:
PDF
DOCX
Create:

server/src/services/documentParser.ts

Functions:

parsePDF(buffer)
parseDOCX(buffer)
extractText(file)
After text extraction:

Send text to ai.service.extractResumeData()

Return:

{
name,
email,
phone,
education,
experience,
projects,
skills,
certifications,
github_url,
leetcode_url,
linkedin_url,
portfolio_url
}

Update existing upload routes.
Keep fallback mode:

If AI fails:

store raw text
mark candidate "manual_review"
Maintain compatibility with existing Resume schema.
BLOCK 3 — Streaming Explainable AI Panel

Implement streaming candidate explanations.

Backend:

Create:

server/src/routes/ai.routes.ts

Endpoint:

POST /api/ai/explain

Use Server Sent Events (SSE).

Headers:

Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

Stream Featherless responses token by token.

Frontend:

Create:

components/ExplanationPanel.tsx

Requirements:

Slide in drawer
Framer Motion animation
Typewriter effect
Streaming text rendering
Loading state
Error state

UI:

Title:
Why this candidate?

Display:

Strengths
Weaknesses
JD alignment
GitHub contribution analysis
LeetCode analysis

Close on outside click.

BLOCK 4 — WebSocket Resume Processing

Implement real-time resume processing updates.

Backend:

Install:
socket.io

Create:

socket.ts

Initialize Socket.io in Express server.

Events:

resume_upload_started
resume_parsed
candidate_scored
ranking_updated

Frontend:

Install:
socket.io-client

Subscribe by jobId.

Requirements:

Live progress bar
Live candidate card insertion
Resume processing status
Reconnect handling

UI:

0/10 Parsed
3/10 Parsed
7/10 Parsed
10/10 Parsed

Animations via Framer Motion.

BLOCK 5 — JD Quality Scorer + Wizard

Build the 3-step Job Creation Wizard.

Step 1:

Title
Department

Step 2:

Skills
Experience
Certifications

Step 3:

Evaluation weights

Sliders:

GitHub importance
LeetCode importance
Education importance

After JD submission:

Call analyzeJobDescription()

Return:

{
required_skills,
nice_to_have,
red_flags,
clarity_score,
ambiguous_areas
}

Display:

JD Quality Card

Sections:

Clarity Score
Missing Requirements
Ambiguous Areas
Suggested Improvements

Use Framer Motion transitions.

BLOCK 6 — Real GitHub Integration

Replace mock GitHub data.

Create:

services/github.service.ts

Fetch:

GET /users/
GET /users//repos
GET /users//events

Extract:

repos
stars
languages
commits
contributions
activity

Return:

{
repoCount,
totalStars,
topLanguages,
commitFrequency,
recentActivity,
summary
}

Cache results 10 minutes.

Display:

Language chart
Repo cards
Commit activity
AI summary

Fallback to mock data if API fails.

BLOCK 7 — Real LeetCode Integration

Implement LeetCode GraphQL integration.

Create:

services/leetcode.service.ts

Fetch:

easy solved
medium solved
hard solved
contest rating
ranking

Return:

{
easy,
medium,
hard,
rating,
ranking,
activityLevel,
summary
}

Cache for 10 minutes.

Display:

Stacked chart
Rating card
Ranking percentile
AI assessment

Fallback gracefully when profile unavailable.

BLOCK 8 — Kanban Hiring Pipeline

Implement hiring workflow Kanban.

Install:

@hello-pangea/dnd

Stages:

Applied
Screening
Interview
Offer
Hired
Rejected

Backend:

PATCH /api/candidates//stage

Database:

Add:

stage:
"applied" |
"screening" |
"interview" |
"offer" |
"hired" |
"rejected"

Frontend:

KanbanBoard.tsx

Features:

drag and drop
counts per column
persistence
animations
optimistic updates

Cards:

candidate
score
recommendation
BLOCK 9 — Candidate Portal

Implement candidate-facing workflow.

Features:

Candidate registration
Candidate dashboard

Sections:

Profile
Resume
GitHub
LeetCode
Applications
Public jobs page
Apply flow
Status tracker

Stages:

Applied
Screening
Interview
Offer
Hired

Profile completeness score
Resume editing
Social links management

Use existing authentication system.

BLOCK 10 — AI Interview Coach

Implement Interview Coach.

Component:

InterviewCoach.tsx

Button:

Generate Questions

Call:

generateInterviewQuestions()

Return:

5 personalized questions.

Each question:

{
question,
whyAsked,
howToApproach
}

UI:

Accordion cards.

Animations:

Framer Motion.

Allow regenerate.

BLOCK 11 — Admin Intelligence Dashboard

Upgrade Analytics page into Admin Dashboard.

Sections:

AI Accuracy
Override History
Hiring Funnel
Bias Detection
Screening Time Saved
Recruiter Activity

Charts:

Recharts only

Metrics:

accuracy =
(total decisions - overrides) / total decisions

Bias detection:

Group overrides by:

education
experience
candidate source

Display actionable insights.

Recommended Execution Order
Featherless AI
Resume Parsing
Streaming Explanations
WebSockets
JD Quality Scorer
GitHub API
LeetCode API
Kanban
Candidate Portal
Interview Coach
Admin Dashboard

After Blocks 1–5, you'll already have roughly 90–92% of the hackathon-winning functionality, because those are the exact differentiators highlighted in the implementation plan as P0/P1 features.

ok thanks

You're welcome! Based on what you've already built, I'd focus exclusively on:

Featherless AI integration
Resume parsing (PDF/DOCX)
Streaming explanations
WebSocket live processing
JD Quality Scorer

Those five features are the biggest jump in judge perception and align directly with the problem statement's emphasis on multi-source analysis and explainable AI. After that, Kanban and Interview Coach are strong demo enhancers.

One practical tip: after each block is implemented, test it immediately against the demo flow. It's much easier to catch integration issues after Block 3 than after all 11 blocks are merged together.

Good luck with HireMind! It already has a solid foundation—finishing the AI and real-time pieces should make it stand out in the hackathon. 🚀