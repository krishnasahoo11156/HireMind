# HireMind 
### AI-Powered Explainable Hiring Intelligence Platform

> Transform hiring from resume screening to intelligent talent discovery with explainable AI, skill-gap analysis, blind screening, and recruiter feedback learning.

---

## 📖 Overview

HireMind is an AI-powered recruitment intelligence platform designed to help recruiters, hiring managers, and organizations make faster, fairer, and more data-driven hiring decisions.

Unlike traditional Applicant Tracking Systems (ATS) that simply rank candidates, HireMind provides transparent AI explanations, candidate skill-gap analysis, GitHub and LeetCode profiling, blind screening support, and recruiter feedback learning loops.

Built for the Summer Hackathon 2026 Problem Statement 3 (AI-Powered Resume Screening & Candidate Ranking System), HireMind combines modern AI workflows with enterprise-grade UX and explainability. :contentReference[oaicite:0]{index=0}

---

# ✨ Key Features

## 🧠 Explainable AI Ranking

Instead of only providing a score, HireMind explains:

- Why Candidate A was ranked above Candidate B
- Which skills matched the Job Description
- Missing requirements
- GitHub activity impact
- Coding profile impact
- Experience relevance

Example:

> Ranked #1 because:
>
> - React experience exceeds requirements
> - Strong TypeScript expertise
> - 47 GitHub commits in last 30 days
> - 342 LeetCode problems solved
> - Portfolio projects closely align with role requirements

---

## 📄 AI Resume Parsing

Upload:

- PDF resumes
- DOCX resumes

Extract:

- Personal details
- Skills
- Experience
- Projects
- Education
- Certifications
- Portfolio links
- GitHub profile
- LinkedIn profile
- LeetCode profile

---

## 💼 Job Description Intelligence

Upload a Job Description or paste text.

HireMind automatically extracts:

- Required skills
- Experience requirements
- Education requirements
- Certifications
- Keywords
- Hiring priorities

---

## 📊 Candidate Ranking Engine

Each candidate receives:

| Metric | Description |
|----------|-------------|
| AI Score | Overall suitability score |
| Match % | JD alignment percentage |
| Recommendation | Strong Hire / Hire / Maybe / Reject |
| Rank | Position among all candidates |

---

## 🔥 GitHub Profile Analyzer

Multi-source evaluation beyond resumes.

Analyze:

- Repository count
- Commit frequency
- Top programming languages
- Open-source activity
- Stars earned
- Contribution graph
- Recent development activity

This directly addresses the multi-source analysis requirement of the problem statement. :contentReference[oaicite:1]{index=1}

---

## 🏆 LeetCode Analyzer

Evaluate coding strength through:

- Problems solved
- Contest rating
- Global ranking
- Activity consistency
- Skill indicators

---

## 📈 Skill Gap Heatmap

Visual comparison of:

| Skill | Required | Candidate |
|---------|---------|---------|
| React | Yes | Match |
| TypeScript | Yes | Match |
| Redux | Yes | Partial |
| Next.js | Yes | Missing |

Status Colors:

🟢 Match

🟡 Partial Match

🔴 Missing

---

## 👁️ Blind Screening Mode

Reduce unconscious bias by hiding:

- Candidate names
- Gender indicators
- Email addresses
- Phone numbers
- University names

Recruiters only see:

- Skills
- Experience
- Projects
- AI Score
- Match Percentage

This promotes fair and ethical hiring practices. :contentReference[oaicite:2]{index=2}

---

## 🔄 Recruiter Feedback Loop

Recruiters can override AI decisions.

Examples:

- AI says Reject → Recruiter selects candidate
- AI says Hire → Recruiter rejects candidate

Reasons are stored and tracked to measure:

- AI accuracy
- Human intervention
- Decision quality

---

## 📉 Analytics Dashboard

Track:

- Resumes Reviewed
- Candidates Selected
- Hiring Funnel
- Time Saved
- AI Accuracy
- Recruiter Overrides
- Screening Efficiency

---

# 🏗️ System Architecture

```text
Recruiter
    │
    ▼
React Frontend (Vite + TypeScript)
    │
    ▼
Express API Gateway
    │
    ├── Resume Parser
    ├── GitHub Analyzer
    ├── LeetCode Analyzer
    ├── AI Ranking Engine
    │
    ▼
Featherless AI
    │
    ▼
MongoDB Database
```

---

# 🛠 Tech Stack

## Frontend

- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand
- React Query
- Framer Motion
- Recharts
- Lucide Icons

## Backend

- Node.js
- Express.js
- REST APIs
- Multer

## Database

- MongoDB
- Mongoose ODM

## AI

- Featherless.ai Integration
- Streaming AI Explanations

## Storage

- Cloudinary / AWS S3
- Local fallback storage

---

# 🎨 Design Philosophy

Inspired by:

- Linear
- Ashby
- Greenhouse
- Notion
- Rippling

Focus:

✅ Professional

✅ Enterprise

✅ Data Dense

✅ Explainable

