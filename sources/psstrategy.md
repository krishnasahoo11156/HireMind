I'll analyze all three problem statements carefully and give you a strategic breakdown to maximize your winning chances.Let me build you a comprehensive strategy visual right away.Now let me give you the killer ideas that will separate your submission from everyone else.

---

## Go with Problem Statement 3 — AI Recruitment Platform

Here's the full strategy breakdown.

**Why PS3 dominates the other two:** PS1 (OCR for Indian scripts) is a research problem — you'd need datasets, fine-tuned models, and weeks to get meaningful accuracy. PS2 (image-to-video) requires video generation infrastructure that doesn't exist cleanly on featherless.ai. PS3 is a full-stack product problem, which means your React + Node + Firebase stack is a direct match. The AI is the cherry on top, not the entire foundation.

---

## Mind-Blowing Ideas That Can Win It

These are the differentiators — things nobody else will likely build in 3 days:

**1. Live AI Explanation Panel ("Why was this candidate selected?")**
When the AI ranks a candidate, show a live streaming explanation in plain English — like "Ranked #1 because 3+ years of React matches JD, GitHub activity shows 47 commits in last month, LeetCode rating of 1800 aligns with the problem-solving requirement." This is what the judges mean by "explainability" — most teams will show a score, you show the *reasoning*. Use featherless.ai's streaming API for real-time text generation.

**2. GitHub + LeetCode Profile Analyzer**
Pull the candidate's GitHub and LeetCode links, scrape basic public stats (commit frequency, top languages, problem count/rating), and feed them into the AI alongside the resume. This directly addresses the "multi-source analysis" requirement in the problem statement and almost no team will do it. Even basic scraping (using a backend proxy) demonstrates you understood the problem deeply.

**3. Skill Gap Heatmap**
For each candidate, show a visual heatmap of their skills vs. the job requirements — green for matched, amber for partial, red for missing. Not just a score but a *visual gap analysis*. Recruiters can see at a glance why someone was reviewed instead of selected.

**4. Bias-Free Mode Toggle**
Add a toggle that hides name, gender markers, and college names from the recruiter view, showing only skills, experience, and AI score. Label it "Blind Screening Mode." This is a zero-code toggle (just hide those UI fields) but it's an innovation that judges will remember — it shows ethical thinking and real-world awareness.

**5. Batch Upload + Auto-Pipeline**
Let recruiters drag-and-drop 10 resumes at once. The system queues them, processes each through the AI pipeline, and populates the ranked dashboard live — like watching results come in. This creates a genuinely impressive demo moment.

**6. Recruiter Feedback Loop**
When a recruiter overrides the AI decision (changes "Reject" to "Select"), the system logs it with a reason. Show a small "Model Accuracy" score that updates as feedback accumulates. This directly hits the "Decision Accuracy" and "Scalability" criteria — you're demonstrating that the system learns.

---

## What Your Demo Video Should Show

The demo is make-or-break. Script it like this: recruiter uploads a job description → uploads 5 resumes in batch → AI processes them live with a progress bar → ranked dashboard appears → recruiter clicks into the top candidate → explanation panel shows reasoning → skill gap heatmap visible → recruiter toggles blind screening mode → overrides one decision with a reason → Admin sees the analytics panel with model accuracy.

That's 90 seconds of pure wow.

---

## Stack Decisions

Use featherless.ai with `deepseek-ai/DeepSeek-V3-0324` as your primary model — it has strong reasoning and coding capabilities which means it'll extract and structure resume data cleanly. For the frontend, Recharts for the skill heatmap and ranking charts. For resume parsing, use `pdf-parse` on the Node.js backend to extract raw text, then send it to featherless.ai with a structured prompt asking for JSON output (skills, experience years, education, certifications). Everything else is your existing MERN comfort zone.

The architecture document you submit should show: React frontend → Express API → Firestore (candidates, jobs, decisions) → featherless.ai (AI layer) → GitHub/LeetCode scraper (optional enrichment layer). Clean, explainable, scalable on paper.

You have roughly 48 working hours. The first 8 hours are your most important — get auth, resume upload, and the first AI call working end-to-end. Once that pipeline exists, everything else is UI and features layered on top.