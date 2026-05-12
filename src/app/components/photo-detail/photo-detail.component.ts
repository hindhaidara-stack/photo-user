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
import { Photo } from '../../models/photo.model';
import { PhotoStorageService } from '../../services/photo-storage.service';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './photo-detail.component.html',
  styleUrl: './photo-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoDetailComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) photo!: Photo;
  @Output() readonly back = new EventEmitter<void>();

  private readonly storage = inject(PhotoStorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly imageUrl = signal<string>('');
  private currentObjectUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['photo'] && this.photo) {
      this.revoke();
      const url = URL.createObjectURL(this.photo.blob);
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

  /**
   * Ouvre le menu natif : l'utilisateur choisit "Enregistrer l'image" pour la pellicule
   * ou WhatsApp / Mail / Drive / etc. pour partager.
   * Fallback desktop : telechargement.
   */
  async saveOrShare(): Promise<void> {
    const filename = `photo_${this.photo.createdAt}.jpg`;
    const type = this.photo.blob.type || 'image/jpeg';
    const file = new File([this.photo.blob], filename, { type });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Photo' });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    } else {
      this.snackBar.open('Partage non disponible — photo téléchargée', 'OK', { duration: 2500 });
    }

    const url = URL.createObjectURL(this.photo.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async delete(): Promise<void> {
    if (!confirm('Supprimer cette photo ?')) return;
    await this.storage.remove(this.photo.id);
    this.snackBar.open('Photo supprimée', 'OK', { duration: 1800 });
    this.back.emit();
  }
}
