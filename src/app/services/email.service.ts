import { Injectable } from '@angular/core';

export interface SendPhotoParams {
  blob: Blob;
  to: string;
  subject: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async sendPhoto({ blob, to, subject, message }: SendPhotoParams): Promise<void> {
    if (!to) throw new Error('Destinataire requis');

    const photoBase64 = await this.blobToBase64(blob);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: subject || 'Photo',
        message: message || '',
        fromName: 'Photo PWA',
        photoBase64,
        photoFilename: `photo_${Date.now()}.jpg`,
      }),
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) detail = body.error;
      } catch {
        // body not JSON
      }
      throw new Error(detail);
    }
  }
}
