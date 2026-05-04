/**
 * Vercel Serverless Function - AI Proxy
 * Proxies requests to OpenClaw API so the API key stays on the server side.
 *
 * Usage: POST /api/ai
 * Body:
 *   Text:  { type: 'text', messages: [...], model?: string, jsonMode?: boolean, schema?: object }
 *   Image: { type: 'image', images: [{ data: string, mimeType: string }], prompt: string, model?: string }
 */

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENCLAW_API_KEY || process.env.VITE_OPENCLAW_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server not configured: missing API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiBase = process.env.OPENCLAW_API_BASE || 'https://openclaw-api.com';

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestType = (body.type as string) || 'text';

  try {
    if (requestType === 'image') {
      return await handleImage(body, apiKey, apiBase);
    }
    return await handleText(body, apiKey, apiBase);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Network error', detail: error?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleText(
  body: Record<string, unknown>,
  apiKey: string,
  apiBase: string
): Promise<Response> {
  const { messages, model = 'gemini-3.1-pro-preview', jsonMode, schema } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fetchBody: Record<string, unknown> = { model, messages };

  if (jsonMode) {
    if (schema) {
      fetchBody.response_format = {
        type: 'json_schema',
        json_schema: schema,
      };
    } else {
      fetchBody.response_format = { type: 'json_object' };
    }
  }

  const response = await fetch(`${apiBase}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(fetchBody),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'AI service error', detail: data }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const content = data.choices?.[0]?.message?.content ?? '';

  if (jsonMode) {
    try {
      return new Response(JSON.stringify({ reply: content, json: JSON.parse(content) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ reply: content, json: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ reply: content }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleImage(
  body: Record<string, unknown>,
  apiKey: string,
  apiBase: string
): Promise<Response> {
  const { images, prompt, model = 'gemini-3.1-flash-image' } = body;

  if (!images || !Array.isArray(images) || !prompt) {
    return new Response(JSON.stringify({ error: 'images array and prompt are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const content = [
    { type: 'text', text: prompt as string },
    ...(images as Array<{ data: string; mimeType: string }>).map((img) => ({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.data}` },
    })),
  ];

  const response = await fetch(`${apiBase}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'AI image service error', detail: data }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract image URL from various response formats
  let imageUrl = extractImageUrl(data);
  if (!imageUrl) {
    return new Response(JSON.stringify({ error: 'AI 未能生成有效的图像。' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ url: imageUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extractImageUrl(data: Record<string, unknown>): string | null {
  // 1. { data: [{ b64_json: "...", url: "..." }] }
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

  // 2. { data: "..." }
  if (typeof data.data === 'string') {
    const url = data.data;
    if (url.startsWith('data:') || url.startsWith('http')) return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
  }

  // 3. { data: { b64_json: "...", url: "..." } }
  if (typeof data.data === 'object' && data.data !== null) {
    const b64 = (data.data as any).b64_json;
    if (typeof b64 === 'string') return `data:image/png;base64,${b64}`;
    const url = (data.data as any).url;
    if (typeof url === 'string' && url) return url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
  }

  // 4. { choices: [{ message: { content: "data:image/..." } }] }
  const message = (data as any).choices?.[0]?.message;
  if (message && typeof message.content === 'string') {
    const match = message.content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
    if (match) return match[0];
  }

  // 5. { choices: [{ message: { parts: [{ inline_data: { data: "..." } }] } }] }
  if (message && Array.isArray(message.parts)) {
    for (const part of (message as any).parts) {
      const inline = part.inline_data || part.inlineData;
      if (inline?.data) return `data:image/png;base64,${inline.data}`;
    }
  }

  return null;
}

export const config = {
  runtime: 'edge',
};
