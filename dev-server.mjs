import http from 'node:http';
import { Resend } from 'resend';

const PORT = Number(process.env.DEV_API_PORT || 3001);

function readJsonBody(req, limitBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function handleSendEmail(req, res) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'Config manquante : RESEND_API_KEY absent de .env.local',
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: `Body invalide : ${err.message}` });
  }

  const { to, subject, message, fromName, photoBase64, photoFilename } = body;

  if (!to || !photoBase64) {
    return sendJson(res, 400, { error: 'Champs requis : to, photoBase64' });
  }

  const resend = new Resend(apiKey);

  try {
    const sender = fromName ? `${fromName} <${from}>` : from;
    const { error } = await resend.emails.send({
      from: sender,
      to,
      subject: subject || 'Photo',
      text: message || '',
      attachments: [
        {
          filename: photoFilename || `photo_${Date.now()}.jpg`,
          content: Buffer.from(photoBase64, 'base64'),
        },
      ],
    });
    if (error) {
      return sendJson(res, 500, { error: `Échec Resend : ${error.message || JSON.stringify(error)}` });
    }
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Erreur inconnue';
    return sendJson(res, 500, { error: `Échec de l'envoi : ${detail}` });
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '';
  if (req.method === 'POST' && url === '/api/send-email') {
    return handleSendEmail(req, res);
  }
  sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`[dev-api] listening on http://localhost:${PORT}`);
  console.log('[dev-api] route: POST /api/send-email (provider: Resend)');
  if (!process.env.RESEND_API_KEY) {
    console.warn('[dev-api] ⚠ RESEND_API_KEY manquant dans .env.local — les envois renverront 500.');
  }
});
