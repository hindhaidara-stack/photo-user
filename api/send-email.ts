import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface SendBody {
  to?: string;
  subject?: string;
  message?: string;
  fromName?: string;
  photoBase64?: string;
  photoFilename?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, message, fromName, photoBase64, photoFilename } =
    (req.body ?? {}) as SendBody;

  if (!to || !photoBase64) {
    return res.status(400).json({ error: 'Champs requis : to, photoBase64' });
  }

  const apiKey = process.env['RESEND_API_KEY'];
  const from = process.env['RESEND_FROM'] || 'onboarding@resend.dev';

  if (!apiKey) {
    return res.status(500).json({
      error: 'Configuration manquante côté serveur : RESEND_API_KEY',
    });
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
      return res
        .status(500)
        .json({ error: `Échec Resend : ${error.message || JSON.stringify(error)}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Erreur inconnue';
    return res.status(500).json({ error: `Échec de l'envoi : ${detail}` });
  }
}
