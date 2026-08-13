import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-opus-4-8';

// Retries transient failures (rate limits, 5xx) with exponential backoff.
// Anything else (bad request, auth, schema mismatch) fails immediately —
// retrying those would just waste the same call again.
async function withRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status;
      const isTransient = status === 429 || (typeof status === 'number' && status >= 500);
      if (!isTransient || attempt >= retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }
}

export function createLLMClient({ apiKey = process.env.ANTHROPIC_API_KEY, client, retries, baseDelayMs } = {}) {
  if (!client && !apiKey) {
    throw new Error(
      'No ANTHROPIC_API_KEY configured. Get a key from https://console.anthropic.com/ (Settings > API Keys) ' +
      'and set it as a persistent environment variable named ANTHROPIC_API_KEY.'
    );
  }
  const anthropic = client || new Anthropic({ apiKey });
  const retryOpts = { retries, baseDelayMs };

  async function generateText(systemPrompt, userPrompt, { effort = 'high', maxTokens = 8000 } = {}) {
    const response = await withRetry(
      () =>
        anthropic.messages.create({
          model: MODEL,
          max_tokens: maxTokens,
          thinking: { type: 'adaptive' },
          output_config: { effort },
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      retryOpts
    );
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('Claude did not return a text response');
    return textBlock.text;
  }

  async function generateStructured(systemPrompt, userPrompt, schema, { effort = 'high', maxTokens = 8000 } = {}) {
    const response = await withRetry(
      () =>
        anthropic.messages.create({
          model: MODEL,
          max_tokens: maxTokens,
          thinking: { type: 'adaptive' },
          output_config: { effort, format: { type: 'json_schema', schema } },
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      retryOpts
    );
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('Claude did not return a structured response');
    return JSON.parse(textBlock.text);
  }

  return { generateText, generateStructured };
}
