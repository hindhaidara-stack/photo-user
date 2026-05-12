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
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Photo } from '../../models/photo.model';
import { PhotoStorageService } from '../../services/photo-storage.service';
import { EmailDialogComponent, EmailDialogData } from '../email-dialog/email-dialog.component';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './photo-detail.component.html',
  styleUrl: './photo-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoDetailComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) photo!: Photo;
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly deleted = new EventEmitter<number>();

  private readonly storage = inject(PhotoStorageService);
  private readonly dialog = inject(MatDialog);
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

  async delete(): Promise<void> {
    if (!confirm('Supprimer cette photo ?')) return;
    const id = this.photo.id;
    await this.storage.remove(id);
    this.snackBar.open('Photo supprimée', 'OK', { duration: 1800 });
    this.deleted.emit(id);
  }

  openEmail(): void {
    this.dialog.open<EmailDialogComponent, EmailDialogData, boolean>(EmailDialogComponent, {
      data: { photo: this.photo },
      width: '420px',
      maxWidth: '95vw',
    });
  }
}
