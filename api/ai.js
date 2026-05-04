/**
 * Vercel Serverless Function (Node.js) - AI Proxy
 * Proxies requests to OpenClaw API so the API key stays on the server side.
 *
 * POST /api/ai
 * Body:
 *   Text:  { type: 'text', messages: [...], model?, jsonMode?, schema? }
 *   Image: { type: 'image', images: [{ data, mimeType }], prompt, model? }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENCLAW_API_KEY || process.env.VITE_OPENCLAW_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured: missing API key' });
  }

  const apiBase = process.env.OPENCLAW_API_BASE || 'https://openclaw-api.com';

  const body = req.body;
  const requestType = body.type || 'text';

  try {
    if (requestType === 'image') {
      await handleImage(body, apiKey, apiBase, res);
    } else {
      await handleText(body, apiKey, apiBase, res);
    }
  } catch (e) {
    return res.status(502).json({ error: 'Network error', detail: e && e.message });
  }
}

async function handleText(body, apiKey, apiBase, res) {
  const messages = body.messages;
  const model = body.model || 'gemini-3.1-pro-preview';
  const jsonMode = body.jsonMode;
  const schema = body.schema;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const fetchBody = { model, messages };

  if (jsonMode) {
    if (schema) {
      fetchBody.response_format = { type: 'json_schema', json_schema: schema };
    } else {
      fetchBody.response_format = { type: 'json_object' };
    }
  }

  const response = await fetch(apiBase + '/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify(fetchBody),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: 'AI service error', detail: data });
  }

  const choice = data.choices && data.choices[0];
  const content = (choice && choice.message && choice.message.content) || '';

  if (jsonMode) {
    try {
      return res.status(200).json({ reply: content, json: JSON.parse(content) });
    } catch {
      return res.status(200).json({ reply: content, json: {} });
    }
  }

  return res.status(200).json({ reply: content });
}

async function handleImage(body, apiKey, apiBase, res) {
  const images = body.images;
  const prompt = body.prompt;
  const model = body.model || 'gemini-3.1-flash-image';

  if (!images || !Array.isArray(images) || !prompt) {
    return res.status(400).json({ error: 'images array and prompt are required' });
  }

  const contentParts = [
    { type: 'text', text: prompt },
    ...images.map((img) => ({
      type: 'image_url',
      image_url: { url: 'data:' + img.mimeType + ';base64,' + img.data },
    })),
  ];

  const response = await fetch(apiBase + '/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: contentParts }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: 'AI image service error', detail: data });
  }

  const imageUrl = extractImageUrl(data);
  if (!imageUrl) {
    return res.status(500).json({ error: 'AI 未能生成有效的图像。' });
  }

  return res.status(200).json({ url: imageUrl });
}

function extractImageUrl(data) {
  // 1. { data: [{ b64_json }, { url }] }
  if (Array.isArray(data.data)) {
    for (const item of data.data) {
      if (typeof item === 'object' && item !== null) {
        if (typeof item.b64_json === 'string') return 'data:image/png;base64,' + item.b64_json;
        if (typeof item.url === 'string' && item.url) {
          return item.url.startsWith('data:') ? item.url : 'data:image/png;base64,' + item.url;
        }
      }
    }
  }

  // 2. { data: "..." }
  if (typeof data.data === 'string') {
    if (data.data.startsWith('data:') || data.data.startsWith('http')) {
      return data.data.startsWith('data:') ? data.data : 'data:image/png;base64,' + data.data;
    }
  }

  // 3. { data: { b64_json, url } }
  if (typeof data.data === 'object' && data.data !== null) {
    if (typeof data.data.b64_json === 'string') return 'data:image/png;base64,' + data.data.b64_json;
    if (typeof data.data.url === 'string' && data.data.url) {
      return data.data.url.startsWith('data:') ? data.data.url : 'data:image/png;base64,' + data.data.url;
    }
  }

  // 4. { choices: [{ message: { content: "data:image/..." } }] }
  const choice = data.choices && data.choices[0];
  if (choice && choice.message) {
    const msg = choice.message;
    if (typeof msg.content === 'string') {
      const match = msg.content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      if (match) return match[0];
    }
    if (Array.isArray(msg.parts)) {
      for (const part of msg.parts) {
        const inline = part.inline_data || part.inlineData;
        if (inline && inline.data) return 'data:image/png;base64,' + inline.data;
      }
    }
  }

  return null;
}
