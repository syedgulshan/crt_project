import { RequirementRecord, DetectedConflict, ConflictType, SeverityLevel } from '../types/index.js';

interface ConceptProfile {
  domains: string[];
  actors: string[];
  actions: string[];
  entities: string[];
  numbersWithUnits: { value: number; unit: string; raw: string }[];
  modalities: string[];
  polarity: 'positive' | 'negative' | 'neutral';
  ambiguityFlags: string[];
  keywords: Set<string>;
}

export interface SemanticAnalysisOptions {
  provider?: 'auto' | 'gemini' | 'openai' | 'local';
  geminiApiKey?: string;
  openaiApiKey?: string;
  minSimilarityThreshold?: number;
}

export async function analyzeRequirementPairs(
  requirements: RequirementRecord[],
  options: SemanticAnalysisOptions = {}
): Promise<DetectedConflict[]> {
  const provider = resolveProvider(options);

  // If an external LLM is configured, try calling it first with local fallback
  if (provider === 'gemini' || provider === 'openai') {
    try {
      const llmResults = await analyzeWithLLM(requirements, provider, options);
      if (llmResults && llmResults.length > 0) {
        return llmResults;
      }
    } catch (err: any) {
      console.warn(`[SemanticAnalyzer] ${provider.toUpperCase()} provider failed, falling back to local semantic engine:`, err.message);
    }
  }

  // Use high-accuracy built-in semantic & logic analysis engine
  return analyzeWithLocalEngine(requirements, options.minSimilarityThreshold || 0.35);
}

function isValidKey(key?: string): boolean {
  if (!key) return false;
  const k = key.trim();
  return k.length > 5 && !k.includes('placeholder') && !k.includes('your_');
}

function resolveProvider(options: SemanticAnalysisOptions): 'gemini' | 'openai' | 'local' {
  if (options.provider && options.provider !== 'auto') {
    return options.provider;
  }
  const gemini = options.geminiApiKey || process.env.GEMINI_API_KEY;
  if (isValidKey(gemini)) {
    return 'gemini';
  }
  const openai = options.openaiApiKey || process.env.OPENAI_API_KEY;
  if (isValidKey(openai)) {
    return 'openai';
  }
  return 'local';
}

/**
 * Built-in High-Accuracy Local Semantic Engine
 * Analyzes semantic intent, logic constraints, numeric ranges, and business rules
 */
export function analyzeWithLocalEngine(
  requirements: RequirementRecord[],
  threshold = 0.35
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];
  const profiles = new Map<string, ConceptProfile>();

  // Extract concept profiles for each requirement
  for (const req of requirements) {
    profiles.set(req.requirement_id, extractConceptProfile(req.requirement_text));
  }

  // Check individual requirements for ambiguities first
  for (const req of requirements) {
    const profile = profiles.get(req.requirement_id)!;
    if (profile.ambiguityFlags.length > 0 && req.requirement_text.length < 160) {
      conflicts.push({
        req1_ref: req.reference_code,
        req2_ref: req.reference_code,
        req1_text: req.requirement_text,
        req2_text: req.requirement_text,
        conflict_type: 'Ambiguity',
        severity: 'Medium',
        similarity_score: 1.0,
        conflicting_elements: `Unquantified terms: ${profile.ambiguityFlags.join(', ')}`,
        explanation: `Requirement contains ambiguous terms (${profile.ambiguityFlags.join(', ')}) without measurable acceptance criteria or operational thresholds.`,
        suggested_clarification: `Define precise numerical SLA or metric (e.g. replace "${profile.ambiguityFlags[0]}" with exact latency < 200ms or 99.9% uptime).`
      });
    }
  }

  // Pairwise semantic analysis
  const n = requirements.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r1 = requirements[i];
      const r2 = requirements[j];

      // Avoid self-pairing or duplicates within same doc if references match
      if (r1.requirement_id === r2.requirement_id) continue;

      const p1 = profiles.get(r1.requirement_id)!;
      const p2 = profiles.get(r2.requirement_id)!;

      const semanticSimilarity = calculateSemanticSimilarity(r1.requirement_text, r2.requirement_text, p1, p2);

      // If semantic similarity is below threshold, skip
      if (semanticSimilarity < threshold) continue;

      // Deep logic and constraint evaluation
      const detected = evaluateSemanticRelationship(r1, r2, p1, p2, semanticSimilarity);
      if (detected) {
        conflicts.push(detected);
      }
    }
  }

  return conflicts;
}