❌ Neon UI

❌ Overuse of gradients

❌ Excessive glassmorphism

---

# 🌗 Theme Support

## Light Theme

- Background: #F8F8F7
- Surface: #FFFFFF
- Primary: #1F2937
- Accent: #A16207

## Dark Theme

- Background: #0F1115
- Surface: #181B22
- Accent: #D4A017

---

# 📂 Core Modules

## 1. Authentication

- Login
- Register
- JWT Authentication
- Role-based access

Roles:

- Recruiter
- Hiring Manager
- Admin

---

## 2. Job Management

Create jobs.

Upload Job Descriptions.

AI extracts:

- Skills
- Experience
- Keywords

---

## 3. Resume Management

Upload:

- Single Resume
- Batch Resumes (10–20)

Features:

- Parsing
- Validation
- Progress Tracking

---

## 4. Candidate Intelligence Engine

Combines:

- Resume Analysis
- JD Analysis
- GitHub Data
- LeetCode Data
- AI Reasoning

Outputs:

- Score
- Ranking
- Recommendations
- Explanations

---

## 5. Ranking Dashboard

View:

- Ranked Candidates
- Filters
- Sorting
- Search

---

## 6. Candidate Profile

Detailed candidate insights including:

- Resume Summary
- Skill Heatmap
- GitHub Analysis
- LeetCode Analysis
- AI Explanation Panel

---

## 7. Explainable AI Panel

HireMind's flagship feature.

Live-streamed AI reasoning explaining:

- Candidate strengths
- Candidate weaknesses
- Ranking justification

Uses Featherless streaming responses. :contentReference[oaicite:3]{index=3}

---

## 8. Blind Screening

Anonymous candidate evaluation mode.

Ensures skills-first hiring.

---

## 9. Feedback Learning

Capture recruiter decisions and improve trust in AI recommendations.

---

## 10. Analytics

Track hiring performance and recruitment efficiency.

---

# 🧪 Demo Scenario

### Frontend Developer Role

Required Skills:

- React
- TypeScript
- Redux
- Next.js
- TailwindCSS

Experience:

- 3–5 Years

Candidates:

1. Sarah Chen
2. Alex Rodriguez
3. Rahul Patel
4. Emma Wilson
5. Jordan Smith

Expected Ranking:

| Rank | Candidate | Recommendation |
|--------|------------|---------------|
| #1 | Sarah Chen | Strong Hire |
| #2 | Alex Rodriguez | Hire |
| #3 | Rahul Patel | Maybe |
| #4 | Emma Wilson | Maybe |
| #5 | Jordan Smith | Reject |

---

# 🚀 Featherless AI Integration

HireMind uses Featherless.ai as its inference layer for:

- Resume understanding
- Job description extraction
- Candidate ranking
- Explainability generation
- Skill-gap analysis

Featherless provides:

- Serverless AI inference
- Access to thousands of open-source models
- Chat completion APIs
- Streaming AI responses :contentReference[oaicite:4]{index=4}

Example Endpoint:

```http
POST /v1/chat/completions
```

Recommended Models:

- DeepSeek-V3.2
- MiniMax-M2.5
- Kimi-K2.5
- Mistral-Nemo-Instruct
- GLM-5 :contentReference[oaicite:5]{index=5}

---

# 📊 Business Impact

### For Recruiters

- Faster screening
- Better candidate visibility
- Explainable decisions
- Reduced bias

### For Organizations

- Improved hiring quality
- Better recruiter productivity
- Transparent AI adoption
- Data-driven recruitment

### For Candidates

- Fair evaluation
- Reduced bias
- Better opportunity matching

---

# 🎯 Hackathon Innovation Highlights

### ⭐ Explainable AI Panel

Most competitors show scores.

HireMind shows reasoning.

### ⭐ Multi-Source Candidate Intelligence

Combines:

- Resume
- GitHub
- LeetCode

### ⭐ Blind Screening Mode

Ethical and unbiased hiring.

### ⭐ Skill Gap Heatmaps

Visual decision support.

### ⭐ Recruiter Feedback Learning

Tracks human-AI alignment.

---

# 📋 Future Roadmap

### V2

- Candidate Comparison
- Interview Question Generator
- Hiring Summary PDFs
- Candidate Timeline

### V3

- LinkedIn Analysis
- AI Interview Agent
- Hiring Forecasting
- Organization Talent Graph

---

# 🏆 Why HireMind?

HireMind is not another ATS.

It is an Explainable Hiring Intelligence Platform that helps recruiters understand not just *who* is the best candidate, but *why* they are the best candidate.

By combining AI explainability, multi-source intelligence, blind screening, and recruiter feedback learning, HireMind creates a transparent, fair, and efficient hiring experience for modern organizations.

---

## Built For

**Summer Hackathon 2026 — Problem Statement 3**  
**AI-Powered Resume Screening & Candidate Ranking System** :contentReference[oaicite:6]{index=6}

### Tagline

**"Hire Smarter. Hire Fairer. Hire with Confidence."**
