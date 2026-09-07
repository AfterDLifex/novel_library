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
    <div class="page">
      <h1>Settings</h1>

      <section class="settings-section">
        <h2>Appearance</h2>
        <div class="setting-group">
          <label>Reader Theme</label>
          <div class="theme-options">
            <button (click)="setTheme('light')" [class.active]="reader().theme === 'light'">Light</button>
            <button (click)="setTheme('dark')" [class.active]="reader().theme === 'dark'">Dark</button>
            <button (click)="setTheme('sepia')" [class.active]="reader().theme === 'sepia'">Sepia</button>
          </div>
        </div>

        <div class="setting-group">
          <label>Font Size: {{ reader().fontSize }}px</label>
          <input type="range" min="12" max="32" [value]="reader().fontSize" (input)="setFontSize($any($event.target).valueAsNumber)" />
        </div>

        <div class="setting-group">
          <label>Line Height: {{ reader().lineHeight }}</label>
          <input type="range" min="1" max="3" step="0.1" [value]="reader().lineHeight" (input)="setLineHeight($any($event.target).valueAsNumber)" />
        </div>

        <div class="setting-group">
          <label>Font Family</label>
          <select (change)="setFontFamily($any($event.target).value)">
            <option value="system-ui, -apple-system, sans-serif">System</option>
            <option value="Georgia, serif">Serif</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>

        <div class="setting-group">
          <label>Content Width: {{ reader().contentWidth }}px</label>
          <input type="range" min="400" max="1200" [value]="reader().contentWidth" (input)="setContentWidth($any($event.target).valueAsNumber)" />
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" [checked]="reader().keepScreenAwake" (change)="setKeepAwake($event)" />
            Keep screen awake while reading
          </label>
        </div>
      </section>

      <section class="settings-section">
        <h2>Google Drive Sync</h2>
        <div class="setting-group">
          <label>Google Client ID</label>
          <input type="text" placeholder="your-client-id.apps.googleusercontent.com"
            [(ngModel)]="clientIdInput"
            (blur)="saveClientId()" />
          <p class="hint">Find your client ID in the Google Cloud Console.</p>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" [checked]="syncEnabled()" (change)="toggleSync($event)" />
            Enable Google Drive sync
          </label>
        </div>

        @if (authenticated()) {
          <div class="setting-group">
            <div class="user-info">
              <span>Signed in as {{ user()?.email }}</span>
              <button class="signout-btn" (click)="signOut()">Sign Out</button>
            </div>
            <button class="sync-btn" (click)="sync()" [disabled]="syncing()">
              @if (syncing()) { <span>Syncing...</span> } @else { <span>Sync Now</span> }
            </button>
            @if (lastSync()) {
              <p class="last-sync">Last sync: {{ lastSync() | dateAgo }}</p>
            }
          </div>
        } @else {
          <div class="setting-group">
            <button class="signin-btn" (click)="signIn()" [disabled]="!clientIdInput">
              <app-icon name="cloudSync" [size]="16" /> Sign in with Google
            </button>
          </div>
        }
      </section>

      <section class="settings-section">
        <h2>Novel Search Proxy</h2>
        <div class="setting-group">
          <label>
            <input type="checkbox" [checked]="backendProxyEnabled()" (change)="toggleBackendProxy($event)" />
            Search novel websites via local proxy server
          </label>
          <p class="hint">
            Novel sites block direct browser requests. Run the bundled proxy
            (<code>cd server && npm install && npm start</code>, port 5000) and enable
            this to search Royal Road, Syosetu and more directly.
          </p>
        </div>

        @if (backendProxyEnabled()) {
          <div class="setting-group">
            <label>Proxy server URL</label>
            <input type="text" placeholder="http://localhost:5000"
              [(ngModel)]="backendUrlInput"
              (blur)="saveBackendUrl()" />
            <p class="hint">{{ backendStatus() }}</p>
          </div>
        }
      </section>

      <section class="settings-section">
        <h2>Data Management</h2>
        <div class="setting-group">
          <button class="action-btn" (click)="exportData()">
            <app-icon name="addCircle" [size]="16" /> Export Library (JSON)
          </button>
          <button class="action-btn" (click)="importFile.click()" [disabled]="false">
            <app-icon name="addCircle" [size]="16" /> Import Library (JSON)
          </button>
          <input type="file" #importFile (change)="importFileSelected($event)" accept=".json" style="display: none;" />
        </div>
        <div class="setting-group">
          <button class="destructive-btn" (click)="clearAllData()">
            <app-icon name="delete" [size]="16" /> Clear All Data
          </button>
          <p class="hint">This will remove all your novels, progress, and settings. This action cannot be undone.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    .settings-section { margin-bottom: 2rem; padding: 1rem; border-radius: 0.5rem; background: var(--md-sys-color-surface); box-shadow: var(--md-sys-elevation-1); }
    .settings-section h2 { font-size: 1.1rem; margin: 0 0 0.75rem; }
    .setting-group { margin-bottom: 1rem; }
    .setting-group label { display: block; font-size: 0.85rem; margin-bottom: 0.3rem; color: var(--md-sys-color-on-surface-variant); }
    .setting-group input[type="text"], .setting-group select { width: 100%; padding: 0.4rem 0.5rem; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 0.3rem; background: var(--md-sys-color-surface-container); color: var(--md-sys-color-on-surface); }
    .theme-options { display: flex; gap: 0.25rem; }
    .theme-options button { flex: 1; padding: 0.4rem; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 0.3rem; cursor: pointer; }
    .theme-options button.active { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border-color: var(--md-sys-color-primary); }
    .setting-group input[type="checkbox"] { margin-right: 0.3rem; }
    .action-btn, .signin-btn, .sync-btn, .destructive-btn { display: flex; align-items: center; gap: 0.3rem; width: 100%; padding: 0.5rem 0.75rem; border: none; border-radius: 0.3rem; cursor: pointer; font-weight: 600; }
    .action-btn { background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent); color: var(--md-sys-color-primary); }
    .signin-btn { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .sync-btn { background: color-mix(in srgb, var(--md-sys-color-secondary) 10%, transparent); color: var(--md-sys-color-secondary); }
    .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .destructive-btn { background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent); color: var(--md-sys-color-error); }
    .hint { font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-top: 0.2rem; }
    .user-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .signout-btn { background: none; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 0.3rem; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.8rem; }
    .last-sync { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); }
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
  backendStatus = signal('Checking proxy server…');

  readonly authenticated;
  readonly user;
  readonly syncing;

  constructor(
    private settings: SettingsService,
    private auth: AuthStateService,
    private syncEngine: SyncEngineService,
    private db: DatabaseService,
  ) {
    this.clientIdInput =
      this.settings.settings().googleClientId ?? '';
    this.backendUrlInput =
      this.settings.settings().backendProxyUrl ?? 'http://localhost:5000';

    this.authenticated = this.auth.authenticated;
    this.user = this.auth.user;
    this.syncing = this.syncEngine.syncing;

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
        this.backendStatus.set(`Connected — ${data.sources} sources available.`);
      } else {
        this.backendStatus.set(`Proxy responded with HTTP ${res.status}.`);
      }
    } catch {
      this.backendStatus.set(
        'Could not reach the proxy server. Is it running? (cd server && npm start)'
      );
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

  async setContentWidth(width: number) {
    await this.settings.updateReader({ contentWidth: width });
  }

  async setKeepAwake(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    await this.settings.updateReader({ keepScreenAwake: checked });
  }

  async saveClientId() {
    await this.settings.update({ googleClientId: this.clientIdInput });
    localStorage.setItem('google_client_id', this.clientIdInput);
    this.auth.signIn();
  }

  async toggleSync(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    await this.settings.updateSync({ syncEnabled: checked });
  }

  signIn() {
    this.auth.signIn();
  }

  signOut() {
    this.auth.signOut();
  }

  sync() {
    this.syncEngine.sync();
  }

  async exportData() {
    const data = await this.db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'novel-library-backup.json';
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
      alert('Import successful!');
    } catch {
      alert('Import failed. Invalid file format.');
    }
  }

  async clearAllData() {
    if (!confirm('Are you sure? This will delete all your data.')) return;
    await this.db.clearAll();
    window.location.reload();
  }
}