import fs from 'fs/promises';
import path from 'path';
// pdf-parse and mammoth ship CJS — use createRequire for ESM compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mammoth: { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> } = require('mammoth');

/**
 * Extract plain text from a PDF buffer.
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

/**
 * Extract plain text from a DOCX buffer.
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * Determine file type from mimetype or extension and return extracted text.
 * Reads the file from the path multer wrote to disk.
 */
export async function extractText(file: Express.Multer.File): Promise<string> {
  let buffer: Buffer;
  if (file.buffer) {
    buffer = file.buffer;
  } else {
    const cwd = process.cwd();
    const uploadsDir = cwd.endsWith('server') ? 'uploads' : 'server/uploads';
    const filePath = file.path ?? path.join(uploadsDir, file.filename ?? file.originalname);
    buffer = await fs.readFile(filePath);
  }

  const isPDF =
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf');

  const isDOCX =
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.originalname.toLowerCase().endsWith('.docx');

  if (isPDF) return parsePDF(buffer);
  if (isDOCX) return parseDOCX(buffer);

  throw new Error(`Unsupported file type: ${file.mimetype ?? file.originalname}`);
}
