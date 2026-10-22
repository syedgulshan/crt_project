import { ExtractedDocumentContent } from './documentParser.js';
import { ParsedRequirement, RequirementType } from '../types/index.js';

export function extractRequirementsFromDocument(
  content: ExtractedDocumentContent,
  documentType: string,
  filename: string
): ParsedRequirement[] {
  const requirements: ParsedRequirement[] = [];
  const defaultPrefix = determinePrefix(filename, documentType);

  let counter = 1;
  const seenTexts = new Set<string>();

  // Process section by section if sections exist
  if (content.sections && content.sections.length > 0) {
    for (const section of content.sections) {
      const sectionReqs = extractFromSectionText(section.content, section.title, defaultPrefix, counter, content.pages);
      for (const req of sectionReqs) {
        const normalized = req.requirement_text.toLowerCase().trim();
        if (!seenTexts.has(normalized)) {
          seenTexts.add(normalized);
          requirements.push(req);
          counter++;
        }
      }
    }
  } else {
    // Process raw text
    const extracted = extractFromSectionText(content.rawText, 'General', defaultPrefix, counter, content.pages);
    requirements.push(...extracted);
  }

  // If no requirements were extracted with strict heuristics, fall back to sentence-level modal extraction
  if (requirements.length === 0) {
    const fallbackReqs = extractModalSentences(content.rawText, defaultPrefix, content.pages);
    requirements.push(...fallbackReqs);
  }

  return requirements;
}

function determinePrefix(filename: string, documentType: string): string {
  const name = (filename + ' ' + documentType).toUpperCase();
  if (name.includes('SRS')) return 'SRS';
  if (name.includes('BRD')) return 'BRD';
  if (name.includes('FRD')) return 'FRD';
  if (name.includes('PRD')) return 'PRD';
  if (name.includes('NFR')) return 'NFR';
  if (name.includes('SEC')) return 'SEC';
  return 'REQ';
}

function extractFromSectionText(
  text: string,
  sectionTitle: string,
  prefix: string,
  startCounter: number,
  pages?: { pageNumber: number; text: string }[]
): ParsedRequirement[] {
  const results: ParsedRequirement[] = [];
  const lines = text.split(/\r?\n/);
  let currentCounter = startCounter;

  // Patterns for explicit requirement declarations
  // e.g., "RQ-SRS-001: Users must be able to...", "SRS-014: Password recovery...", "[REQ-002] The system shall..."
  const explicitPattern = /^(?:(?:RQ|REQ|SRS|BRD|FRD|PRD)[-_](?:[A-Z0-9]+[-_])?\d+|\[(?:RQ|REQ|SRS|BRD|FRD|PRD)[-_]?\d+\]|(?:Requirement|Req)\s*#?\s*[A-Z0-9.-]+)[:\s]+(.+)$/i;
  const idExtractor = /^((?:RQ|REQ|SRS|BRD|FRD|PRD)[-_](?:[A-Z0-9]+[-_])?\d+|\[[A-Z0-9-_]+\]|(?:Requirement|Req)\s*#?\s*[A-Z0-9.-]+)[:\s]+(.+)$/i;

  // Numbered list item with requirement language: e.g. "1.1 The system shall...", "4. Users must..."
  const numberedPattern = /^(?:(?:\d+\.)+\d*|\d+\)|\([0-9a-z]\)|[-*•])\s+(.+)$/i;

  let currentBlock: {
    ref?: string;
    textParts: string[];
    section: string;
  } | null = null;

  const flushBlock = () => {
    if (currentBlock && currentBlock.textParts.length > 0) {
      const fullText = currentBlock.textParts.join(' ').replace(/\s+/g, ' ').trim();
      if (isValidRequirementText(fullText)) {
        const refCode = currentBlock.ref || `${prefix}-${String(currentCounter).padStart(3, '0')}`;
        const pageNum = findPageNumber(fullText, pages);
        const reqType = classifyRequirementType(fullText, sectionTitle);
        const priority = extractPriority(fullText);

        results.push({
          reference_code: refCode,
          requirement_text: fullText,
          requirement_type: reqType,
          section: currentBlock.section,
          page_number: pageNum,
          priority: priority,
          metadata: {
            extracted_by: 'explicit_or_list_parser',
            rfc2119_keywords: extractRFCKeywords(fullText)
          }
        });
        currentCounter++;
      }
    }
    currentBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) {
      // Empty line might terminate a multi-line block
      continue;
    }

    // Check explicit pattern
    const explicitMatch = line.match(idExtractor);
    if (explicitMatch) {
      flushBlock();
      const rawId = explicitMatch[1].replace(/[[\]]/g, '').trim();
      // Format reference code nicely (e.g. RQ-SRS-001 -> SRS-001 or keep clean)
      const cleanRef = formatRefCode(rawId, prefix);
      currentBlock = {
        ref: cleanRef,
        textParts: [explicitMatch[2].trim()],
        section: sectionTitle
      };
      continue;
    }

    // Check numbered / bulleted pattern
    const listMatch = line.match(numberedPattern);
    if (listMatch) {
      const candidateText = listMatch[1].trim();
      if (containsRequirementModals(candidateText)) {
        flushBlock();
        currentBlock = {
          textParts: [candidateText],
          section: sectionTitle
        };
        continue;
      }
    }

    // Check if line stands alone as a strong requirement statement
    if (containsRequirementModals(line) && line.length > 25 && /^[A-Z]/.test(line)) {
      flushBlock();
      currentBlock = {
        textParts: [line],
        section: sectionTitle
      };
      continue;
    }

    // If we're inside a requirement block and line looks like a continuation
    if (currentBlock && line.length > 0 && !line.startsWith('#')) {
      // Continuation line
      currentBlock.textParts.push(line);
    }
  }

  flushBlock();
  return results;
}

