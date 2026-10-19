// Higgsfield Cloud API: upload de referência, geração de vídeo e status.
const BASE = 'https://api.higgsfield.ai';

export const hfEnabled = env => !!(env.HF_API_KEY_ID && env.HF_API_KEY_SECRET);
const headers = env => ({ authorization: `Key ${env.HF_API_KEY_ID}:${env.HF_API_KEY_SECRET}`, 'content-type': 'application/json' });

export async function uploadToHf(env, bytes, contentType) {
  const r = await fetch(BASE + '/files/generate-upload-url', { method: 'POST', headers: headers(env), body: JSON.stringify({ content_type: contentType }) });
  if (!r.ok) throw new Error('hf upload-url ' + r.status + ' ' + await r.text());
  const { upload_url, upload_headers, public_url } = await r.json();
  const put = await fetch(upload_url, { method: 'PUT', headers: upload_headers || { 'content-type': contentType }, body: bytes });
  if (!put.ok) throw new Error('hf upload ' + put.status);
  return public_url;
}

export async function submitReel(env, { imageUrl, prompt, duration = 5 }) {
  const model = env.HF_VIDEO_MODEL || 'bytedance/seedance-2.5/reference-to-video';
  const body = model.startsWith('bytedance/seedance')
    ? { prompt, image_urls: [imageUrl], duration, resolution: '720p', aspect_ratio: '9:16', generate_audio: false }
    : { prompt, image_urls: [imageUrl], duration, aspect_ratio: '9:16', mode: 'std', sound: 'off' };
  const r = await fetch(`${BASE}/${model}`, { method: 'POST', headers: { ...headers(env), 'idempotency-key': crypto.randomUUID() }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('hf submit ' + r.status + ' ' + await r.text());
  return r.json(); // { request_id, status, status_url, cancel_url }
}

export async function requestStatus(env, requestId) {
  const r = await fetch(`${BASE}/requests/${requestId}/status`, { headers: headers(env) });
  if (!r.ok) throw new Error('hf status ' + r.status);
  return r.json(); // { status, video: { url } }
}
