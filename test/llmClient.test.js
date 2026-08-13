import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLLMClient } from '../src/llmClient.js';

function textResponse(text) {
  return { content: [{ type: 'text', text }] };
}

test('createLLMClient throws without an apiKey or an injected client', () => {
  assert.throws(() => createLLMClient({ apiKey: undefined }), /No ANTHROPIC_API_KEY configured/);
});

test('generateText retries a transient (5xx) failure and succeeds', async () => {
  let calls = 0;
  const client = {
    messages: {
      create: async () => {
        calls++;
        if (calls < 2) {
          const err = new Error('server error');
          err.status = 500;
          throw err;
        }
        return textResponse('ok');
      },
    },
  };
  const llm = createLLMClient({ client, baseDelayMs: 1 });
  const result = await llm.generateText('system', 'prompt');
  assert.equal(result, 'ok');
  assert.equal(calls, 2);
});

test('generateText retries a 429 rate-limit failure', async () => {
  let calls = 0;
  const client = {
    messages: {
      create: async () => {
        calls++;
        if (calls < 3) {
          const err = new Error('rate limited');
          err.status = 429;
          throw err;
        }
        return textResponse('ok');
      },
    },
  };
  const llm = createLLMClient({ client, baseDelayMs: 1 });
  const result = await llm.generateText('system', 'prompt');
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('generateText does not retry a non-transient (400) failure', async () => {
  let calls = 0;
  const client = {
    messages: {
      create: async () => {
        calls++;
        const err = new Error('bad request');
        err.status = 400;
        throw err;
      },
    },
  };
  const llm = createLLMClient({ client, baseDelayMs: 1 });
  await assert.rejects(() => llm.generateText('system', 'prompt'), /bad request/);
  assert.equal(calls, 1);
});

test('generateText gives up after exhausting retries and surfaces the last error', async () => {
  let calls = 0;
  const client = {
    messages: {
      create: async () => {
        calls++;
        const err = new Error('still down');
        err.status = 503;
        throw err;
      },
    },
  };
  const llm = createLLMClient({ client, retries: 2, baseDelayMs: 1 });
  await assert.rejects(() => llm.generateText('system', 'prompt'), /still down/);
  assert.equal(calls, 3); // initial attempt + 2 retries
});

test('generateStructured parses the JSON text block', async () => {
  const client = {
    messages: { create: async () => textResponse('{"a":1}') },
  };
  const llm = createLLMClient({ client });
  const result = await llm.generateStructured('system', 'prompt', { type: 'object' });
  assert.deepEqual(result, { a: 1 });
});
