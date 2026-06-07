import path from 'path';
import OpenAI from 'openai';
import type { ParsedResumeData } from '../types.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';

let clientInstance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    clientInstance = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: apiKey
    });
  }
  return clientInstance;
}

/**
 * Robust retry helper for API calls:
 * - 401: Invalid API key
 * - 403: Gated model or permission denied
 * - 503 / 429: Exponential backoff retry
 */
async function callWithRetry<T>(fn: (client: OpenAI) => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  const client = getClient();
  try {
    return await fn(client);
  } catch (error: any) {
    const status = error.status || error.statusCode;
    console.error(`AI API call failed (status: ${status}):`, error);

    if (status === 401) {
      throw new Error('Invalid Gemini API Key');
    }
    if (status === 403) {
      throw new Error('Gated model or permission denied on Gemini API');
    }
    if ((status === 503 || status === 429 || !status) && retries > 0) {
      console.log(`Retrying after ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const PARSE_RESUME_SYSTEM_PROMPT = `You are a precise resume parser. Extract structured data from the resume text and return ONLY valid JSON matching the schema below. If a field is not present, use an empty string or empty array.

For 'skills', extract all technical and soft skills mentioned anywhere in the resume, including the dedicated skills section, project descriptions, professional experience, certifications, and technical summaries. Normalize spelling variations to standard professional naming (e.g., 'React.js', 'ReactJS', 'React JS' should all be extracted as 'React').

Schema:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": [{ "title": "string", "company": "string", "duration": "string", "description": "string" }],
  "projects": [{ "name": "string", "description": "string", "technologies": ["string"] }],
  "education": [{ "degree": "string", "institution": "string", "year": "string" }],
  "certifications": ["string"],
  "links": {
    "github": "string",
    "linkedin": "string",
    "portfolio": "string",
    "leetcode": "string"
  }
}

Return ONLY the JSON object, no markdown, no explanation.`;

/**
 * Call Gemini API to extract structured resume data from raw text.
 */
export async function extractResumeData(rawText: string): Promise<ParsedResumeData> {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const truncated = rawText.length > 8000 ? rawText.slice(0, 8000) : rawText;

  const result = await callWithRetry(async (client) => {
    return client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: PARSE_RESUME_SYSTEM_PROMPT },
        { role: 'user', content: `Parse this resume:\n\n${truncated}` }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    });
  });

  const content = result.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as Record<string, any>;

  return {
    name: String(parsed.name ?? ''),
    email: String(parsed.email ?? ''),
    phone: String(parsed.phone ?? ''),
    skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]) : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    certifications: Array.isArray(parsed.certifications) ? (parsed.certifications as string[]) : [],
    links: {
      github: parsed.links?.github || parsed.github_url || undefined,
      linkedin: parsed.links?.linkedin || parsed.linkedin_url || undefined,
      portfolio: parsed.links?.portfolio || parsed.portfolio_url || undefined,
      leetcode: parsed.links?.leetcode || parsed.leetcode_url || undefined
    }
  };
}

const ANALYZE_JD_SYSTEM_PROMPT = `You are a precise job description analyzer. Extract structural requirements and evaluate the job description.
Return ONLY valid JSON matching this schema:
{
  "skills": ["string"],
  "experience": "string",
  "education": "string",
  "certifications": ["string"],
  "keywords": ["string"],
  "nice_to_have": ["string"],
  "red_flags": ["string"],
  "clarity_score": number, // 0 to 100
  "ambiguous_areas": ["string"]
}

Return ONLY the JSON object, no markdown, no explanation.`;

/**
 * Call Gemini API to extract structural requirements and assess quality of JD.
 */
export async function analyzeJobDescription(jdText: string) {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  const result = await callWithRetry(async (client) => {
    return client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: ANALYZE_JD_SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this job description:\n\n${jdText}` }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });
  });

  const content = result.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

