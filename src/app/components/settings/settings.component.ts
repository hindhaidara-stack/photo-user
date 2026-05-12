import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  @Output() readonly back = new EventEmitter<void>();

  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly model = signal({ ...this.settingsService.settings() });

  update<K extends keyof ReturnType<SettingsComponent['model']>>(key: K, value: string): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  save(): void {
    const m = this.model();
    this.settingsService.save({
      defaultTo: m.defaultTo.trim(),
      fromName: m.fromName.trim(),
    });
    this.snackBar.open('Paramètres enregistrés', 'OK', { duration: 2000 });
    this.back.emit();
  }
}
