import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './photo-detail.component.html',
  styleUrl: './photo-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoDetailComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) blob!: Blob;
  @Output() readonly back = new EventEmitter<void>();

  private readonly snackBar = inject(MatSnackBar);

  readonly imageUrl = signal<string>('');
  private currentObjectUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['blob'] && this.blob) {
      this.revoke();
      const url = URL.createObjectURL(this.blob);
      this.currentObjectUrl = url;
      this.imageUrl.set(url);
    }
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  private revoke(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  private isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
      // iPad sous iPadOS s'identifie comme MacIntel avec touch
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /**
   * Enregistre la photo dans la pellicule.
   * - Android / desktop : telechargement direct (Android Photos indexe /Downloads automatiquement)
   * - iOS : ouvre le menu de partage natif car Apple n'autorise pas l'ecriture directe
   *         dans Photos depuis une PWA — il faut choisir "Enregistrer l'image" dans le menu.
   */
  async saveToGallery(): Promise<void> {
    if (this.isIOS()) {
      await this.openShareMenu('Photo enregistrée');
      return;
    }
    this.triggerDownload();
    this.snackBar.open('Photo enregistrée', 'OK', { duration: 2000 });
  }

  /**
   * Ouvre le menu natif de partage : WhatsApp, Mail, Drive, etc.
   */
  async share(): Promise<void> {
    await this.openShareMenu();
  }

  delete(): void {
    if (!confirm('Supprimer cette photo ?')) return;
    this.snackBar.open('Photo supprimée', 'OK', { duration: 1800 });
    this.back.emit();
  }

  private async openShareMenu(successMessage?: string): Promise<void> {
    const filename = `photo_${Date.now()}.jpg`;
    const type = this.blob.type || 'image/jpeg';
    const file = new File([this.blob], filename, { type });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Photo' });
        if (successMessage) {
          this.snackBar.open(successMessage, 'OK', { duration: 2000 });
        }
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    } else {
      this.snackBar.open('Partage non disponible — photo téléchargée', 'OK', { duration: 2500 });
    }
    this.triggerDownload();
  }

  private triggerDownload(): void {
    const filename = `photo_${Date.now()}.jpg`;
    const url = URL.createObjectURL(this.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
