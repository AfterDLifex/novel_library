import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DateAgoPipe } from '../../shared/pipes/date-ago.pipe';
import { SettingsService } from '../../core/storage/settings.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { SyncEngineService } from '../../core/sync/sync-engine.service';
import { DatabaseService } from '../../core/database/database.service';
import { ReaderSettings } from '../../models';

@Component({
  selector: 'app-settings-page',
  template: `
    <div class="settings-page content-shell">
      <header class="page-header glass-strong">
        <div class="header-left">
          <app-icon name="settings" [size]="24" class="header-icon" />
          <div>
            <h1>Settings & Preferences</h1>
            <p class="subtitle">Customize reader themes, typography, sync & library backup</p>
          </div>
        </div>
      </header>

      <div class="sections-grid">
        <!-- Appearance & Reader Settings -->
        <section class="settings-section glass-strong">
          <h2><app-icon name="visibility" [size]="20" /> Reader & Theme Customization</h2>
          
          <div class="setting-group">
            <label>Active Theme Preset</label>
            <div class="theme-options">
              <button (click)="setTheme('light')" [class.active]="reader().theme === 'light'">Light</button>
              <button (click)="setTheme('sepia')" [class.active]="reader().theme === 'sepia'">Sepia</button>
              <button (click)="setTheme('dark')" [class.active]="reader().theme === 'dark'">Dark</button>
              <button (click)="setTheme('midnight')" [class.active]="reader().theme === 'midnight'">Midnight</button>
            </div>
          </div>

          <div class="setting-group">
            <label>Reader Font Size: <strong>{{ reader().fontSize }}px</strong></label>
            <input type="range" min="12" max="32" [value]="reader().fontSize" (input)="setFontSize($any($event.target).valueAsNumber)" class="slider" />
          </div>

          <div class="setting-group">
            <label>Reader Line Spacing: <strong>{{ reader().lineHeight }}</strong></label>
            <input type="range" min="1" max="3" step="0.1" [value]="reader().lineHeight" (input)="setLineHeight($any($event.target).valueAsNumber)" class="slider" />
          </div>

          <div class="setting-group">
            <label>Default Typography</label>
            <select [ngModel]="reader().fontFamily" (ngModelChange)="setFontFamily($event)">
              <option value="var(--font-sans)">Sans-Serif (Inter)</option>
              <option value="var(--font-serif)">Serif (Merriweather)</option>
              <option value="var(--font-mono)">Monospace (Fira Code)</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="checkbox-label">
              <input type="checkbox" [checked]="reader().keepScreenAwake" (change)="setKeepAwake($event)" />
              Keep screen awake while reading
            </label>
          </div>
        </section>

        <!-- Data Backup & Restore -->
        <section class="settings-section glass-strong">
          <h2><app-icon name="cloudSync" [size]="20" /> Library Backup & Data Management</h2>
          
          <div class="setting-group buttons-row">
            <button class="action-btn glass lift" (click)="exportData()">
              <app-icon name="download" [size]="18" /> Export Library Backup (JSON)
            </button>
            
            <button class="action-btn glass lift" (click)="importFile.click()">
              <app-icon name="add" [size]="18" /> Restore Library Backup (JSON)
            </button>
            <input type="file" #importFile (change)="importFileSelected($event)" accept=".json" style="display: none;" />
          </div>

          <div class="setting-group destructive-box">
            <button class="destructive-btn glass lift" (click)="clearAllData()">
              <app-icon name="delete" [size]="18" /> Reset & Clear All Data
            </button>
            <p class="hint">Permanently deletes all library entries, history, bookmarks & settings.</p>
          </div>
        </section>

        <!-- Search Proxy Settings -->
        <section class="settings-section glass-strong">
          <h2><app-icon name="source" [size]="20" /> Online Sources Proxy Config</h2>
          
          <div class="setting-group">
            <label class="checkbox-label">
              <input type="checkbox" [checked]="backendProxyEnabled()" (change)="toggleBackendProxy($event)" />
              Enable Local Search Proxy Server
            </label>
            <p class="hint">
              Run local proxy server in <code>server/</code> to scrape and bypass CORS on external novel websites.
            </p>
          </div>

          @if (backendProxyEnabled()) {
            <div class="setting-group">
              <label>Proxy Endpoint URL</label>
              <input type="text" placeholder="http://localhost:5000"
                [(ngModel)]="backendUrlInput"
                (blur)="saveBackendUrl()" />
              <p class="status-msg">{{ backendStatus() }}</p>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      padding-top: 1.25rem;
      padding-bottom: 3rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-large);
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon { color: var(--md-sys-color-primary); }

    h1 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .subtitle { font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); margin: 0; }

    .sections-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .settings-section {
      padding: 1.5rem;
      border-radius: var(--radius-large);
    }

    .settings-section h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
    }

    .setting-group {
      margin-bottom: 1.25rem;
    }
    .setting-group:last-child { margin-bottom: 0; }

    .setting-group label {
      display: block;
      font-size: 0.85rem;
      margin-bottom: 0.4rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .setting-group input[type="text"], .setting-group select {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-medium);
      background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
      color: var(--md-sys-color-on-surface);
      font-size: 0.85rem;
    }

    .slider {
      width: 100%;
      accent-color: var(--md-sys-color-primary);
    }

    .theme-options {
      display: flex;
      gap: 0.5rem;
    }
    .theme-options button {
      flex: 1;
      padding: 0.55rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-medium);
      background: var(--glass-bg);
      color: var(--md-sys-color-on-surface);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .theme-options button.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .checkbox-label input { accent-color: var(--md-sys-color-primary); width: 16px; height: 16px; }

    .buttons-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      min-width: 200px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1rem;
      border-radius: var(--radius-medium);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--md-sys-color-primary);
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .destructive-box {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--glass-border);
    }

    .destructive-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      border-radius: var(--radius-medium);
      background: color-mix(in srgb, var(--md-sys-color-error) 15%, transparent);
      border: 1px solid var(--md-sys-color-error);
      color: var(--md-sys-color-error);
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .hint {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 0.35rem;
    }

    .status-msg {
      font-size: 0.78rem;
      color: var(--md-sys-color-primary);
      margin-top: 0.35rem;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateAgoPipe],
})
export class SettingsPageComponent {
  readonly reader = computed(() => this.settings.settings().reader);
  readonly syncEnabled = computed(() => this.settings.settings().syncEnabled);
  readonly lastSync = computed(() => this.settings.settings().lastSyncAt);
  readonly backendProxyEnabled = computed(() => !!this.settings.settings().backendProxyEnabled);

  clientIdInput = '';
  backendUrlInput = 'http://localhost:5000';
  backendStatus = signal('Checking proxy server status…');

  constructor(
    private settings: SettingsService,
    private auth: AuthStateService,
    private syncEngine: SyncEngineService,
    private db: DatabaseService,
  ) {
    this.clientIdInput = this.settings.settings().googleClientId ?? '';
    this.backendUrlInput = this.settings.settings().backendProxyUrl ?? 'http://localhost:5000';

    if (this.backendProxyEnabled()) {
      this.checkBackendHealth();
    }
  }

  async toggleBackendProxy(event: Event) {
    const enabled = (event.target as HTMLInputElement).checked;
    await this.settings.update({ backendProxyEnabled: enabled });
    if (enabled) {
      await this.settings.update({
        backendProxyUrl: this.backendUrlInput || 'http://localhost:5000',
      });
      this.checkBackendHealth();
    }
  }

  async saveBackendUrl() {
    await this.settings.update({ backendProxyUrl: this.backendUrlInput });
    this.checkBackendHealth();
  }

  private async checkBackendHealth() {
    const url = (this.backendUrlInput || 'http://localhost:5000').replace(/\/$/, '');
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) {
        const data = await res.json();
        this.backendStatus.set(`Connected — ${data.sources} search sources active.`);
      } else {
        this.backendStatus.set(`Proxy error HTTP ${res.status}.`);
      }
    } catch {
      this.backendStatus.set('Local proxy server unreachable.');
    }
  }

  async setTheme(theme: ReaderSettings['theme']) {
    await this.settings.updateReader({ theme });
  }

  async setFontSize(size: number) {
    await this.settings.updateReader({ fontSize: size });
  }

  async setLineHeight(height: number) {
    await this.settings.updateReader({ lineHeight: height });
  }

  async setFontFamily(family: string) {
    await this.settings.updateReader({ fontFamily: family });
  }

  async setKeepAwake(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    await this.settings.updateReader({ keepScreenAwake: checked });
  }

  async exportData() {
    const data = await this.db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel-library-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const text = await input.files[0].text();
    try {
      const data = JSON.parse(text);
      await this.db.importData(data);
      alert('Library backup successfully restored!');
    } catch {
      alert('Import failed. Invalid JSON backup file.');
    }
  }

  async clearAllData() {
    if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) return;
    await this.db.clearAll();
    window.location.reload();
  }
}