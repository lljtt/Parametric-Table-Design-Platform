/**
 * OpenClaw API client - calls gemini-3.1-pro-preview (text) and gemini-3.1-flash-image (images)
 * via the OpenClaw platform (https://openclaw-api.com).
 *
 * All requests go through the Vite dev server proxy (/api/...) to avoid CORS issues.
 */

const API_BASE = (import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_OPENCLAW_API_BASE || 'https://openclaw-api.com');

const API_KEY = import.meta.env.VITE_OPENCLAW_API_KEY;

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
 */
export async function generateText(
  messages: ChatMessage[],
  options?: { jsonMode?: boolean; schema?: object }
): Promise<OpenClawTextResponse> {
  if (!API_KEY) throw new Error('未配置 VITE_OPENCLAW_API_KEY，请检查 .env 文件。');

  const body: Record<string, unknown> = {
    model: TEXT_MODEL,
    messages,
  };

  if (options?.jsonMode) {
    if (options.schema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: options.schema,
      };
    } else {
      body.response_format = { type: 'json_object' };
    }
  }

  const response = await fetch(`${API_BASE}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenClaw API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  if (options?.jsonMode) {
    try {
      return { reply: content, json: JSON.parse(content) };
    } catch {
      return { reply: content, json: {} };
    }
  }

  return { reply: content };
}

// ---------- Image generation ----------

interface ImageMessage {
  role: 'user';
  content: Array<
    { type: 'text'; text: string } |
    { type: 'image_url'; image_url: { url: string } }
  >;
}

/**
 * Call the OpenAI-compatible /v1/chat/completions endpoint for image generation.
 */
export async function generateImage(
  imageParts: { data: string; mimeType: string }[],
  textPrompt: string
): Promise<string> {
  if (!API_KEY) throw new Error('未配置 VITE_OPENCLAW_API_KEY，请检查 .env 文件。');

  const content: ImageMessage['content'] = [
    { type: 'text', text: textPrompt },
    ...imageParts.map((img) => ({
      type: 'image_url' as const,
      image_url: { url: `data:${img.mimeType};base64,${img.data}` },
    })),
  ];

  console.log('[OpenClaw] generateImage request:', { model: IMAGE_MODEL, prompt: textPrompt.slice(0, 80) });

  const response = await fetch(`${API_BASE}/api/v1/chat/completions`, {
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
  console.log('[OpenClaw] generateImage data field:', typeof data.data === 'object' ? JSON.stringify(data.data).slice(0, 200) : String(data.data).slice(0, 200));

  // Response may be in different formats depending on how OpenClaw wraps the model output.
  // Try each known format:

  // 1. OpenClaw format: { data: [...], created: ... } where each item has b64_json
  if (Array.isArray(data.data)) {
    for (const item of data.data) {
      if (typeof item === 'object' && item !== null) {
        if (typeof (item as any).b64_json === 'string') {
          return `data:image/png;base64,${(item as any).b64_json}`;
        }
        if (typeof (item as any).url === 'string' && (item as any).url) {
          const url = (item as any).url;
          return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
        }
      }
    }
  }

  // 2. OpenClaw format: { data: "...", created: ... } where data is a base64 image string or URL
  if (typeof data.data === 'string') {
    const url = data.data;
    if (url.startsWith('data:') || url.startsWith('http')) {
      return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
    }
  }

  // 3. OpenClaw format: { data: { url: "...", b64_json: "..." }, created: ... }
  if (typeof data.data === 'object' && data.data !== null) {
    if (typeof (data.data as any).b64_json === 'string') {
      return `data:image/png;base64,${(data.data as any).b64_json}`;
    }
    if (typeof (data.data as any).url === 'string' && (data.data as any).url) {
      const url = (data.data as any).url;
      return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
    }
  }

  // 3. Standard OpenAI chat format: { choices: [{ message: { content: "..." } }] }
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
    // Check multi-modal response format
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
