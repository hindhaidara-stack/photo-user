import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmailService } from '../../services/email.service';

export interface EmailDialogData {
  blob: Blob;
}

@Component({
  selector: 'app-email-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './email-dialog.component.html',
  styleUrl: './email-dialog.component.scss',
})
export class EmailDialogComponent {
  private readonly data = inject<EmailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EmailDialogComponent, boolean>);
  private readonly emailService = inject(EmailService);
  private readonly snackBar = inject(MatSnackBar);

  readonly to = signal('');
  readonly subject = signal('Photo');
  readonly message = signal('');
  readonly sending = signal(false);

  async send(): Promise<void> {
    const to = this.to().trim();
    if (!to) {
      this.snackBar.open('Destinataire requis', 'OK', { duration: 2500 });
      return;
    }
    this.sending.set(true);
    try {
      await this.emailService.sendPhoto({
        blob: this.data.blob,
        to,
        subject: this.subject().trim(),
        message: this.message().trim(),
      });
      this.snackBar.open('Email envoyé', 'OK', { duration: 2500 });
      this.dialogRef.close(true);
    } catch (err: unknown) {
      const detail =
        (err as { message?: string })?.message ?? 'Erreur inconnue';
      this.snackBar.open(`Échec de l'envoi : ${detail}`, 'OK', { duration: 4000 });
    } finally {
      this.sending.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
