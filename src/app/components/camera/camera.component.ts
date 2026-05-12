import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { MatIconButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [MatIconButton, MatFabButton, MatIcon],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.scss',
})
export class CameraComponent implements OnInit, OnDestroy {
  @Output() readonly captured = new EventEmitter<Blob>();
  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild('video', { static: true }) private videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly snackBar = inject(MatSnackBar);
  private stream: MediaStream | null = null;
  private facingMode: 'environment' | 'user' = 'environment';

  async ngOnInit(): Promise<void> {
    if (!this.hasGetUserMedia()) {
      this.snackBar.open('Caméra non supportée par ce navigateur', 'OK', { duration: 3000 });
      this.closed.emit();
      return;
    }
    try {
      await this.start();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Autorisation caméra refusée'
          : "Impossible d'ouvrir la caméra";
      this.snackBar.open(msg, 'OK', { duration: 3000 });
      this.closed.emit();
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private hasGetUserMedia(): boolean {
    return Boolean(navigator.mediaDevices?.getUserMedia);
  }

  private async start(): Promise<void> {
    this.stop();
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const v = this.videoRef.nativeElement;
    v.srcObject = this.stream;
    await v.play().catch(() => undefined);
  }

  private stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    const v = this.videoRef?.nativeElement;
    if (v) v.srcObject = null;
  }

  async switchCamera(): Promise<void> {
    const previous = this.facingMode;
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    try {
      await this.start();
    } catch {
      this.facingMode = previous;
      try {
        await this.start();
      } catch {
        // ignore
      }
      this.snackBar.open('Une seule caméra disponible', 'OK', { duration: 2000 });
    }
  }

  async capture(): Promise<void> {
    const v = this.videoRef.nativeElement;
    const c = this.canvasRef.nativeElement;
    if (!v.videoWidth || !v.videoHeight) {
      this.snackBar.open('Flux vidéo non prêt', 'OK', { duration: 2000 });
      return;
    }
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      c.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
    );
    if (!blob) {
      this.snackBar.open('Échec de la capture', 'OK', { duration: 2000 });
      return;
    }
    this.stop();
    this.captured.emit(blob);
  }

  close(): void {
    this.stop();
    this.closed.emit();
  }
}
