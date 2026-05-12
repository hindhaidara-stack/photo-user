import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  defaultTo: string;
  fromName: string;
}

const KEY = 'photo-pwa-settings';

const DEFAULTS: AppSettings = {
  defaultTo: '',
  fromName: '',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings = signal<AppSettings>(this.read());

  private read(): AppSettings {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  save(values: Partial<AppSettings>): AppSettings {
    const merged = { ...this.settings(), ...values };
    localStorage.setItem(KEY, JSON.stringify(merged));
    this.settings.set(merged);
    return merged;
  }
}
