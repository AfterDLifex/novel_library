import { Injectable, signal, effect } from '@angular/core';
import { db } from '../database/indexed-db.service';
import { AppSettings, ReaderSettings, NavigationSettings } from '../../models';

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  theme: 'light',
  contentWidth: 720,
  keepScreenAwake: false,
};

const DEFAULT_NAVIGATION_SETTINGS: NavigationSettings = {
  position: 'floating-bottom',
  stickiness: 'autohide',
  oneHandedMode: 'disabled',
  maxVisibleMobileTabs: 4,
};

const DEFAULT_SETTINGS: AppSettings = {
  reader: DEFAULT_READER_SETTINGS,
  navigation: DEFAULT_NAVIGATION_SETTINGS,
  syncEnabled: false,
  deviceId: generateDeviceId(),
  // Stable defaults (Open Library, Gutendex) work directly from the browser
  // with no local server — the proxy is an opt-in for the scraping sources.
  backendProxyEnabled: false,
  backendProxyUrl: 'http://localhost:5000',
};

function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).slice(2) + '_' + Date.now();
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _settings = signal<AppSettings>(DEFAULT_SETTINGS);
  readonly settings = this._settings.asReadonly();

  constructor() {
    this.load();
  }

  private async load() {
    const all = await db.settings.toArray();
    if (all.length > 0) {
      const stored = all[0];
      const merged: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...stored,
        navigation: {
          ...DEFAULT_NAVIGATION_SETTINGS,
          ...(stored.navigation || {}),
        },
        reader: {
          ...DEFAULT_READER_SETTINGS,
          ...(stored.reader || {}),
        },
      };
      this._settings.set(merged);
    } else {
      await db.settings.add(this._settings());
    }
  }

  async update(partial: Partial<AppSettings>) {
    const current = this._settings();
    const next = { ...current, ...partial };
    this._settings.set(next);
    await db.settings.put(next);
  }

  async updateReader(partial: Partial<ReaderSettings>) {
    const current = this._settings();
    const next = {
      ...current,
      reader: { ...current.reader, ...partial },
    };
    await this.update(next);
  }

  async updateNavigation(partial: Partial<NavigationSettings>) {
    const current = this._settings();
    const next = {
      ...current,
      navigation: { ...(current.navigation || DEFAULT_NAVIGATION_SETTINGS), ...partial },
    };
    await this.update(next);
  }

  async updateSync(partial: Partial<Pick<AppSettings, 'syncEnabled' | 'googleClientId'>>): Promise<void> {
    const current = this._settings();
    const next = { ...current, ...partial };
    this._settings.set(next);
    await db.settings.put(next);
  }
}
