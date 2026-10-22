import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

export interface ExtractedDocumentContent {
  rawText: string;
  pages?: { pageNumber: number; text: string }[];
  sections?: { title: string; content: string }[];
}

export async function parseDocument(filePath: string, originalFilename: string): Promise<ExtractedDocumentContent> {
  const ext = path.extname(originalFilename).toLowerCase();

  try {
    if (ext === '.txt' || ext === '.md' || ext === '.text') {
      const text = fs.readFileSync(filePath, 'utf-8');
      return parseTextDocument(text);
    } else if (ext === '.docx' || ext === '.doc') {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return parseTextDocument(result.value);
    } else if (ext === '.pdf') {
      return await parsePdfDocument(filePath);
    } else {
      // Fallback: try reading as text
      const text = fs.readFileSync(filePath, 'utf-8');
      return parseTextDocument(text);
    }
  } catch (error: any) {
    console.error(`Error parsing document ${originalFilename}:`, error);
    throw new Error(`Failed to extract text from document (${originalFilename}): ${error.message}`);
  }
}

function parseTextDocument(text: string): ExtractedDocumentContent {
  const lines = text.split(/\r?\n/);
  const sections: { title: string; content: string }[] = [];
  let currentSectionTitle = 'General Requirements';
  let currentSectionLines: string[] = [];

  const sectionRegex = /^(?:#+\s*|(?:Section|\d+(\.\d+)*)\s*[:.-]?\s*)(.+)$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentSectionLines.push('');
      continue;
    }

    // Check if line looks like a major heading or section
    if (
      (trimmed.startsWith('#') || 
       /^(Section\s+\d+(\.\d+)*|Chapter\s+\d+|\d+(\.\d+)+\s+[A-Z])/i.test(trimmed)) &&
      trimmed.length < 100
    ) {
      if (currentSectionLines.length > 0) {
        sections.push({
          title: currentSectionTitle,
          content: currentSectionLines.join('\n')
        });
        currentSectionLines = [];
      }
      currentSectionTitle = trimmed.replace(/^#+\s*/, '');
    } else {
      currentSectionLines.push(line);
    }
  }

  if (currentSectionLines.length > 0) {
    sections.push({
      title: currentSectionTitle,
      content: currentSectionLines.join('\n')
    });
  }

  return {
    rawText: text,
    sections: sections.length > 0 ? sections : [{ title: 'Main Document', content: text }]
  };
}

async function parsePdfDocument(filePath: string): Promise<ExtractedDocumentContent> {
  try {
    // Dynamic import to handle pdf-parse in ESM
    const pdfParseModule: any = await import('pdf-parse');
    const pdfParse = (pdfParseModule.default || pdfParseModule) as any;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const pages: { pageNumber: number; text: string }[] = [];
    if (pdfData.numpages && pdfData.text) {
      // Split roughly by page markers if available, or single block
      const pageChunks = pdfData.text.split(/(?:--\s*\d+\s*--|\f)/);
      if (pageChunks.length > 1) {
        pageChunks.forEach((chunk: string, idx: number) => {
          if (chunk.trim()) {
            pages.push({ pageNumber: idx + 1, text: chunk });
          }
        });
      } else {
        pages.push({ pageNumber: 1, text: pdfData.text });
      }
    }

    const structured = parseTextDocument(pdfData.text);
    return {
      rawText: pdfData.text,
      pages,
      sections: structured.sections
    };
  } catch (err: any) {
    console.warn(`PDF-parse encountered an issue, falling back to raw buffer text recovery:`, err.message);
    const rawBuffer = fs.readFileSync(filePath);
    // Extract ascii text strings from pdf streams
    const extracted = rawBuffer.toString('latin1').replace(/[^\x20-\x7E\r\n]/g, ' ');
    return parseTextDocument(extracted);
  }
}
