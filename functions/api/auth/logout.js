import { json } from '../../../lib/util.js';
import { clearCookie } from '../../../lib/auth.js';
export const onRequestPost = () => json({ ok: true }, 200, { 'set-cookie': clearCookie() });