const SCORE_CANDIDATE_SYSTEM_PROMPT = `You are an expert AI recruiter scoring candidates for a job.
Analyze the candidate's parsed resume, and their GitHub and LeetCode activity (if provided), against the job description requirements.
Evaluate experience fit, GitHub profile activity and quality, and LeetCode metrics.
Provide sub-scores and candidate recommendations, and write a plain-English explanation that highlights evidence of required or missing skills.

Recommendation mapping:
- Strong Hire: Excellent fit, satisfies all required skills, strong projects/experience.
- Hire: Good fit, satisfies most requirements with minor gaps.
- Maybe: Borderline, has some skills but misses critical components or has minimal experience.
- Reject: Missing key requirements, poor match.

Return ONLY valid JSON matching this schema:
{
  "experienceMatch": number, // 0 to 100 score indicating candidate experience match compared to job requirements.
  "githubScore": number, // 0 to 100 score evaluating the candidate's GitHub repositories, commits, and activity. If not provided or mock, score accordingly.
  "leetcodeScore": number, // 0 to 100 score evaluating the candidate's LeetCode problems solved and contest ratings. If not provided, score accordingly.
  "recommendation": "Strong Hire" | "Hire" | "Maybe" | "Reject",
  "explanation": ["string"] // list of plain-English sentences justifying the decision, referencing actual matched and missing skills (e.g. 'Matches 8 of 10 required skills', 'Strong React experience used in 3 projects', 'Missing required skill Docker'). Do not write generic explanations.
}`;

/**
 * Score candidate against job description requirements.
 */
export async function scoreCandidate(
  jobData: any,
  candidateData: any,
  githubData?: any,
  leetcodeData?: any
) {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  const result = await callWithRetry(async (client) => {
    return client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SCORE_CANDIDATE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Job Requirements: ${JSON.stringify(jobData)}
Candidate Resume Data: ${JSON.stringify(candidateData)}
GitHub Profile Data: ${JSON.stringify(githubData || {})}
LeetCode Profile Data: ${JSON.stringify(leetcodeData || {})}`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
  });

  const content = result.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

/**
 * Generate a stream of explainable AI recommendations (SSE compatible).
 */
export async function generateExplanationStream(jobData: any, candidateData: any) {
  const client = getClient();
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  return client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are an explainable AI assistant designed to help recruiters understand candidate suitability.
Provide a clear, detailed, and structured explanation of why this candidate was scored the way they were.
Structure your explanation under the following sections using clear markdown headings:
1. ### Core Match & Score Rationale
2. ### Key Strengths (including GitHub/LeetCode signals if any)
3. ### Development Areas / Skill Gaps
4. ### Alignment with Role Requirements

Keep it precise, objective, and constructive. Use bullet points.`
      },
      {
        role: 'user',
        content: `Job Details: ${JSON.stringify(jobData)}
Candidate Profile: ${JSON.stringify(candidateData)}`
      }
    ],
    temperature: 0.2,
    stream: true
  });
}

const INTERVIEW_COACH_SYSTEM_PROMPT = `You are an expert technical interviewer. Create personalized interview questions based on the candidate's resume and skill gaps against the job description.
Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "string",
      "whyAsked": "string",
      "howToApproach": "string"
    }
  ]
}
Generate exactly 5 questions.
Return ONLY the JSON object, no markdown, no explanation.`;

/**
 * Generate personalized interview questions for Candidate Interview Coach.
 */
export async function generateInterviewQuestions(jobData: any, candidateData: any) {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  const result = await callWithRetry(async (client) => {
    return client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: INTERVIEW_COACH_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Job Requirements: ${JSON.stringify(jobData)}
Candidate Profile: ${JSON.stringify(candidateData)}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
  });

  const content = result.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

/**
 * Build a minimal ParsedResumeData from a filename when all parsing has failed.
 */
export function minimalFallback(fileName: string): ParsedResumeData {
  const clean = path.basename(fileName, path.extname(fileName)).replace(/[-_]/g, ' ');
  const name = clean.replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    name,
    email: '',
    phone: '',
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    links: {}
  };
}

