/**
 * OpenClaw API client - routes AI requests through the Vercel serverless proxy (/api/ai)
 * so the API key never reaches the browser. Falls back to direct calls in dev mode.
 */

const API_BASE = import.meta.env.VITE_OPENCLAW_API_BASE || 'https://openclaw-api.com';
const API_KEY = import.meta.env.VITE_OPENCLAW_API_KEY;

// Production: use serverless proxy. Dev: fall back to direct calls (proxy has no API key locally).
const USE_PROXY = !import.meta.env.DEV && API_KEY === undefined;

const TEXT_MODEL = 'gemini-3.1-pro-preview';
const IMAGE_MODEL = 'gemini-3.1-flash-image';

// ---------- OpenAI-compatible text endpoint ----------

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenClawTextResponse {
  reply: string;
  json?: Record<string, unknown>;
}

/**
 * Call the OpenAI-compatible /v1/chat/completions endpoint for text-only responses.
 * In production this goes through the /api/ai serverless proxy; in dev it calls directly.
 */
export async function generateText(
  messages: ChatMessage[],
  options?: { jsonMode?: boolean; schema?: object }
): Promise<OpenClawTextResponse> {
  const fetchBody: Record<string, unknown> = {
    model: TEXT_MODEL,
    messages,
  };

  if (options?.jsonMode) {
    if (options.schema) {
      fetchBody.response_format = {
        type: 'json_schema',
        json_schema: options.schema,
      };
    } else {
      fetchBody.response_format = { type: 'json_object' };
    }
  }

  let response: Response;

  if (USE_PROXY) {
    // Vercel serverless proxy — API key stays on the server
    fetchBody.jsonMode = options?.jsonMode ?? false;
    if (options?.schema) {
      fetchBody.schema = options.schema;
    }
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fetchBody),
    });
  } else {
    // Dev mode or direct call — API key is available in the client
    if (!API_KEY) throw new Error('未配置 VITE_OPENCLAW_API_KEY，请检查 .env 文件。');
    response = await fetch(`${API_BASE}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(fetchBody),
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.reply ?? data.choices?.[0]?.message?.content ?? '';

  if (options?.jsonMode) {
    try {
      return { reply: content, json: data.json ?? JSON.parse(content) };
    } catch {
      return { reply: content, json: {} };
    }
  }

  return { reply: content };
}

// ---------- Image generation ----------

/**
 * Call the AI image generation endpoint.
 * In production this goes through the /api/ai serverless proxy; in dev it calls directly.
 */
export async function generateImage(
  imageParts: { data: string; mimeType: string }[],
  textPrompt: string
): Promise<string> {
  console.log('[OpenClaw] generateImage request:', { model: IMAGE_MODEL, prompt: textPrompt.slice(0, 80) });

  let response: Response;

  if (USE_PROXY) {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'image',
        images: imageParts,
        prompt: textPrompt,
        model: IMAGE_MODEL,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI image error (${response.status}): ${text}`);
    }

    const data = await response.json();
    if (!data.url) throw new Error('AI 未能生成有效的图像。');
    return data.url;
  }

  // Dev mode or direct call
  if (!API_KEY) throw new Error('未配置 VITE_OPENCLAW_API_KEY，请检查 .env 文件。');

  const content: Array<
    { type: 'text'; text: string } |
    { type: 'image_url'; image_url: { url: string } }
  > = [
    { type: 'text', text: textPrompt },
    ...imageParts.map((img) => ({
      type: 'image_url' as const,
      image_url: { url: `data:${img.mimeType};base64,${img.data}` },
    })),
  ];

  response = await fetch(`${API_BASE}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenClaw image API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  console.log('[OpenClaw] generateImage response keys:', Object.keys(data));

  // Try each known response format
  if (Array.isArray(data.data)) {
    for (const item of data.data) {
      if (typeof item === 'object' && item !== null) {
        const b64 = (item as any).b64_json;
        if (typeof b64 === 'string') return `data:image/png;base64,${b64}`;
        const url = (item as any).url;
        if (typeof url === 'string' && url) return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
      }
    }
  }

  if (typeof data.data === 'string') {
    const url = data.data;
    if (url.startsWith('data:') || url.startsWith('http')) return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
  }

  if (typeof data.data === 'object' && data.data !== null) {
    const b64 = (data.data as any).b64_json;
    if (typeof b64 === 'string') return `data:image/png;base64,${b64}`;
    const url = (data.data as any).url;
    if (typeof url === 'string' && url) return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
  }

  const message = data.choices?.[0]?.message;
  if (message) {
    if (typeof message.content === 'string') {
      const contentStr = message.content;
      const dataUrlMatch = contentStr.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      if (dataUrlMatch) return dataUrlMatch[0];
      if (contentStr.includes('安全') || contentStr.toLowerCase().includes('sorry') || contentStr.includes('permission')) {
        throw new Error('AI 安全策略限制生成该图像。');
      }
    }
    if (Array.isArray((message as any).parts)) {
      for (const part of (message as any).parts) {
        if (part.inline_data || part.inlineData) {
          return `data:image/png;base64,${(part.inline_data || part.inlineData).data}`;
        }
      }
    }
  }

  console.error('[OpenClaw] Unrecognized image response:', JSON.stringify(data).slice(0, 1000));
  throw new Error('AI 未能生成有效的图像。');
}
