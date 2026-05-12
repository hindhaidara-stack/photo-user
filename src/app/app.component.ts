import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CameraComponent } from './components/camera/camera.component';
import { HomeComponent } from './components/home/home.component';
import { PhotoDetailComponent } from './components/photo-detail/photo-detail.component';
import { SettingsComponent } from './components/settings/settings.component';
import { Photo } from './models/photo.model';
import { PhotoStorageService } from './services/photo-storage.service';

type View = 'home' | 'camera' | 'detail' | 'settings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    HomeComponent,
    CameraComponent,
    PhotoDetailComponent,
    SettingsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly storage = inject(PhotoStorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly view = signal<View>('home');
  readonly selectedPhoto = signal<Photo | null>(null);
  readonly canInstall = signal(false);

  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  async ngOnInit(): Promise<void> {
    await this.storage.loadAll();

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredInstallPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.snackBar.open('Application installée', 'OK', { duration: 2000 });
    });

    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'capture') {
      setTimeout(() => this.openCamera(), 200);
    }
  }

  openCamera(): void {
    this.view.set('camera');
  }

  async onCaptured(blob: Blob): Promise<void> {
    try {
      const photo = await this.storage.addPhoto(blob);
      this.snackBar.open('Photo enregistrée', 'OK', { duration: 1800 });
      this.selectedPhoto.set(photo);
      this.view.set('detail');
    } catch (err) {
      console.error(err);
      this.snackBar.open("Impossible d'enregistrer la photo", 'OK', { duration: 2500 });
      this.view.set('home');
    }
  }

  onCameraClosed(): void {
    if (this.view() === 'camera') this.view.set('home');
  }

  openPhoto(id: number): void {
    const photo = this.storage.photos().find((p) => p.id === id);
    if (!photo) return;
    this.selectedPhoto.set(photo);
    this.view.set('detail');
  }

  openSettings(): void {
    this.view.set('settings');
  }

  backToHome(): void {
    this.selectedPhoto.set(null);
    this.view.set('home');
  }

  onPhotoDeleted(): void {
    this.selectedPhoto.set(null);
    this.view.set('home');
  }

  async install(): Promise<void> {
    if (!this.deferredInstallPrompt) return;
    this.deferredInstallPrompt.prompt();
    const choice = await this.deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      this.canInstall.set(false);
    }
    this.deferredInstallPrompt = null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}