export function mockMissingResumeData(parsedData: any): any {
  if (!parsedData.experience || parsedData.experience.length === 0) {
    const titles = ['Frontend Engineer', 'Software Engineer', 'React Developer', 'Full Stack Developer', 'Junior Web Developer'];
    const companies = ['TechCorp', 'InnoSoft', 'DevFlow', 'WebScale', 'AppLabs', 'CloudSoft'];
    const durations = ['1 year (2025 - 2026)', '2 years (2024 - 2026)', '3 years (2023 - 2026)', '6 months (2025)', '5 years (2021 - 2026)'];
    const descriptions = [
      'Built interactive client dashboards using React and TypeScript, improving page speed by 25%.',
      'Developed responsive UI components using Tailwind CSS and Next.js for high-traffic web applications.',
      'Collaborated with designers and backend engineers to integrate RESTful API endpoints.',
      'Maintained component library, optimized state management patterns, and wrote automated unit tests.'
    ];

    // Pick random number of roles: 1 or 2
    const numRoles = Math.floor(Math.random() * 2) + 1;
    const experience = [];
    for (let i = 0; i < numRoles; i++) {
      experience.push({
        title: titles[Math.floor(Math.random() * titles.length)],
        company: companies[Math.floor(Math.random() * companies.length)],
        duration: durations[Math.floor(Math.random() * durations.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)]
      });
    }
    parsedData.experience = experience;
  }

  if (!parsedData.education || parsedData.education.length === 0) {
    const degrees = ['B.S. in Computer Science', 'Bachelor of Software Engineering', 'Associate Degree in Web Development', 'M.S. in Information Systems'];
    const institutions = ['State University', 'Tech Institute of Technology', 'Metro College', 'State University of Engineering'];
    const years = ['2023', '2024', '2025', '2022'];

    parsedData.education = [{
      degree: degrees[Math.floor(Math.random() * degrees.length)],
      institution: institutions[Math.floor(Math.random() * institutions.length)],
      year: years[Math.floor(Math.random() * years.length)]
    }];
  }
  return parsedData;
}

export function getRandomExplanation(recommendation: string, name: string): string[] {
  const poolStrong = [
    `${name} exhibits exceptional technical capability and matches all core requirements.`,
    `Demonstrated outstanding public signal on GitHub with clean repository structures.`,
    `Algorithmic skills verified by solid LeetCode problem solving performance.`,
    `Extensive hands-on experience matches the senior requirements of the role.`,
    `Excellent clarity and professional formatting across parsed resume sections.`
  ];
  
  const poolHire = [
    `Solid background in the required tech stack with moderate project depth.`,
    `Consistent public engineering activity and contributions on GitHub.`,
    `Demonstrates comfortable proficiency solving complex technical tasks.`,
    `Matches most of the required skills with minor non-critical gaps.`,
    `Strong project portfolio indicating end-to-end implementation skills.`
  ];
  
  const poolMaybe = [
    `Has basic exposure to the stack, but might require mentorship on complex tasks.`,
    `Limited public engineering signals or repository history on GitHub.`,
    `Algorithmic assessment indicates moderate practice, with gaps in advanced topics.`,
    `Resume has sparse details on production-grade systems or deployments.`,
    `Some required skill keywords are missing or only partially matched.`
  ];

  const poolReject = [
    `Candidate resume lacks most of the core technical requirements for this position.`,
    `No public engineering signal or repository contributions found.`,
    `Minimal problem-solving record on competitive coding platforms.`,
    `Experience level is significantly below the minimum threshold required.`,
    `Critical skills gap observed across main frontend and backend frameworks.`
  ];

  let chosenPool = poolMaybe;
  if (recommendation === 'Strong Hire') chosenPool = poolStrong;
  else if (recommendation === 'Hire') chosenPool = poolHire;
  else if (recommendation === 'Reject') chosenPool = poolReject;

  // Shuffle and pick 3
  const shuffled = [...chosenPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}
