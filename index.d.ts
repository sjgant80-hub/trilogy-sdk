// ═══════════════════════════════════════════════════════════════
// trilogy-sdk — TypeScript Declarations
// ═══════════════════════════════════════════════════════════════

declare module 'trilogy-sdk' {

  // ─── Shared Types ──────────────────────────────────────────

  interface ClientOptions {
    baseUrl?: string;
    maxRetries?: number;
    timeout?: number;
    provider?: 'anthropic' | 'openai' | 'google';
    onRetry?: (attempt: number, delayMs: number) => void;
  }

  interface TokenUsage {
    in?: number;
    out?: number;
  }

  interface Meta {
    provider: string;
    model: string;
    latency_ms: number;
    tokens: TokenUsage;
  }

  // ─── Errors ────────────────────────────────────────────────

  class TrilogyError extends Error {
    status: number;
    body: any;
    constructor(message: string, status: number, body?: any);
  }

  class RateLimitError extends TrilogyError {
    retryAfter: number;
  }

  class AuthError extends TrilogyError {}

  // ─── DocMind ───────────────────────────────────────────────

  interface DocMindOptions extends ClientOptions {
    quality?: 'fast' | 'best';
  }

  interface ParseOptions {
    quality?: 'fast' | 'best';
    provider?: string;
    context?: string;
    instructions?: string;
    mime?: string;
  }

  interface ParseResult {
    id: string;
    type: string;
    data: any;
    meta: Meta;
  }

  interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }

  interface ChatOptions {
    system?: string;
    provider?: string;
    model?: string;
    quality?: 'fast' | 'best';
    max_tokens?: number;
  }

  class DocMind {
    constructor(apiKey: string, options?: DocMindOptions);

    parse: {
      receipt(input: string | Buffer, options?: ParseOptions): Promise<ParseResult>;
      invoice(input: string | Buffer, options?: ParseOptions): Promise<ParseResult>;
      bankStatement(input: string | Buffer, options?: ParseOptions): Promise<ParseResult>;
      contract(input: string | Buffer, options?: ParseOptions): Promise<ParseResult>;
      general(input: string | Buffer, options?: ParseOptions): Promise<ParseResult>;
    };

    parseBatch(documents: Array<{ input: string | Buffer; type?: string }>, options?: ParseOptions): Promise<{ results: any[]; count: number }>;
    chat(messages: string | ChatMessage[], options?: ChatOptions): Promise<any>;
    types(): Promise<any>;
    health(): Promise<any>;
  }

  // ─── Deep ──────────────────────────────────────────────────

  interface DeepOptions extends ClientOptions {
    depth?: 'quick' | 'standard' | 'deep';
  }

  interface ResearchOptions {
    depth?: 'quick' | 'standard' | 'deep';
    provider?: string;
    webhook?: string;
  }

  interface ResearchTask {
    id: string;
    status: string;
    poll: string;
    stream: string;
    /** Poll for latest status */
    poll(): Promise<ResearchResult>;
    /** Wait until completion */
    wait(intervalMs?: number): Promise<ResearchResult>;
    /** Stream progress via SSE */
    stream(onStep: (event: StreamEvent) => void): Promise<any>;
  }

  interface StreamEvent {
    type: 'step' | 'status' | 'result' | 'error';
    step?: string;
    detail?: string;
    status?: string;
    result?: any;
    error?: string;
  }

  interface ResearchResult {
    id: string;
    status: string;
    result?: {
      query: string;
      report: {
        title: string;
        executive_summary: string;
        key_findings: string[];
        sections: Array<{ heading: string; content: string; data_points: any[] }>;
        conclusion: string;
        overall_confidence: number;
      };
      sources: Array<{ url: string; title: string }>;
      meta: any;
    };
    error?: string;
  }

  interface FactCheckResult {
    claims: Array<{
      claim: string;
      verdict: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false' | 'unverifiable';
      confidence: number;
      explanation: string;
      supporting_evidence: string[];
      contradicting_evidence: string[];
      sources: string[];
    }>;
    meta: any;
  }

  interface CompareResult {
    comparison: {
      title: string;
      entities: string[];
      comparison_table: Array<{ aspect: string; values: Record<string, any> }>;
      overall_recommendation: string;
      summary: string;
    };
    meta: any;
  }

  class Deep {
    constructor(apiKey: string, options?: DeepOptions);

    research(query: string, options?: ResearchOptions): Promise<ResearchTask>;
    quick(query: string, options?: { provider?: string }): Promise<any>;
    getResearch(taskId: string): Promise<ResearchResult>;
    waitForResearch(taskId: string, intervalMs?: number, maxWaitMs?: number): Promise<ResearchResult>;
    streamResearch(taskId: string, onStep: (event: StreamEvent) => void): Promise<any>;
    factCheck(claims: string | string[], options?: { provider?: string }): Promise<FactCheckResult>;
    compare(entities: string[], aspects?: string[], options?: { provider?: string }): Promise<CompareResult>;
    extract(url: string, schema?: object, options?: { provider?: string }): Promise<any>;
    health(): Promise<any>;
  }

  // ─── Flux ──────────────────────────────────────────────────

  interface FluxOptions extends ClientOptions {
    quality?: 'fast' | 'best';
    tone?: string;
    audience?: string;
    brandVoice?: string;
  }

  interface GenerateOptions {
    quality?: 'fast' | 'best';
    tone?: string;
    audience?: string;
    brandVoice?: string;
    keywords?: string[];
    length?: string;
    variants?: number;
    provider?: string;
  }

  interface GenerateResult {
    id: string;
    type: string;
    content: any;
    meta: Meta;
  }

  interface RepurposeOptions {
    sourceType?: string;
    targetTypes?: string[];
    tone?: string;
    audience?: string;
    provider?: string;
  }

  class Flux {
    constructor(apiKey: string, options?: FluxOptions);

    generate: {
      blog(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
      social(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
      email(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
      ads(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
      product(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
      landing(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
      thread(brief: string, options?: GenerateOptions): Promise<GenerateResult>;
    };

    repurpose(content: string, options?: RepurposeOptions): Promise<any>;
    improve(content: string, options?: { goals?: string[]; tone?: string; provider?: string }): Promise<any>;
    seo(params: { topic?: string; url?: string; content?: string }, options?: { provider?: string }): Promise<any>;
    brandVoice(samples: string[], brandName?: string, options?: { provider?: string }): Promise<any>;
    types(): Promise<any>;
    health(): Promise<any>;
  }

  // ─── Factory ───────────────────────────────────────────────

  interface TrilogyKeys {
    docmind?: string;
    deep?: string;
    flux?: string;
  }

  interface TrilogyOptions extends ClientOptions {
    docmindUrl?: string;
    deepUrl?: string;
    fluxUrl?: string;
  }

  interface Trilogy {
    docmind: DocMind | null;
    deep: Deep | null;
    flux: Flux | null;
  }

  function createTrilogy(keys: TrilogyKeys, options?: TrilogyOptions): Trilogy;
}
