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

export function parseResumeFile(fileName: string) {
  const clean = fileName.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' ');
  const name = clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    name,
    email: `${clean.toLowerCase().replaceAll(' ', '.')}@example.com`,
    phone: '+1 555 0199',
    skills: ['React', 'TypeScript', 'TailwindCSS'],
    experience: [{ title: 'Frontend Engineer', company: 'Uploaded Candidate Inc.', duration: '3 years', description: 'Built responsive React interfaces and reusable UI components.' }],
    projects: [{ name: 'Uploaded Portfolio', description: 'Candidate-provided product dashboard.', technologies: ['React', 'TypeScript'] }],
    education: [{ degree: 'B.S. Computer Science', institution: 'Uploaded University', year: '2021' }],
    certifications: [],
    links: {}
  };
}
