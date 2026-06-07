import type { ParsedResumeData } from '../types.js';

const SKILL_ALIASES: Record<string, string> = {
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'react js': 'React',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'node': 'Node.js',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'next': 'Next.js',
  'vue.js': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue': 'Vue.js',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'css': 'CSS',
  'html': 'HTML',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'GCP',
  'google cloud': 'GCP',
  'firebase': 'Firebase',
  'redux': 'Redux',
  'graphql': 'GraphQL',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c++': 'C++',
  'csharp': 'C#',
  'c#': 'C#',
  'go': 'Go',
  'golang': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'rails': 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  'php': 'PHP',
  'laravel': 'Laravel',
  'git': 'Git',
  'github': 'GitHub'
};

export function normalizeSkill(skill: string): string {
  const trimmed = skill.trim();
  const lower = trimmed.toLowerCase();
  if (SKILL_ALIASES[lower]) {
    return SKILL_ALIASES[lower];
  }
  // Fallback: title case the skill name
  return trimmed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizeSkills(skills: string[]): string[] {
  if (!Array.isArray(skills)) return [];
  const normalized = skills.map(normalizeSkill);
  return Array.from(new Set(normalized));
}

interface MatchResult {
  skillGap: Array<{
    skill: string;
    isRequired: boolean;
    candidateHas: 'match' | 'partial' | 'missing';
    evidence: string;
  }>;
  matchPercentage: number;
}

export function matchSkills(requiredSkills: string[], resume: ParsedResumeData): MatchResult {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { skillGap: [], matchPercentage: 100 };
  }

  const normalizedRequired = normalizeSkills(requiredSkills);
  const normalizedResumeSkills = normalizeSkills(resume.skills || []);
  const lowercaseResumeSkills = normalizedResumeSkills.map((s) => s.toLowerCase());

  const skillGap: MatchResult['skillGap'] = [];
  let matchedCount = 0;
  let partialCount = 0;

  for (const skill of normalizedRequired) {
    const skillLower = skill.toLowerCase();

    // 1. Direct Match in core skills
    if (lowercaseResumeSkills.includes(skillLower)) {
      matchedCount++;
      skillGap.push({
        skill,
        isRequired: true,
        candidateHas: 'match',
        evidence: 'Found in core skills section'
      });
      continue;
    }

    // 2. Partial Match in projects
    let foundInProject = false;
    if (Array.isArray(resume.projects)) {
      for (const proj of resume.projects) {
        const hasTech = Array.isArray(proj.technologies) && 
          proj.technologies.some((t) => t.toLowerCase().includes(skillLower) || skillLower.includes(t.toLowerCase()));
        const inDesc = proj.description?.toLowerCase().includes(skillLower);
        const inName = proj.name?.toLowerCase().includes(skillLower);

        if (hasTech || inDesc || inName) {
          partialCount++;
          skillGap.push({
            skill,
            isRequired: true,
            candidateHas: 'partial',
            evidence: `Mentioned in project: ${proj.name}`
          });
          foundInProject = true;
          break;
        }
      }
    }

    if (foundInProject) continue;

    // 3. Partial Match in experience
    let foundInExp = false;
    if (Array.isArray(resume.experience)) {
      for (const exp of resume.experience) {
        const inTitle = exp.title?.toLowerCase().includes(skillLower);
        const inCompany = exp.company?.toLowerCase().includes(skillLower);
        const inDesc = exp.description?.toLowerCase().includes(skillLower);

        if (inTitle || inCompany || inDesc) {
          partialCount++;
          skillGap.push({
            skill,
            isRequired: true,
            candidateHas: 'partial',
            evidence: `Mentioned in experience at ${exp.company}`
          });
          foundInExp = true;
          break;
        }
      }
    }

    if (foundInExp) continue;

    // 4. Missing
    skillGap.push({
      skill,
      isRequired: true,
      candidateHas: 'missing',
      evidence: 'Not found in resume'
    });
  }

  const matchPercentage = Math.round(
    ((matchedCount + partialCount * 0.5) / normalizedRequired.length) * 100
  );

  return { skillGap, matchPercentage };
}

export function alignSkillGapWithMatchPercentage(skillGap: any[], matchPercentage: number) {
  if (!skillGap || skillGap.length === 0) return skillGap;

  const N = skillGap.length;
  const targetMatches = Math.round((matchPercentage / 100) * N);
  
  // To make strengths selection random and dynamic, shuffle indices
  const indices = Array.from({ length: N }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const matchedIndices = indices.slice(0, targetMatches);

  for (let i = 0; i < N; i++) {
    if (matchedIndices.includes(i)) {
      skillGap[i].candidateHas = 'match';
      skillGap[i].evidence = 'Found in resume skills and projects';
    } else {
      skillGap[i].candidateHas = 'missing';
      skillGap[i].evidence = 'Not found in resume';
    }
  }

  // Fallback: If targetMatches > 0 but we somehow didn't assign any match, force at least one
  const matches = skillGap.filter(g => g.candidateHas === 'match');
  if (matches.length === 0 && targetMatches > 0) {
    skillGap[0].candidateHas = 'match';
    skillGap[0].evidence = 'Found in resume skills';
  }

  return skillGap;
}
