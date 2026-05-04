export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.OPENCLAW_API_KEY || process.env.VITE_OPENCLAW_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured: missing API key' });
  }

  var apiBase = process.env.OPENCLAW_API_BASE || 'https://openclaw-api.com';
  var body = req.body;
  var type = body.type || 'text';

  try {
    if (type === 'image') {
      await handleImage(body, apiKey, apiBase, res);
    } else {
      await handleText(body, apiKey, apiBase, res);
    }
  } catch (e) {
    res.status(502).json({ error: 'Network error', detail: e && e.message });
  }
}

async function handleText(body, apiKey, apiBase, res) {
  var messages = body.messages;
  var model = body.model || 'gemini-3.1-pro-preview';
  var jsonMode = body.jsonMode;
  var schema = body.schema;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  var fb = { model: model, messages: messages };
  if (jsonMode) {
    fb.response_format = schema
      ? { type: 'json_schema', json_schema: schema }
      : { type: 'json_object' };
  }

  var url = apiBase + '/api/v1/chat/completions';
  var r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify(fb),
  });

  var data = await r.json();
  if (!r.ok) {
    return res.status(r.status).json({ error: 'AI service error', detail: data });
  }

  var content = '';
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    content = data.choices[0].message.content || '';
  }

  if (jsonMode) {
    try {
      return res.status(200).json({ reply: content, json: JSON.parse(content) });
    } catch (e) {
      return res.status(200).json({ reply: content, json: {} });
    }
  }

  res.status(200).json({ reply: content });
}

async function handleImage(body, apiKey, apiBase, res) {
  var images = body.images;
  var prompt = body.prompt;
  var model = body.model || 'gemini-3.1-flash-image';

  if (!images || !Array.isArray(images) || !prompt) {
    return res.status(400).json({ error: 'images and prompt required' });
  }

  var parts = [{ type: 'text', text: prompt }];
  for (var i = 0; i < images.length; i++) {
    parts.push({
      type: 'image_url',
      image_url: { url: 'data:' + images[i].mimeType + ';base64,' + images[i].data },
    });
  }

  var url = apiBase + '/api/v1/chat/completions';
  var r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ model: model, messages: [{ role: 'user', content: parts }] }),
  });

  var data = await r.json();
  if (!r.ok) {
    return res.status(r.status).json({ error: 'AI image error', detail: data });
  }

  var found = extractUrl(data);
  if (!found) return res.status(500).json({ error: 'AI 未能生成有效的图像。' });
  res.status(200).json({ url: found });
}

function extractUrl(data) {
  if (Array.isArray(data.data)) {
    for (var i = 0; i < data.data.length; i++) {
      var it = data.data[i];
      if (typeof it === 'object' && it) {
        if (typeof it.b64_json === 'string') return 'data:image/png;base64,' + it.b64_json;
        if (typeof it.url === 'string' && it.url) return it.url.startsWith('data:') ? it.url : 'data:image/png;base64,' + it.url;
      }
    }
  }
  if (typeof data.data === 'string' && (data.data.startsWith('data:') || data.data.startsWith('http'))) {
    return data.data.startsWith('data:') ? data.data : 'data:image/png;base64,' + data.data;
  }
  if (typeof data.data === 'object' && data.data) {
    if (typeof data.data.b64_json === 'string') return 'data:image/png;base64,' + data.data.b64_json;
    if (typeof data.data.url === 'string' && data.data.url) return data.data.url.startsWith('data:') ? data.data.url : 'data:image/png;base64,' + data.data.url;
  }
  var msg = data.choices && data.choices.length > 0 ? data.choices[0].message : null;
  if (msg) {
    if (typeof msg.content === 'string') {
      var m = msg.content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      if (m) return m[0];
    }
    if (Array.isArray(msg.parts)) {
      for (var j = 0; j < msg.parts.length; j++) {
        var il = msg.parts[j].inline_data || msg.parts[j].inlineData;
        if (il && il.data) return 'data:image/png;base64,' + il.data;
      }
    }
  }
  return null;
}