function extractModalSentences(
  text: string,
  prefix: string,
  pages?: { pageNumber: number; text: string }[]
): ParsedRequirement[] {
  const results: ParsedRequirement[] = [];
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let counter = 1;

  for (const sentence of sentences) {
    const trimmed = sentence.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 25 && containsRequirementModals(trimmed) && isValidRequirementText(trimmed)) {
      const refCode = `${prefix}-${String(counter).padStart(3, '0')}`;
      const pageNum = findPageNumber(trimmed, pages);
      results.push({
        reference_code: refCode,
        requirement_text: trimmed,
        requirement_type: classifyRequirementType(trimmed, 'General'),
        section: 'General Requirements',
        page_number: pageNum,
        priority: extractPriority(trimmed),
        metadata: {
          extracted_by: 'modal_sentence_fallback',
          rfc2119_keywords: extractRFCKeywords(trimmed)
        }
      });
      counter++;
    }
  }

  return results;
}

function containsRequirementModals(text: string): boolean {
  const modalRegex = /\b(shall|must|should|required to|needs to|will provide|may|can|is allowed to|prohibited from|shall not|must not|cannot)\b/i;
  return modalRegex.test(text);
}

function isValidRequirementText(text: string): boolean {
  if (text.length < 15 || text.length > 1500) return false;
  // Exclude headings or pure table of contents
  if (/^(table of contents|index|revision history|appendix|author|date|version\s*\d)/i.test(text)) return false;
  return true;
}

function formatRefCode(rawId: string, defaultPrefix: string): string {
  // Normalize e.g. "RQ-SRS-001" -> "SRS-001", "Requirement 1" -> "REQ-001", "SRS-1" -> "SRS-001"
  let cleaned = rawId.replace(/^(?:RQ[-_]|Requirement\s*|Req\s*#?)/i, '').trim();
  const numMatch = cleaned.match(/\d+/);
  const prefixMatch = cleaned.match(/^[A-Z]+/i);

  const finalPrefix = prefixMatch ? prefixMatch[0].toUpperCase() : defaultPrefix;
  const finalNum = numMatch ? String(numMatch[0]).padStart(3, '0') : '001';

  return `${finalPrefix}-${finalNum}`;
}

function classifyRequirementType(text: string, sectionTitle: string): RequirementType {
  const combined = (text + ' ' + sectionTitle).toLowerCase();

  if (combined.includes('encrypt') || combined.includes('security') || combined.includes('auth') || 
      combined.includes('password') || combined.includes('token') || combined.includes('permission') || 
      combined.includes('access control') || combined.includes('vulnerability')) {
    return 'Security';
  }
  if (combined.includes('performance') || combined.includes('latency') || combined.includes('response time') || 
      combined.includes('throughput') || combined.includes('load') || combined.includes('qps') || combined.includes('concurrent')) {
    return 'Performance';
  }
  if (combined.includes('business rule') || combined.includes('compliance') || combined.includes('gdpr') || 
      combined.includes('hipaa') || combined.includes('audit') || combined.includes('retention policy') || combined.includes('legal')) {
    return 'Compliance';
  }
  if (combined.includes('ui') || combined.includes('interface') || combined.includes('dashboard') || 
      combined.includes('screen') || combined.includes('display') || combined.includes('color') || combined.includes('layout')) {
    return 'UI/UX';
  }
  if (combined.includes('availability') || combined.includes('reliability') || combined.includes('backup') || 
      combined.includes('uptime') || combined.includes('scalability')) {
    return 'Non-Functional';
  }
  if (combined.includes('workflow') || combined.includes('policy') || combined.includes('tax') || 
      combined.includes('pricing') || combined.includes('discount') || combined.includes('approval process')) {
    return 'Business Rule';
  }

  return 'Functional';
}

function extractPriority(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(priority:\s*critical|critical priority|must have|p0)\b/i.test(lower)) return 'Critical';
  if (/\b(priority:\s*high|high priority|must|shall|strictly required|mandatory|p1)\b/i.test(lower)) return 'High';
  if (/\b(priority:\s*medium|medium priority|should|recommended|p2)\b/i.test(lower)) return 'Medium';
  if (/\b(priority:\s*low|low priority|may|optional|nice to have|p3)\b/i.test(lower)) return 'Low';
  return 'Medium';
}

function extractRFCKeywords(text: string): string[] {
  const keywords: string[] = [];
  const terms = ['MUST', 'MUST NOT', 'REQUIRED', 'SHALL', 'SHALL NOT', 'SHOULD', 'SHOULD NOT', 'RECOMMENDED', 'MAY', 'OPTIONAL'];
  for (const term of terms) {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    if (regex.test(text)) {
      keywords.push(term);
    }
  }
  return keywords;
}

function findPageNumber(textSnippet: string, pages?: { pageNumber: number; text: string }[]): number | null {
  if (!pages || pages.length === 0) return null;
  const sample = textSnippet.substring(0, 40).toLowerCase();
  for (const p of pages) {
    if (p.text.toLowerCase().includes(sample)) {
      return p.pageNumber;
    }
  }
  return null;
}