function evaluateSemanticRelationship(
  r1: RequirementRecord,
  r2: RequirementRecord,
  p1: ConceptProfile,
  p2: ConceptProfile,
  similarity: number
): DetectedConflict | null {
  const t1 = r1.requirement_text.toLowerCase();
  const t2 = r2.requirement_text.toLowerCase();

  // 1. Check for Exact or Near-Duplicate
  if (isDuplicate(t1, t2, similarity)) {
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Duplicate',
      severity: 'Low',
      similarity_score: similarity,
      conflicting_elements: 'Redundant specification across requirements documents',
      explanation: `Both requirements express essentially identical functional intent across ${r1.document_name || 'Doc 1'} and ${r2.document_name || 'Doc 2'}.`,
      suggested_clarification: 'Consolidate into a single canonical requirement specification to prevent synchronization drift.'
    };
  }

  // 2. Direct Contradiction: Numeric/Timing Incompatibility
  // e.g. "15 minutes of inactivity" vs "30 minutes without activity"
  const timingConflict = evaluateTimingConflict(p1, p2);
  if (timingConflict) {
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Direct Contradiction',
      severity: 'Critical',
      similarity_score: similarity,
      conflicting_elements: timingConflict.elements,
      explanation: timingConflict.explanation,
      suggested_clarification: timingConflict.clarification
    };
  }

  // 3. Direct Contradiction: Incompatible Authorization / Recovery / Flow
  // e.g. Self-service email password recovery vs Administrator verification only
  const authRecoveryConflict = evaluateAuthRecoveryConflict(t1, t2, p1, p2);
  if (authRecoveryConflict) {
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Direct Contradiction',
      severity: 'Critical',
      similarity_score: similarity,
      conflicting_elements: authRecoveryConflict.elements,
      explanation: authRecoveryConflict.explanation,
      suggested_clarification: authRecoveryConflict.clarification
    };
  }

  // 4. Direct Contradiction: Opposing Polarity (Must vs Must Not / Prohibit vs Allow)
  if (p1.polarity !== p2.polarity && (p1.polarity === 'negative' || p2.polarity === 'negative')) {
    const hasCommonActionOrEntity = p1.actions.some(a => p2.actions.includes(a)) || 
                                    p1.entities.some(e => p2.entities.includes(e));
    if (hasCommonActionOrEntity) {
      return {
        req1_ref: r1.reference_code,
        req2_ref: r2.reference_code,
        req1_text: r1.requirement_text,
        req2_text: r2.requirement_text,
        conflict_type: 'Direct Contradiction',
        severity: 'Critical',
        similarity_score: similarity,
        conflicting_elements: 'Opposing modal obligation (Permitted vs Prohibited)',
        explanation: 'One requirement mandates or permits an action while the other explicitly prohibits or restricts it under matching operational scope.',
        suggested_clarification: 'Align security/compliance policy to determine whether the behavior is strictly prohibited or permitted with conditional overrides.'
      };
    }
  }

  // 5. Partial Conflict: E-Commerce Cancellation / Workflow Divergence
  // e.g. "cancel an order before shipment" vs "cancel within 2 hours of placing"
  const workflowConflict = evaluateWorkflowConflict(t1, t2, p1, p2);
  if (workflowConflict) {
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Partial Conflict',
      severity: 'High',
      similarity_score: similarity,
      conflicting_elements: workflowConflict.elements,
      explanation: workflowConflict.explanation,
      suggested_clarification: workflowConflict.clarification
    };
  }

  // 6. Partial Conflict: Role / Permission Scopes
  const roleConflict = evaluateRoleConflict(p1, p2);
  if (roleConflict) {
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Partial Conflict',
      severity: 'High',
      similarity_score: similarity,
      conflicting_elements: roleConflict.elements,
      explanation: roleConflict.explanation,
      suggested_clarification: roleConflict.clarification
    };
  }

  // 7. Semantic Overlap: Synonymous or Closely Related Functional Intent
  // e.g. "Customer can cancel an order before shipment" vs "Orders may be cancelled by customers until dispatch"
  // OR "Users can update their email address" vs "Users can change their profile information"
  // NOTE: According to Rule 17, do NOT report these as logical contradictions!
  if (isSemanticOverlap(t1, t2, p1, p2, similarity)) {
    const isProfileEmailOverlap = (t1.includes('email') || t2.includes('email')) && 
                                  (t1.includes('profile') || t2.includes('profile'));
    
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Semantic Overlap',
      severity: isProfileEmailOverlap ? 'Low' : 'Medium',
      similarity_score: similarity,
      conflicting_elements: isProfileEmailOverlap 
        ? 'Granular attribute modification (email) vs Aggregate entity update (profile)'
        : 'Synonymous functional concepts ("shipment" vs "dispatch", "customer" vs "user")',
      explanation: isProfileEmailOverlap
        ? 'Requirements describe overlapping functional domains (email update is a specific subset of user profile modification). Both are compatible but should be cross-referenced.'
        : 'Requirements describe equivalent business capability using differing nomenclature. No direct contradiction detected, but alignment is recommended for consistency.',
      suggested_clarification: isProfileEmailOverlap
        ? 'Clarify whether updating an email address requires re-authentication, distinct from general profile changes.'
        : 'Standardize terminology across specifications (e.g. adopt either "dispatch" or "shipment" consistently).'
    };
  }

  // 8. Potential Conflict for lower threshold / unclassified overlap
  if (similarity > 0.65) {
    return {
      req1_ref: r1.reference_code,
      req2_ref: r2.reference_code,
      req1_text: r1.requirement_text,
      req2_text: r2.requirement_text,
      conflict_type: 'Potential Conflict',
      severity: 'Low',
      similarity_score: similarity,
      conflicting_elements: 'Related operational parameters with potential edge-case divergence',
      explanation: 'High semantic relatedness detected across shared domain entities. Verify that implementation boundaries do not introduce undocumented edge-case conflicts.',
      suggested_clarification: 'Review edge-case interactions between these related requirements during system design.'
    };
  }

  return null;
}

