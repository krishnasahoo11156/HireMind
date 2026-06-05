import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel, JobModel, ResumeModel, CandidateModel, ApplicationModel, FeedbackModel, RankingModel } from './models/schemas.js';
import { users, jobs, resumes, candidates, applications, feedback } from './data.js';

dotenv.config();

const idMap = new Map<string, mongoose.Types.ObjectId>();

function getObjectId(legacyId: string): mongoose.Types.ObjectId {
  if (idMap.has(legacyId)) {
    return idMap.get(legacyId)!;
  }
  // Generate a valid, stable 24-character hexadecimal ObjectId
  // MongoDB ObjectIds are 12-byte hex strings. We clean and pad the string.
  const cleanId = legacyId.replace(/[^a-fA-F0-9]/g, '');
  const padded = (cleanId + '000000000000000000000000').slice(0, 24);
  const objectId = new mongoose.Types.ObjectId(padded);
  idMap.set(legacyId, objectId);
  return objectId;
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected.');

  console.log('Clearing existing collections...');
  await Promise.all([
    UserModel.deleteMany({}),
    JobModel.deleteMany({}),
    ResumeModel.deleteMany({}),
    CandidateModel.deleteMany({}),
    ApplicationModel.deleteMany({}),
    FeedbackModel.deleteMany({}),
    RankingModel.deleteMany({})
  ]);
  console.log('Collections cleared.');

  // 1. Seed Users (Hasing passwords)
  console.log('Seeding Users...');
  const seededUsers = [];
  for (const u of users) {
    const hashed = await bcrypt.hash('password', 10);
    const seededUser = await UserModel.create({
      _id: getObjectId(u._id),
      email: u.email,
      password: hashed,
      name: u.name,
      role: u.role,
      avatar: u.avatar || u.name.slice(0, 2).toUpperCase(),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    });
    seededUsers.push(seededUser);
  }

  // Create additional candidate users to ensure we have at least 5 candidates
  const candidateEmails = ['alex.rod@example.com', 'rahul.patel@example.com', 'emma.wilson@example.com', 'jordan.smith@example.com'];
  const candidateNames = ['Alex Rodriguez', 'Rahul Patel', 'Emma Wilson', 'Jordan Smith'];
  const candidateLegacyIds = ['candidate_alex', 'candidate_rahul', 'candidate_emma', 'candidate_jordan'];

  for (let i = 0; i < candidateEmails.length; i++) {
    const hashed = await bcrypt.hash('password', 10);
    const extraUser = await UserModel.create({
      _id: getObjectId(candidateLegacyIds[i]),
      email: candidateEmails[i],
      password: hashed,
      name: candidateNames[i],
      role: 'candidate',
      avatar: candidateNames[i].slice(0, 2).toUpperCase()
    });
    seededUsers.push(extraUser);
  }
  console.log(`Seeded ${seededUsers.length} users.`);

  // 2. Seed Jobs
  console.log('Seeding Jobs...');
  const seededJobs = [];
  
  // We need 5 demo jobs
  const extraJobTitles = [
    'Node.js Backend Engineer',
    'Full Stack Developer',
    'Engineering Coordinator',
    'DevOps Security Specialist'
  ];
  const extraJobDescriptions = [
    'We are looking for a Node.js Backend Engineer with expertise in Express, MongoDB, and Mongoose to design scalable API microservices.',
    'Seeking a Full Stack Developer proficient in React, Node.js, and cloud deployments to build end-to-end recruitment intelligence systems.',
    'Coordinate engineering workflows, ensure task scheduling, and run integration validation scripts across candidate and recruiter portals.',
    'Establish DevOps security pipelines, manage continuous integration flow, configure Vercel redirects, and supervise SSL connection certificates.'
  ];
  const extraJobSkills = [
    ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'REST API'],
    ['React', 'Node.js', 'Vite', 'TypeScript', 'SQL'],
    ['Agile', 'Scrum', 'Project Management', 'Jira', 'Git'],
    ['Docker', 'AWS', 'Vercel', 'SSL', 'GitHub Actions']
  ];
  const extraJobDepartments = ['Backend', 'Engineering', 'Operations', 'DevOps'];
  const extraJobSalaries = ['$120,000 - $140,000', '$110,000 - $130,000', '$90,000 - $110,000', '$130,000 - $150,000'];
  const extraJobLocations = ['Remote (US)', 'Hybrid (NY)', 'Remote (Europe)', 'Remote (Asia)'];

  // Seed first job from data.ts
  for (const j of jobs) {
    const seededJob = await JobModel.create({
      _id: getObjectId(j._id),
      title: j.title,
      description: j.description,
      rawText: j.rawText,
      status: j.status,
      createdBy: getObjectId(j.createdBy),
      department: j.department || 'Engineering',
      location: 'Remote (US)',
      salary: '$100,000 - $120,000',
      company: 'HireMind Inc',
      extractedData: j.extractedData,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt
    });
    seededJobs.push(seededJob);
  }

  // Seed 4 more jobs to make 5 total
  const defaultRecruiter = seededUsers.find((u) => u.role === 'recruiter')!;
  for (let i = 0; i < extraJobTitles.length; i++) {
    const job = await JobModel.create({
      _id: getObjectId(`job_extra_${i}`),
      title: extraJobTitles[i],
      description: extraJobDescriptions[i],
      rawText: extraJobDescriptions[i],
      status: 'active',
      createdBy: defaultRecruiter._id,
      department: extraJobDepartments[i],
      location: extraJobLocations[i],
      salary: extraJobSalaries[i],
      company: 'HireMind Inc',
      extractedData: {
        skills: extraJobSkills[i],
        experience: '3+ Years',
        education: 'B.S. in Computer Science or equivalent',
        certifications: [],
        keywords: extraJobSkills[i]
      }
    });
    seededJobs.push(job);
  }
  console.log(`Seeded ${seededJobs.length} jobs.`);

  // 3. Seed Resumes
  console.log('Seeding Resumes...');
  const seededResumes = [];
  for (const r of resumes) {
    const seededResume = await ResumeModel.create({
      _id: getObjectId(r._id),
      fileName: r.fileName,
      fileUrl: r.fileUrl,
      fileType: r.fileType,
      parsedData: r.parsedData,
      parseStatus: r.parseStatus || 'parsed',
      uploadedAt: r.uploadedAt
    });
    seededResumes.push(seededResume);
  }
  console.log(`Seeded ${seededResumes.length} resumes.`);

  // 4. Seed Candidates (AI matching evaluations)
  console.log('Seeding Candidates...');
  const seededCandidates = [];
  for (const c of candidates) {
    const seededCandidate = await CandidateModel.create({
      _id: getObjectId(c._id),
      resumeId: getObjectId(c.resumeId),
      jobId: getObjectId(c.jobId),
      name: c.name,
      email: c.email,
      blindId: c.blindId,
      isBlindMode: c.isBlindMode || false,
      aiScore: c.aiScore,
      matchPercentage: c.matchPercentage,
      recommendation: c.recommendation,
      githubAnalysis: c.githubAnalysis,
      leetcodeAnalysis: c.leetcodeAnalysis,
      skillGap: c.skillGap,
      explanation: c.explanation,
      recruiterDecision: c.recruiterDecision || 'pending',
      recruiterReason: c.recruiterReason || '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    });
    seededCandidates.push(seededCandidate);
  }
  console.log(`Seeded ${seededCandidates.length} candidate evaluations.`);

  // 5. Seed Applications (10 applications across different stages)
  console.log('Seeding Applications...');
  const seededApplications = [];
  
  // Seed initial applications from data.ts
  for (const app of applications) {
    const seededApp = await ApplicationModel.create({
      _id: getObjectId(app._id),
      candidateId: getObjectId(app.candidateId),
      jobId: getObjectId(app.jobId),
      status: app.status || 'Applied',
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      aiScore: app.aiScore,
      recommendation: app.recommendation,
      resumeUrl: app.resumeUrl,
      githubUrl: app.githubUrl,
      linkedinUrl: app.linkedinUrl,
      portfolioUrl: app.portfolioUrl,
      leetcodeUsername: app.leetcodeUsername
    });
    seededApplications.push(seededApp);
  }

  // Create additional applications to reach 10 demo applications
  // Candidates: Sarah (user_candidate_demo), Alex (candidate_alex), Rahul (candidate_rahul), Emma (candidate_emma), Jordan (candidate_jordan)
  // Jobs: Frontend (job_frontend), Backend (job_extra_0), Fullstack (job_extra_1), Coordinator (job_extra_2), DevOps (job_extra_3)
  const candidateIds = ['candidate_alex', 'candidate_rahul', 'candidate_emma', 'candidate_jordan'];
  const jobIds = ['job_extra_0', 'job_extra_1', 'job_extra_2', 'job_extra_3'];
  const appStatuses: any[] = ['Shortlisted', 'Interview', 'AI Analysis', 'Applied', 'Under Review', 'Selected', 'Rejected'];

  for (let i = 0; i < 6; i++) {
    const candId = candidateIds[i % candidateIds.length];
    const jId = jobIds[i % jobIds.length];
    const status = appStatuses[i % appStatuses.length];

    const extraApp = await ApplicationModel.create({
      _id: getObjectId(`app_extra_${i}`),
      candidateId: getObjectId(candId),
      jobId: getObjectId(jId),
      status,
      appliedAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      aiScore: 60 + (i * 5) % 35,
      recommendation: i % 2 === 0 ? 'Hire' : 'Maybe',
      resumeUrl: '/uploads/demo_resume.pdf',
      githubUrl: `https://github.com/${candId.replace('candidate_', '')}dev`,
      leetcodeUsername: `${candId.replace('candidate_', '')}lc`
    });
    seededApplications.push(extraApp);
  }

  // Update applications count for all jobs based on seeded applications
  for (const job of seededJobs) {
    const count = await ApplicationModel.countDocuments({ jobId: job._id });
    job.applicationsCount = count;
    await job.save();
  }

  console.log(`Seeded ${seededApplications.length} applications.`);

  // 6. Seed Feedback
  console.log('Seeding Feedback...');
  let feedbackCount = 0;
  for (const fb of feedback) {
    await FeedbackModel.create({
      _id: getObjectId(fb._id),
      candidateId: getObjectId(fb.candidateId),
      jobId: getObjectId(fb.jobId),
      recruiterId: getObjectId(fb.recruiterId),
      aiDecision: fb.aiDecision,
      recruiterDecision: fb.recruiterDecision,
      reason: fb.reason,
      createdAt: fb.createdAt
    });
    feedbackCount++;
  }
  console.log(`Seeded ${feedbackCount} recruiter feedback records.`);

  console.log('Database seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
