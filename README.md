# trilogy-sdk

**Live:** [sjgant80-hub.github.io/trilogy-sdk](https://sjgant80-hub.github.io/trilogy-sdk/)

**The AI API Toolkit.** DocMind + Deep + Flux. One install. Three APIs.

```
npm install trilogy-sdk
```

## Quick Start

```javascript
const { DocMind, Deep, Flux } = require('trilogy-sdk');

// Parse a receipt
const doc = new DocMind('dm_p_your_key', { baseUrl: 'https://your-docmind.railway.app' });
const receipt = await doc.parse.receipt('./receipt.jpg');
console.log(receipt.data.total); // 12.11

// Deep research with streaming
const deep = new Deep('deep_p_your_key', { baseUrl: 'https://your-deep.railway.app' });
const task = await deep.research('quantum computing landscape 2026');
const report = await task.stream((step) => {
  console.log(`[${step.step}] ${step.detail}`);
});

// Generate a Twitter thread
const flux = new Flux('flux_p_your_key', { baseUrl: 'https://your-flux.railway.app' });
const thread = await flux.generate.thread('Why most startups fail at content marketing');
console.log(thread.content.hook);
```

## Factory — All Three at Once

```javascript
const { createTrilogy } = require('trilogy-sdk');

const { docmind, deep, flux } = createTrilogy({
  docmind: 'dm_p_...',
  deep: 'deep_p_...',
  flux: 'flux_p_...',
}, {
  docmindUrl: 'https://your-docmind.railway.app',
  deepUrl: 'https://your-deep.railway.app',
  fluxUrl: 'https://your-flux.railway.app',
});
```

## DocMind — Document Intelligence

```javascript
const doc = new DocMind('dm_p_key', { baseUrl: 'http://localhost:3000' });

// Parse from file path
const receipt = await doc.parse.receipt('./receipt.jpg');
const invoice = await doc.parse.invoice('./invoice.pdf');
const statement = await doc.parse.bankStatement(pdfBuffer, { mime: 'application/pdf' });
const contract = await doc.parse.contract(contractText);

// Parse from text
const result = await doc.parse.receipt('TESCO\nMilk 1.15\nTOTAL 1.15');

// Batch parse
const batch = await doc.parseBatch([
  { input: './receipt1.jpg', type: 'receipt' },
  { input: './receipt2.jpg', type: 'receipt' },
]);

// Chat via multi-LLM gateway
const response = await doc.chat('What is the capital of France?');
```

## Deep — Research Intelligence

```javascript
const deep = new Deep('deep_p_key', { baseUrl: 'http://localhost:3001' });

// Quick research (synchronous)
const quick = await deep.quick('What is MCP and why is it trending?');

// Deep research (async + polling)
const task = await deep.research('AI agent frameworks comparison 2026', { depth: 'deep' });
const result = await task.wait(); // polls until complete

// Deep research with SSE streaming
const task2 = await deep.research('quantum computing leaders');
const report = await task2.stream((event) => {
  if (event.type === 'step') console.log(`[${event.step}] ${event.detail}`);
});

// Fact check
const check = await deep.factCheck([
  'The Great Wall of China is visible from space',
  'Lightning never strikes the same place twice',
]);

// Compare entities
const comparison = await deep.compare(
  ['React', 'Vue', 'Svelte'],
  ['performance', 'learning curve', 'ecosystem', 'job market']
);

// Extract data from URL
const data = await deep.extract('https://example.com/article');
```

## Flux — Content Engine

```javascript
const flux = new Flux('flux_p_key', {
  baseUrl: 'http://localhost:3002',
  tone: 'professional',
  audience: 'SaaS founders',
});

// Generate blog post
const blog = await flux.generate.blog('Complete guide to API-first architecture', {
  keywords: ['API design', 'microservices', 'REST'],
  length: '2000 words',
});

// Generate Twitter thread
const thread = await flux.generate.thread('Why 90% of landing pages fail');

// Generate social media posts
const social = await flux.generate.social('Launching our new AI feature', {
  tone: 'excited',
});

// Email campaign
const emails = await flux.generate.email('Welcome sequence for new SaaS trial users');

// Ad copy with A/B variants
const ads = await flux.generate.ads('Promote our document parsing API', {
  audience: 'developers',
  variants: 3,
});

// Product descriptions
const product = await flux.generate.product('Wireless noise-cancelling headphones, 40hr battery');

// Landing page copy
const landing = await flux.generate.landing('AI-powered receipt scanner for accountants');

// Repurpose content
const repurposed = await flux.repurpose(blogPost, {
  targetTypes: ['twitter_thread', 'linkedin_post', 'email', 'instagram_caption'],
});

// Improve existing content
const improved = await flux.improve(draftText, {
  goals: ['clarity', 'engagement', 'seo'],
});

// SEO analysis
const seo = await flux.seo({ topic: 'AI document parsing' });

// Brand voice analysis
const voice = await flux.brandVoice([sample1, sample2, sample3], 'Acme Corp');
```

## Error Handling

```javascript
const { DocMind, TrilogyError, RateLimitError, AuthError } = require('trilogy-sdk');

try {
  const result = await doc.parse.receipt(file);
} catch (err) {
  if (err instanceof AuthError) {
    console.error('Bad API key');
  } else if (err instanceof RateLimitError) {
    console.error(`Rate limited. Retry in ${err.retryAfter}ms`);
  } else if (err instanceof TrilogyError) {
    console.error(`API error ${err.status}: ${err.message}`);
  }
}
```

## Options

All clients accept these shared options:

| Option | Default | Description |
|---|---|---|
| `baseUrl` | varies | API server URL |
| `maxRetries` | 3 | Retry on 429/5xx errors |
| `timeout` | 120000 | Request timeout (ms) |
| `provider` | null | Default LLM provider |
| `onRetry` | null | Callback on retry: `(attempt, delayMs) => {}` |

## License

MIT
