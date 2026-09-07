import { Injectable, signal, computed, effect } from '@angular/core';
import { ReaderSettings } from '../../models';
import { SettingsService } from '../../core/storage/settings.service';


const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  theme: 'light',
  contentWidth: 720,
  keepScreenAwake: false,
};

@Injectable({ providedIn: 'root' })
export class ReaderSettingsService {
  readonly settings = computed(() => this.settingsService.settings().reader);

  readonly fontSize = computed(() => this.settings().fontSize);
  readonly lineHeight = computed(() => this.settings().lineHeight);
  readonly fontFamily = computed(() => this.settings().fontFamily);
  readonly theme = computed(() => this.settings().theme);
  readonly contentWidth = computed(() => this.settings().contentWidth);
  readonly keepScreenAwake = computed(() => this.settings().keepScreenAwake);

  // CSS variables applied to the reader container
  readonly readerStyle = computed(() => ({
    '--reader-font-size': `${this.fontSize()}px`,
    '--reader-line-height': this.lineHeight(),
    '--reader-font-family': this.fontFamily(),
    '--reader-content-width': `${this.contentWidth()}px`,
  } as Record<string, string>));

  constructor(private settingsService: SettingsService) {
    // Apply screen wake lock when enabled
    effect(() => {
      if (this.keepScreenAwake()) {
        this.enableWakeLock();
      } else {
        this.disableWakeLock();
      }
    });
  }

  async updateFontSize(size: number) {
    await this.settingsService.updateReader({ fontSize: size });
  }

  async setLineHeight(height: number) {
    await this.settingsService.updateReader({ lineHeight: height });
  }

  async setFontFamily(family: string) {
    await this.settingsService.updateReader({ fontFamily: family });
  }

  async setTheme(theme: ReaderSettings['theme']) {
    await this.settingsService.updateReader({ theme });
  }

  async setContentWidth(width: number) {
    await this.settingsService.updateReader({ contentWidth: width });
  }

  async setKeepScreenAwake(awake: boolean) {
    await this.settingsService.updateReader({ keepScreenAwake: awake });
  }

  // Screen Wake Lock API
  private wakeLock: any = null;

  private async enableWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } else {
        // Fallback: use a no-op interval to keep screen awake
        this.keepAwakeInterval = window.setInterval(() => {}, 60000);
      }
    } catch {
      this.keepAwakeInterval = window.setInterval(() => {}, 60000);
    }
  }

  private keepAwakeInterval: any = null;

  private disableWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
    if (this.keepAwakeInterval) {
      clearInterval(this.keepAwakeInterval);
      this.keepAwakeInterval = null;
    }
  }
}