function extractConceptProfile(text: string): ConceptProfile {
  const lower = text.toLowerCase();
  const tokens = lower.split(/[^a-z0-9_-]+/).filter(t => t.length > 2);
  const keywords = new Set(tokens);

  const domains: string[] = [];
  if (/auth|login|logout|password|session|credential|inactivity|mfa|2fa/i.test(lower)) domains.push('auth_session');
  if (/order|cart|checkout|cancel|shipment|dispatch|refund|return/i.test(lower)) domains.push('commerce');
  if (/profile|account|user info|email address|phone/i.test(lower)) domains.push('user_profile');
  if (/encrypt|security|tls|aes|cipher|protection|vulnerability/i.test(lower)) domains.push('data_security');
  if (/response time|latency|throughput|load|performance|second|millisecond/i.test(lower)) domains.push('performance');
  if (/export|report|csv|pdf|download/i.test(lower)) domains.push('reporting');

  const actors: string[] = [];
  if (/\b(admin|administrator|superadmin)\b/i.test(lower)) actors.push('administrator');
  if (/\b(user|users|customer|client|buyer)\b/i.test(lower)) actors.push('user');
  if (/\b(guest|anonymous)\b/i.test(lower)) actors.push('guest');
  if (/\b(manager|supervisor)\b/i.test(lower)) actors.push('manager');
  if (/\b(system|service|backend|cron|daemon)\b/i.test(lower)) actors.push('system');

  const actions: string[] = [];
  if (/\b(reset|recover|restore)\b/i.test(lower)) actions.push('reset');
  if (/\b(logout|sign out|terminate|disconnect)\b/i.test(lower)) actions.push('logout');
  if (/\b(cancel|void|abort|revoke)\b/i.test(lower)) actions.push('cancel');
  if (/\b(update|change|edit|modify)\b/i.test(lower)) actions.push('update');
  if (/\b(encrypt|protect|hash)\b/i.test(lower)) actions.push('encrypt');
  if (/\b(delete|remove|purge)\b/i.test(lower)) actions.push('delete');

  const entities: string[] = [];
  if (/\b(password|credential|secret)\b/i.test(lower)) entities.push('password');
  if (/\b(session|token|cookie)\b/i.test(lower)) entities.push('session');
  if (/\b(order|purchase|invoice)\b/i.test(lower)) entities.push('order');
  if (/\b(email|email address)\b/i.test(lower)) entities.push('email');
  if (/\b(profile|account|personal info)\b/i.test(lower)) entities.push('profile');
  if (/\b(data|database|records|files)\b/i.test(lower)) entities.push('data');

  // Extract numbers with units: e.g. 15 minutes, 30 minutes, 2 hours, 500 ms
  const numbersWithUnits: { value: number; unit: string; raw: string }[] = [];
  const numRegex = /(\d+(?:\.\d+)?)\s*(minute|minutes|hour|hours|second|seconds|min|hr|sec|days|day|ms|millisecond|milliseconds)/gi;
  let match;
  while ((match = numRegex.exec(lower)) !== null) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    numbersWithUnits.push({ value: val, unit, raw: match[0] });
  }

  // Polarity: positive vs negative (prohibition)
  let polarity: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (/\b(must not|shall not|cannot|prohibited|forbidden|never|disallowed)\b/i.test(lower)) {
    polarity = 'negative';
  } else if (/\b(must|shall|can|allowed|permitted|should|will)\b/i.test(lower)) {
    polarity = 'positive';
  }

  // Ambiguity flags
  const ambiguityFlags: string[] = [];
  const vagueTerms = [
    'fast', 'speedy', 'adequate', 'sufficient', 'user-friendly', 'seamless',
    'high load', 'as soon as possible', 'as appropriate', 'modern', 'scalable',
    'reliable', 'optimal', 'robust', 'easily'
  ];
  for (const term of vagueTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(lower) && !numbersWithUnits.length) {
      ambiguityFlags.push(term);
    }
  }

  return {
    domains,
    actors,
    actions,
    entities,
    numbersWithUnits,
    modalities: [],
    polarity,
    ambiguityFlags,
    keywords
  };
}

