// ═══════════════════════════════════════════════════════════════
// DocMind SDK — AI Document Intelligence
// ═══════════════════════════════════════════════════════════════

const { BaseClient } = require('./base');
const fs = require('fs');
const path = require('path');

class DocMind extends BaseClient {
  /**
   * @param {string} apiKey - Your DocMind API key (dm_...)
   * @param {object} [options]
   * @param {string} [options.baseUrl] - API base URL
   * @param {number} [options.maxRetries] - Max retry attempts (default: 3)
   * @param {number} [options.timeout] - Request timeout ms (default: 120000)
   * @param {string} [options.quality] - Default quality: 'fast' | 'best'
   * @param {string} [options.provider] - Default provider: 'anthropic' | 'openai' | 'google'
   */
  constructor(apiKey, options = {}) {
    super(apiKey, options.baseUrl || 'https://api.docmind.io', options);
    this.defaultQuality = options.quality || 'fast';
    this.defaultProvider = options.provider || null;

    // Convenience namespace
    this.parse = {
      receipt: (input, opts) => this._parse('receipt', input, opts),
      invoice: (input, opts) => this._parse('invoice', input, opts),
      bankStatement: (input, opts) => this._parse('bank_statement', input, opts),
      contract: (input, opts) => this._parse('contract', input, opts),
      general: (input, opts) => this._parse('general', input, opts),
    };
  }

  /**
   * Parse a document — text, file path, or base64 image
   * @param {string} type - Document type
   * @param {string|Buffer} input - Text content, file path, or Buffer
   * @param {object} [options] - { quality, provider, context, instructions }
   */
  async _parse(type, input, options = {}) {
    const body = {
      type,
      quality: options.quality || this.defaultQuality,
      ...(this.defaultProvider && { provider: this.defaultProvider }),
      ...(options.provider && { provider: options.provider }),
      ...(options.context && { context: options.context }),
      ...(options.instructions && { instructions: options.instructions }),
    };

    if (typeof input === 'string') {
      // Check if it's a file path
      if (input.length < 500 && !input.includes('\n') && fs.existsSync(input)) {
        const buf = fs.readFileSync(input);
        const ext = path.extname(input).toLowerCase();
        const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf' };
        body.image_base64 = buf.toString('base64');
        body.image_mime = mimeMap[ext] || 'image/jpeg';
      } else {
        body.text = input;
      }
    } else if (Buffer.isBuffer(input)) {
      body.image_base64 = input.toString('base64');
      body.image_mime = options.mime || 'image/jpeg';
    }

    const result = await this.post('/v1/parse', body);
    return result;
  }

  /**
   * Parse multiple documents in one request
   * @param {Array<{input: string|Buffer, type?: string}>} documents
   * @param {object} [options]
   */
  async parseBatch(documents, options = {}) {
    // Batch endpoint uses multipart — fall back to sequential for SDK
    const results = [];
    for (const doc of documents) {
      try {
        const result = await this._parse(doc.type || 'general', doc.input, options);
        results.push({ status: 'success', ...result });
      } catch (err) {
        results.push({ status: 'error', error: err.message });
      }
    }
    return { results, count: results.length };
  }

  /**
   * Chat via multi-LLM gateway
   * @param {string|Array} messages - String or array of {role, content}
   * @param {object} [options] - { system, provider, model, quality, max_tokens }
   */
  async chat(messages, options = {}) {
    const msgs = typeof messages === 'string'
      ? [{ role: 'user', content: messages }]
      : messages;

    return this.post('/v1/chat', {
      messages: msgs,
      ...(options.system && { system: options.system }),
      ...(options.provider && { provider: options.provider }),
      ...(options.model && { model: options.model }),
      ...(options.quality && { quality: options.quality }),
      ...(options.max_tokens && { max_tokens: options.max_tokens }),
    });
  }

  /** List supported document types and available providers */
  async types() { return this.get('/v1/types'); }

  /** Health check */
  async health() { return this.get('/health'); }
}

module.exports = { DocMind };
