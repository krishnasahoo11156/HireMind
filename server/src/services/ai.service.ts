import path from 'path';
import type { ParsedResumeData } from '../types.js';

const FEATHERLESS_API = 'https://api.featherless.ai/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
// Maximum characters of resume text to send (stay well within context limits)
const MAX_TEXT_CHARS = 6000;

const SYSTEM_PROMPT = `You are a precise resume parser. Extract structured data from the resume text and return ONLY valid JSON matching the schema below. If a field is not present, use an empty string or empty array.

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
 * Call the Featherless AI API to extract structured resume data from raw text.
 * Throws if FEATHERLESS_API_KEY is missing or the request fails — callers should handle the fallback.
 */
export async function extractResumeData(rawText: string): Promise<ParsedResumeData> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('FEATHERLESS_API_KEY is not configured');
  }

  const model = process.env.FEATHERLESS_MODEL ?? DEFAULT_MODEL;
  const truncated = rawText.length > MAX_TEXT_CHARS ? rawText.slice(0, MAX_TEXT_CHARS) : rawText;

  const response = await fetch(FEATHERLESS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Parse this resume:\n\n${truncated}` }
      ],
      temperature: 0,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Featherless API error ${response.status}: ${body}`);
  }

  const json = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = json.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(content) as Record<string, unknown>;

  // Normalise and validate the shape returned by the model
  return {
    name: String(parsed.name ?? ''),
    email: String(parsed.email ?? ''),
    phone: String(parsed.phone ?? ''),
    skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]) : [],
    experience: Array.isArray(parsed.experience)
      ? (parsed.experience as ParsedResumeData['experience'])
      : [],
    projects: Array.isArray(parsed.projects)
      ? (parsed.projects as ParsedResumeData['projects'])
      : [],
    education: Array.isArray(parsed.education)
      ? (parsed.education as ParsedResumeData['education'])
      : [],
    certifications: Array.isArray(parsed.certifications)
      ? (parsed.certifications as string[])
      : [],
    links: {
      github: String((parsed.links as Record<string, unknown>)?.github ?? '') || undefined,
      linkedin: String((parsed.links as Record<string, unknown>)?.linkedin ?? '') || undefined,
      portfolio: String((parsed.links as Record<string, unknown>)?.portfolio ?? '') || undefined,
      leetcode: String((parsed.links as Record<string, unknown>)?.leetcode ?? '') || undefined
    }
  };
}

/**
 * Build a minimal ParsedResumeData from a filename when all parsing has failed.
 * This lets the upload still complete and stores a placeholder for manual review.
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
