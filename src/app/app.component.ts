import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CameraComponent } from './components/camera/camera.component';
import { HomeComponent } from './components/home/home.component';
import { PhotoDetailComponent } from './components/photo-detail/photo-detail.component';

type View = 'home' | 'camera' | 'detail';

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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);

  readonly view = signal<View>('home');
  readonly currentBlob = signal<Blob | null>(null);
  readonly canInstall = signal(false);

  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  ngOnInit(): void {
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

  onCaptured(blob: Blob): void {
    this.currentBlob.set(blob);
    this.view.set('detail');
  }

  onCameraClosed(): void {
    if (this.view() === 'camera') this.view.set('home');
  }

  backToHome(): void {
    this.currentBlob.set(null);
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