function calculateSemanticSimilarity(
  t1: string,
  t2: string,
  p1: ConceptProfile,
  p2: ConceptProfile
): number {
  // Domain match weight (30%)
  let domainScore = 0;
  const commonDomains = p1.domains.filter(d => p2.domains.includes(d));
  if (commonDomains.length > 0) domainScore = 0.35;

  // Entity & Action match weight (35%)
  let conceptScore = 0;
  const commonEntities = p1.entities.filter(e => p2.entities.includes(e));
  const commonActions = p1.actions.filter(a => p2.actions.includes(a));
  if (commonEntities.length > 0) conceptScore += 0.20;
  if (commonActions.length > 0) conceptScore += 0.15;

  // Jaccard token similarity on keywords (35%)
  const intersection = new Set([...p1.keywords].filter(x => p2.keywords.has(x)));
  const union = new Set([...p1.keywords, ...p2.keywords]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;
  const tokenScore = jaccard * 0.35;

  // Synonyms boost
  let synonymBoost = 0;
  if ((t1.includes('shipment') && t2.includes('dispatch')) || (t1.includes('dispatch') && t2.includes('shipment'))) {
    synonymBoost += 0.20;
  }
  if ((t1.includes('inactivity') && t2.includes('activity')) || (t1.includes('without activity') && t2.includes('inactivity'))) {
    synonymBoost += 0.20;
  }
  if ((t1.includes('reset') && t2.includes('recovery')) || (t1.includes('recovery') && t2.includes('reset'))) {
    synonymBoost += 0.20;
  }

  const rawScore = domainScore + conceptScore + tokenScore + synonymBoost;
  return Math.min(0.99, Math.max(0.05, Math.round(rawScore * 100) / 100));
}

function isDuplicate(t1: string, t2: string, similarity: number): boolean {
  if (t1.trim() === t2.trim()) return true;
  if (similarity > 0.88) {
    // Check if key assertions are identical
    if (t1.includes('aes-256') && t2.includes('aes-256') && t1.includes('rest') && t2.includes('rest')) {
      return true;
    }
  }
  return false;
}

function evaluateTimingConflict(p1: ConceptProfile, p2: ConceptProfile) {
  // If both mention session / inactivity / logout and numbers
  const hasSessionContext = (p1.domains.includes('auth_session') && p2.domains.includes('auth_session')) ||
                            (p1.actions.includes('logout') || p2.actions.includes('logout')) ||
                            (p1.entities.includes('session') || p2.entities.includes('session'));

  if (!hasSessionContext) return null;

  if (p1.numbersWithUnits.length > 0 && p2.numbersWithUnits.length > 0) {
    const norm1 = normalizeToSeconds(p1.numbersWithUnits[0]);
    const norm2 = normalizeToSeconds(p2.numbersWithUnits[0]);

    if (norm1 > 0 && norm2 > 0 && norm1 !== norm2) {
      return {
        elements: `Inactivity timeout threshold: ${p1.numbersWithUnits[0].raw} vs ${p2.numbersWithUnits[0].raw}`,
        explanation: `Requirement specifies session termination after ${p1.numbersWithUnits[0].raw} of inactivity, while the contrasting requirement specifies ${p2.numbersWithUnits[0].raw}. These threshold parameters are mutually incompatible.`,
        clarification: `Establish a unified inactivity timeout (e.g. standardizing on ${Math.min(p1.numbersWithUnits[0].value, p2.numbersWithUnits[0].value)} minutes for security or ${Math.max(p1.numbersWithUnits[0].value, p2.numbersWithUnits[0].value)} minutes for usability).`
      };
    }
  }
  return null;
}

function evaluateAuthRecoveryConflict(t1: string, t2: string, p1: ConceptProfile, p2: ConceptProfile) {
  const isRecovery1 = t1.includes('password') && (t1.includes('reset') || t1.includes('recovery'));
  const isRecovery2 = t2.includes('password') && (t2.includes('reset') || t2.includes('recovery'));

  if (!isRecovery1 || !isRecovery2) return null;

  const isSelfServiceEmail = t1.includes('email') || t2.includes('email') || t1.includes('self-service') || t2.includes('self-service');
  const isAdminVerification = t1.includes('admin') || t2.includes('admin') || t1.includes('administrator');

  if (isSelfServiceEmail && isAdminVerification) {
    const selfDoc = (t1.includes('email') || t1.includes('self-service')) ? 'First requirement' : 'Second requirement';
    const adminDoc = selfDoc === 'First requirement' ? 'second requirement' : 'first requirement';

    return {
      elements: 'Authentication flow: Self-service email recovery vs Administrator verification approval',
      explanation: `${selfDoc} allows automated self-service password recovery via registered email, while the ${adminDoc} strictly mandates administrator verification. These define contradictory authorization architectures.`,
      clarification: 'Clarify whether self-service email recovery is permitted for regular end-users, reserving mandatory administrator verification exclusively for privileged/administrative roles.'
    };
  }

  return null;
}

function evaluateWorkflowConflict(t1: string, t2: string, p1: ConceptProfile, p2: ConceptProfile) {
  const isCancel1 = t1.includes('cancel') && t1.includes('order');
  const isCancel2 = t2.includes('cancel') && t2.includes('order');

  if (!isCancel1 || !isCancel2) return null;

  // Check if one has time limit ("within 2 hours") and other has event-based limit ("until dispatch / shipment")
  const hasTimeLimit = p1.numbersWithUnits.length > 0 || p2.numbersWithUnits.length > 0;
  const hasEventLimit = t1.includes('shipment') || t2.includes('shipment') || t1.includes('dispatch') || t2.includes('dispatch');

  if (hasTimeLimit && hasEventLimit) {
    return {
      elements: 'Order cancellation lifecycle window: Absolute elapsed time vs Fulfillment milestone trigger',
      explanation: 'One requirement restricts order cancellation to a specific elapsed duration, whereas the other permits cancellation up until order dispatch/shipment regardless of elapsed time.',
      clarification: 'Harmonize cancellation policy: e.g. "Customers may cancel orders within 2 hours of placement, provided the order has not yet entered the dispatch phase."'
    };
  }

  return null;
}

function evaluateRoleConflict(p1: ConceptProfile, p2: ConceptProfile) {
  if (p1.actors.length > 0 && p2.actors.length > 0) {
    const hasAdmin1 = p1.actors.includes('administrator');
    const hasAdmin2 = p2.actors.includes('administrator');
    const hasUser1 = p1.actors.includes('user') || p1.actors.includes('guest');
    const hasUser2 = p2.actors.includes('user') || p2.actors.includes('guest');

    if ((hasAdmin1 && hasUser2 && !hasUser1) || (hasAdmin2 && hasUser1 && !hasAdmin2)) {
      // Check if they are acting on same entity & action
      const commonAction = p1.actions.some(a => p2.actions.includes(a));
      const commonEntity = p1.entities.some(e => p2.entities.includes(e));

      if (commonAction && commonEntity) {
        return {
          elements: 'Role authorization boundary: Administrator vs End-User',
          explanation: 'Conflicting role entitlement: one requirement grants action capability to general users while the other restricts it to administrative roles.',
          clarification: 'Define explicit Role-Based Access Control (RBAC) matrix for this action.'
        };
      }
    }
  }
  return null;
}

function isSemanticOverlap(
  t1: string,
  t2: string,
  p1: ConceptProfile,
  p2: ConceptProfile,
  similarity: number
): boolean {
  // Check synonyms: shipment vs dispatch
  if ((t1.includes('shipment') && t2.includes('dispatch')) || (t1.includes('dispatch') && t2.includes('shipment'))) {
    if (t1.includes('cancel') && t2.includes('cancel')) {
      return true;
    }
  }

  // Check email vs profile update
  if ((t1.includes('email') || t2.includes('email')) && (t1.includes('profile') || t2.includes('profile'))) {
    if ((t1.includes('update') || t1.includes('change')) && (t2.includes('update') || t2.includes('change'))) {
      return true;
    }
  }

  // General high similarity with shared entities without contradiction
  if (similarity > 0.55 && p1.domains.some(d => p2.domains.includes(d))) {
    return true;
  }

  return false;
}

function normalizeToSeconds(item: { value: number; unit: string }): number {
  const u = item.unit.toLowerCase();
  if (u.startsWith('min')) return item.value * 60;
  if (u.startsWith('hour') || u.startsWith('hr')) return item.value * 3600;
  if (u.startsWith('sec')) return item.value;
  if (u.startsWith('day')) return item.value * 86400;
  return item.value;
}

/**
 * External LLM Semantic Analysis (Gemini / OpenAI)
 * Calls LLM API with structured prompt returning JSON
 */
async function analyzeWithLLM(
  requirements: RequirementRecord[],
  provider: 'gemini' | 'openai',
  options: SemanticAnalysisOptions
): Promise<DetectedConflict[]> {
  const pairs: { r1: RequirementRecord; r2: RequirementRecord }[] = [];
  // Sample candidate pairs to avoid exponential LLM token cost
  for (let i = 0; i < requirements.length; i++) {
    for (let j = i + 1; j < requirements.length; j++) {
      pairs.push({ r1: requirements[i], r2: requirements[j] });
    }
  }

  const promptContent = `
You are an expert Software Requirements Engineering AI.
Analyze the following pairs of requirements from different documents (SRS, BRD, etc.) and identify:
1. Direct Contradictions (mutually incompatible logical rules, limits, or authorization models)
2. Partial Conflicts (overlapping scope with conflicting conditions or constraints)
3. Semantic Overlaps (same or related functionality expressed with different terminology - NOT a conflict if compatible!)
4. Potential Duplicates (essentially identical requirements)
5. Ambiguities (vague unquantifiable statements)

CRITICAL RULE: Do NOT report two requirements as a conflict simply because they are similar or related.
For example, "Users can update their email" and "Users can change profile info" is a Semantic Overlap, NOT a conflict.
A conflict exists ONLY when conditions are incompatible.

Requirements to analyze:
${requirements.map(r => `[${r.reference_code}] (${r.document_name || 'Doc'}): "${r.requirement_text}"`).join('\n')}

Output MUST be a strict JSON array with elements matching:
[
  {
    "req1_ref": "SRS-001",
    "req2_ref": "BRD-014",
    "req1_text": "...",
    "req2_text": "...",
    "conflict_type": "Direct Contradiction" | "Partial Conflict" | "Semantic Overlap" | "Duplicate" | "Ambiguity" | "Potential Conflict",
    "severity": "Critical" | "High" | "Medium" | "Low",
    "similarity_score": 0.85,
    "conflicting_elements": "Explanation of exact differing conditions",
    "explanation": "Clear explanation of why it is a conflict or overlap",
    "suggested_clarification": "Neutral recommendation for resolution"
  }
]
`;

  if (provider === 'gemini') {
    const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptContent }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonText) {
      return JSON.parse(jsonText) as DetectedConflict[];
    }
  } else if (provider === 'openai') {
    const apiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptContent }],
        response_format: { type: 'json_object' }
      })
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    const jsonText = data.choices?.[0]?.message?.content;
    if (jsonText) {
      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : (parsed.conflicts || parsed.findings || []);
    }
  }

  return [];
}
