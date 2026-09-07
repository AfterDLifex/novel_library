import { Injectable, signal, effect } from '@angular/core';
import { SettingsService } from './core/storage/settings.service';
import { ReaderSettings } from './models';

/**
 * Service for managing the application theme.
 * Applies theme classes to the document body.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _themeClass = signal<'light' | 'dark' | 'sepia'>('light');
  readonly themeClass = this._themeClass.asReadonly();

  constructor(private settings: SettingsService) {
    // Apply theme from settings on startup and when it changes
    this.applyTheme(this.settings.settings().reader.theme);

    effect(() => {
      this.applyTheme(this.settings.settings().reader.theme);
    });
  }

  private applyTheme(theme: ReaderSettings['theme']) {
    this._themeClass.set(theme);
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    document.body.classList.add(`theme-${theme}`);
  }

  async setTheme(theme: ReaderSettings['theme']) {
    await this.settings.updateReader({ theme });
  }

  async toggleTheme() {
    const current = this.settings.settings().reader.theme;
    const next: ReaderSettings['theme'] = current === 'dark' ? 'light' : 'dark';
    await this.setTheme(next);
  }
}
