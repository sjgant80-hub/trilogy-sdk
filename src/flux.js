// ═══════════════════════════════════════════════════════════════
// Flux SDK — AI Content Engine
// ═══════════════════════════════════════════════════════════════

const { BaseClient } = require('./base');

class Flux extends BaseClient {
  /**
   * @param {string} apiKey - Your Flux API key (flux_...)
   * @param {object} [options]
   * @param {string} [options.baseUrl] - API base URL
   * @param {string} [options.quality] - Default: 'fast' | 'best'
   * @param {string} [options.provider] - Default provider
   * @param {string} [options.tone] - Default tone
   * @param {string} [options.audience] - Default target audience
   * @param {string} [options.brandVoice] - Default brand voice description
   */
  constructor(apiKey, options = {}) {
    super(apiKey, options.baseUrl || 'https://api.flux-api.io', options);
    this.defaults = {
      quality: options.quality || 'best',
      provider: options.provider || null,
      tone: options.tone || null,
      audience: options.audience || null,
      brandVoice: options.brandVoice || null,
    };

    // Convenience namespace
    this.generate = {
      blog: (brief, opts) => this._generate('blog', brief, opts),
      social: (brief, opts) => this._generate('social', brief, opts),
      email: (brief, opts) => this._generate('email', brief, opts),
      ads: (brief, opts) => this._generate('ads', brief, opts),
      product: (brief, opts) => this._generate('product', brief, opts),
      landing: (brief, opts) => this._generate('landing', brief, opts),
      thread: (brief, opts) => this._generate('thread', brief, opts),
    };
  }

  /**
   * Generate content of any type
   * @param {string} type - Content type
   * @param {string} brief - What to write about
   * @param {object} [options]
   */
  async _generate(type, brief, options = {}) {
    return this.post(`/v1/generate/${type}`, {
      brief,
      quality: options.quality || this.defaults.quality,
      ...(options.tone || this.defaults.tone ? { tone: options.tone || this.defaults.tone } : {}),
      ...(options.audience || this.defaults.audience ? { audience: options.audience || this.defaults.audience } : {}),
      ...(options.brandVoice || this.defaults.brandVoice ? { brand_voice: options.brandVoice || this.defaults.brandVoice } : {}),
      ...(options.keywords && { keywords: options.keywords }),
      ...(options.length && { length: options.length }),
      ...(options.variants && { variants: options.variants }),
      ...(options.provider || this.defaults.provider ? { provider: options.provider || this.defaults.provider } : {}),
    });
  }

  /**
   * Repurpose content into multiple formats
   * @param {string} content - Original content to repurpose
   * @param {object} [options] - { sourceType, targetTypes, tone, audience }
   */
  async repurpose(content, options = {}) {
    return this.post('/v1/repurpose', {
      content,
      ...(options.sourceType && { source_type: options.sourceType }),
      ...(options.targetTypes && { target_types: options.targetTypes }),
      ...(options.tone || this.defaults.tone ? { tone: options.tone || this.defaults.tone } : {}),
      ...(options.audience || this.defaults.audience ? { audience: options.audience || this.defaults.audience } : {}),
      ...(options.provider || this.defaults.provider ? { provider: options.provider || this.defaults.provider } : {}),
    });
  }

  /**
   * Improve existing content
   * @param {string} content - Content to improve
   * @param {object} [options] - { goals, tone }
   */
  async improve(content, options = {}) {
    return this.post('/v1/improve', {
      content,
      ...(options.goals && { goals: options.goals }),
      ...(options.tone && { tone: options.tone }),
      ...(options.provider || this.defaults.provider ? { provider: options.provider || this.defaults.provider } : {}),
    });
  }

  /**
   * SEO analysis — keyword research and content optimization
   * @param {object} params - { topic, url, content }
   * @param {object} [options]
   */
  async seo(params, options = {}) {
    return this.post('/v1/seo', {
      ...params,
      ...(options.provider || this.defaults.provider ? { provider: options.provider || this.defaults.provider } : {}),
    });
  }

  /**
   * Analyze content samples to extract brand voice profile
   * @param {string[]} samples - 3-5 content samples
   * @param {string} [brandName]
   * @param {object} [options]
   */
  async brandVoice(samples, brandName, options = {}) {
    return this.post('/v1/brand-voice', {
      samples,
      ...(brandName && { brand_name: brandName }),
      ...(options.provider || this.defaults.provider ? { provider: options.provider || this.defaults.provider } : {}),
    });
  }

  /** List available content types */
  async types() { return this.get('/v1/types'); }

  async health() { return this.get('/health'); }
}

module.exports = { Flux };
