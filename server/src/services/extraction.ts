export function extractJobData(text: string) {
  const knownSkills = ['React', 'TypeScript', 'Redux', 'Next.js', 'TailwindCSS', 'Node.js', 'GraphQL', 'Accessibility'];
  const skills = knownSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));
  return {
    skills: skills.length ? skills : ['React', 'TypeScript', 'Redux', 'Next.js', 'TailwindCSS'],
    experience: text.match(/(\d[\d-]*\s*(?:years|yrs))/i)?.[1] ?? '3-5 Years',
    education: 'Computer Science or equivalent practical experience',
    certifications: text.toLowerCase().includes('accessibility') ? ['Accessibility certification preferred'] : [],
    keywords: ['React ecosystem', 'component architecture', 'state management', 'responsive UI', 'accessibility']
  };
}

