import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Photo } from '../../models/photo.model';
import { PhotoStorageService } from '../../services/photo-storage.service';

interface Thumb {
  id: number;
  url: string;
  createdAt: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  @Output() readonly takePhoto = new EventEmitter<void>();
  @Output() readonly openPhoto = new EventEmitter<number>();

  private readonly storage = inject(PhotoStorageService);

  private readonly objectUrls = new Map<number, string>();

  readonly thumbs = computed<Thumb[]>(() => {
    const photos = this.storage.photos();
    this.syncUrls(photos);
    return photos.map((p) => ({
      id: p.id,
      url: this.objectUrls.get(p.id)!,
      createdAt: p.createdAt,
    }));
  });

  readonly count = computed(() => this.storage.photos().length);

  private syncUrls(photos: Photo[]): void {
    const seen = new Set<number>();
    for (const p of photos) {
      seen.add(p.id);
      if (!this.objectUrls.has(p.id)) {
        this.objectUrls.set(p.id, URL.createObjectURL(p.blob));
      }
    }
    for (const [id, url] of this.objectUrls) {
      if (!seen.has(id)) {
        URL.revokeObjectURL(url);
        this.objectUrls.delete(id);
      }
    }
  }
}
