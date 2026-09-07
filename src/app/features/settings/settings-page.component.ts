import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { DateAgoPipe } from '../../shared/pipes/date-ago.pipe';
import { SettingsService } from '../../core/storage/settings.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { SyncEngineService } from '../../core/sync/sync-engine.service';
import { DatabaseService } from '../../core/database/database.service';
import { SearchCoordinatorService } from '../search/services/search-coordinator.service';
import { ReaderSettings, NavigationSettings } from '../../models';

type SettingsTab = 'reader' | 'navigation' | 'sources' | 'data' | 'advanced';

interface SettingsTabDef {
  id: SettingsTab;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-settings-page',
  template: `
    <div class="settings-page content-shell">
      <header class="page-header glass-strong">
        <div class="header-left">
          <app-icon name="settings" [size]="24" class="header-icon" />
          <div>
            <h1>Settings &amp; Preferences</h1>
            <p class="subtitle">Reader, navigation, sources, sync &amp; library backup</p>
          </div>
        </div>
      </header>

      <!-- Tab bar -->
      <nav class="settings-tabs glass-strong">
        <button
          *ngFor="let tab of tabs"
          class="tab-btn"
          [class.active]="activeTab() === tab.id"
          (click)="activeTab.set(tab.id)"
          [id]="'tab-' + tab.id"
        >
          <app-icon [name]="tab.icon" [size]="17" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- ══ READER TAB ══════════════════════════════════════════════════════ -->
      @if (activeTab() === 'reader') {
        <section class="settings-section glass-strong">
          <h2><app-icon name="visibility" [size]="20" /> Reader &amp; Theme</h2>

          <div class="setting-group">
            <label>Active Theme</label>
            <div class="option-grid">
              <button (click)="setTheme('light')" [class.active]="reader().theme === 'light'">☀️ Light</button>
              <button (click)="setTheme('sepia')" [class.active]="reader().theme === 'sepia'">📜 Sepia</button>
              <button (click)="setTheme('dark')" [class.active]="reader().theme === 'dark'">🌙 Dark</button>
              <button (click)="setTheme('midnight')" [class.active]="reader().theme === 'midnight'">🌌 Midnight</button>
            </div>
          </div>

          <div class="setting-group">
            <label>Font Size: <strong>{{ reader().fontSize }}px</strong></label>
            <input type="range" min="12" max="32" [value]="reader().fontSize"
              (input)="setFontSize($any($event.target).valueAsNumber)" class="slider" />
          </div>

          <div class="setting-group">
            <label>Line Spacing: <strong>{{ reader().lineHeight }}</strong></label>
            <input type="range" min="1" max="3" step="0.1" [value]="reader().lineHeight"
              (input)="setLineHeight($any($event.target).valueAsNumber)" class="slider" />
          </div>

          <div class="setting-group">
            <label>Typography</label>
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
      }

      <!-- ══ NAVIGATION TAB ═══════════════════════════════════════════════════ -->
      @if (activeTab() === 'navigation') {
        <section class="settings-section glass-strong">
          <h2><app-icon name="gridView" [size]="20" /> Navigation &amp; Ergonomics</h2>

          <div class="setting-group">
            <label>Navbar Position</label>
            <div class="option-grid">
              <button (click)="setNavPosition('floating-bottom')" [class.active]="navigation().position === 'floating-bottom'">Floating Bottom Pill</button>
              <button (click)="setNavPosition('bottom')" [class.active]="navigation().position === 'bottom'">Bottom Bar</button>
              <button (click)="setNavPosition('floating-top')" [class.active]="navigation().position === 'floating-top'">Floating Top Pill</button>
              <button (click)="setNavPosition('top')" [class.active]="navigation().position === 'top'">Top Sub-Bar</button>
            </div>
          </div>

          <div class="setting-group">
            <label>Scroll Stickiness</label>
            <div class="option-grid">
              <button (click)="setNavStickiness('autohide')" [class.active]="navigation().stickiness === 'autohide'">Auto-Hide on Scroll</button>
              <button (click)="setNavStickiness('sticky')" [class.active]="navigation().stickiness === 'sticky'">Always Sticky</button>
              <button (click)="setNavStickiness('static')" [class.active]="navigation().stickiness === 'static'">Static Flow</button>
            </div>
          </div>

          <div class="setting-group">
            <label>One-Handed Mode</label>
            <div class="option-grid">
              <button (click)="setOneHandedMode('disabled')" [class.active]="navigation().oneHandedMode === 'disabled'">Disabled (Centered)</button>
              <button (click)="setOneHandedMode('right')" [class.active]="navigation().oneHandedMode === 'right'">Right-Handed Thumb</button>
              <button (click)="setOneHandedMode('left')" [class.active]="navigation().oneHandedMode === 'left'">Left-Handed Thumb</button>
            </div>
            <p class="hint">Shift navigation towards your preferred thumb &amp; activate quick-thumb radial speed dial.</p>
          </div>

          <div class="setting-group">
            <label>Mobile Visible Tab Limit</label>
            <div class="option-grid">
              <button (click)="setMaxMobileTabs(3)" [class.active]="navigation().maxVisibleMobileTabs === 3">3 Tabs</button>
              <button (click)="setMaxMobileTabs(4)" [class.active]="navigation().maxVisibleMobileTabs === 4">4 Tabs</button>
              <button (click)="setMaxMobileTabs(5)" [class.active]="navigation().maxVisibleMobileTabs === 5">5 Tabs</button>
            </div>
          </div>
        </section>
      }

      <!-- ══ SOURCES TAB ═══════════════════════════════════════════════════ -->
      @if (activeTab() === 'sources') {
        <section class="settings-section glass-strong">
          <div class="sources-header">
            <div>
              <h2><app-icon name="source" [size]="20" /> Content Sources</h2>
              <p class="sources-subtitle">
                Sources provide books for search and reading. <strong>Full-text sources</strong> deliver actual readable content.
                At least one source must always be active.
              </p>
            </div>
          </div>

          <!-- Source cards -->
          <div class="source-cards">
            @for (source of allSources(); track source.id) {
              <div
                class="source-card"
                [class.source-active]="isSourceActive(source.id)"
                [class.source-disabled]="!isSourceActive(source.id)"
              >
                <div class="source-card-main">
                  <div class="source-info">
                    <div class="source-name-row">
                      <span class="source-name">{{ source.name }}</span>
                      <div class="source-badges">
                        @if (source.providesFullText) {
                          <span class="badge badge-fulltext">Full Text</span>
                        } @else {
                          <span class="badge badge-meta">Metadata</span>
                        }
                        @if (source.stable) {
                          <span class="badge badge-stable">Direct API</span>
                        } @else {
                          <span class="badge badge-proxy">Needs Proxy</span>
                        }
                      </div>
                    </div>
                    <p class="source-desc">{{ getSourceDescription(source.id) }}</p>
                  </div>

                  <button
                    class="source-toggle"
                    [class.toggle-on]="isSourceActive(source.id)"
                    (click)="toggleSourceSetting(source.id)"
                    [attr.aria-label]="(isSourceActive(source.id) ? 'Disable ' : 'Enable ') + source.name"
                  >
                    @if (isSourceActive(source.id)) {
                      <app-icon name="check" [size]="16" />
                      <span>On</span>
                    } @else {
                      <span>Off</span>
                    }
                  </button>
                </div>
              </div>
            }
          </div>

          <p class="hint active-hint">
            <app-icon name="check" [size]="13" />
            {{ activeSourceCount() }} source{{ activeSourceCount() !== 1 ? 's' : '' }} active.
            Changes take effect immediately on the Search page.
          </p>
        </section>
      }

      <!-- ══ DATA TAB ══════════════════════════════════════════════════════ -->
      @if (activeTab() === 'data') {
        <section class="settings-section glass-strong">
          <h2><app-icon name="cloudSync" [size]="20" /> Library Backup &amp; Data</h2>

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
              <app-icon name="delete" [size]="18" /> Reset &amp; Clear All Data
            </button>
            <p class="hint">Permanently deletes all library entries, history, bookmarks &amp; settings.</p>
          </div>
        </section>
      }

      <!-- ══ ADVANCED TAB ══════════════════════════════════════════════════ -->
      @if (activeTab() === 'advanced') {
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
      }
    </div>
  `,
  styles: [`
    .settings-page {
      padding-top: 1.25rem;
      padding-bottom: 3rem;
    }

    /* ── Header ───────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-large);
      margin-bottom: 1rem;
    }
    .header-left { display: flex; align-items: center; gap: 0.75rem; }
    .header-icon { color: var(--md-sys-color-primary); }
    h1 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .subtitle { font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); margin: 0; }

    /* ── Tab bar ──────────────────────────────────────────── */
    .settings-tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.4rem;
      border-radius: var(--radius-large);
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      flex: 1;
      min-width: 80px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.55rem 0.9rem;
      border: 1px solid transparent;
      border-radius: var(--radius-medium);
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover { background: var(--glass-bg); color: var(--md-sys-color-on-surface); }
    .tab-btn.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 2px 12px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    }

    /* ── Section ──────────────────────────────────────────── */
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

    /* ── Setting groups ───────────────────────────────────── */
    .setting-group { margin-bottom: 1.25rem; }
    .setting-group:last-child { margin-bottom: 0; }
    .setting-group label {
      display: block;
      font-size: 0.85rem;
      margin-bottom: 0.4rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .setting-group input[type="text"],
    .setting-group select {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-medium);
      background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
      color: var(--md-sys-color-on-surface);
      font-size: 0.85rem;
      box-sizing: border-box;
    }
    .slider { width: 100%; accent-color: var(--md-sys-color-primary); }

    /* ── Option grid buttons ──────────────────────────────── */
    .option-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .option-grid button {
      flex: 1;
      min-width: 120px;
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
    .option-grid button.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }

    /* ── Checkbox ─────────────────────────────────────────── */
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .checkbox-label input { accent-color: var(--md-sys-color-primary); width: 16px; height: 16px; }

    /* ── Buttons ──────────────────────────────────────────── */
    .buttons-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
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

    /* ── Hints / status ───────────────────────────────────── */
    .hint {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 0.35rem;
    }
    .status-msg { font-size: 0.78rem; color: var(--md-sys-color-primary); margin-top: 0.35rem; }

    /* ── Sources tab ──────────────────────────────────────── */
    .sources-header { margin-bottom: 1.25rem; }
    .sources-header h2 { margin-bottom: 0.3rem; }
    .sources-subtitle {
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.5;
      margin: 0;
    }

    .source-cards { display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1rem; }

    .source-card {
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-medium);
      padding: 0.9rem 1rem;
      background: var(--glass-bg);
      transition: all 0.22s;
    }
    .source-card.source-active {
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 50%, var(--glass-border));
      background: color-mix(in srgb, var(--md-sys-color-primary) 6%, var(--glass-bg));
    }
    .source-card.source-disabled { opacity: 0.65; }

    .source-card-main {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      justify-content: space-between;
    }

    .source-info { flex: 1; min-width: 0; }
    .source-name-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-bottom: 0.3rem;
    }
    .source-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface);
    }
    .source-badges { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 100px;
      letter-spacing: 0.03em;
    }
    .badge-fulltext {
      background: color-mix(in srgb, #22c55e 18%, transparent);
      color: #16a34a;
      border: 1px solid #86efac;
    }
    .badge-meta {
      background: color-mix(in srgb, #f59e0b 15%, transparent);
      color: #b45309;
      border: 1px solid #fcd34d;
    }
    .badge-stable {
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      color: var(--md-sys-color-primary);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    }
    .badge-proxy {
      background: color-mix(in srgb, #ef4444 12%, transparent);
      color: #dc2626;
      border: 1px solid #fca5a5;
    }
    .source-desc {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
      line-height: 1.45;
    }

    /* Toggle button */
    .source-toggle {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.4rem 0.85rem;
      border-radius: 100px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      border: 1.5px solid var(--glass-border);
      background: var(--glass-bg);
      color: var(--md-sys-color-on-surface-variant);
      transition: all 0.2s;
    }
    .source-toggle.toggle-on {
      background: var(--md-sys-color-primary);
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .source-toggle:hover { filter: brightness(1.08); }

    .active-hint {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .tab-btn span { display: none; }
      .tab-btn { min-width: 44px; padding: 0.55rem; }
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, DateAgoPipe],
})
export class SettingsPageComponent {
  readonly reader = computed(() => this.settings.settings().reader);
  readonly navigation = computed(() => this.settings.settings().navigation || {
    position: 'floating-bottom' as const,
    stickiness: 'autohide' as const,
    oneHandedMode: 'disabled' as const,
    maxVisibleMobileTabs: 4,
  });
  readonly syncEnabled = computed(() => this.settings.settings().syncEnabled);
  readonly lastSync = computed(() => this.settings.settings().lastSyncAt);
  readonly backendProxyEnabled = computed(() => !!this.settings.settings().backendProxyEnabled);

  clientIdInput = '';
  backendUrlInput = 'http://localhost:5000';
  backendStatus = signal('Checking proxy server status…');

  activeTab = signal<SettingsTab>('reader');

  readonly tabs: SettingsTabDef[] = [
    { id: 'reader',     label: 'Reader',     icon: 'visibility' },
    { id: 'navigation', label: 'Navigation', icon: 'gridView'   },
    { id: 'sources',    label: 'Sources',    icon: 'source'     },
    { id: 'data',       label: 'Data',       icon: 'cloudSync'  },
    { id: 'advanced',   label: 'Advanced',   icon: 'settings'   },
  ];

  // Sources tab
  readonly allSources = computed(() => this.coordinator.sources());
  readonly activeSourceIds = computed(() => this.coordinator.activeSourceIds());
  readonly activeSourceCount = computed(() => this.coordinator.activeSourceIds().size);

  private readonly sourceDescriptions: Record<string, string> = {
    gutendex:      'Project Gutenberg\'s JSON API. Provides plain text & HTML for 70,000+ public-domain books. No key needed, works directly from the browser.',
    wikisource:    'English Wikisource MediaWiki API. Delivers fully-structured HTML of classic literature pages and sub-chapters. No key needed.',
    openlibrary:   'Open Library metadata catalog. Good for book discovery and cover art — does not provide chapter text directly.',
    jikan:         'MyAnimeList light-novel metadata via the Jikan API. Useful for Japanese light-novel titles and cover art.',
    royalroad:     'Royal Road original web fiction. Requires local proxy server for CORS bypass.',
    novelupdates:  'NovelUpdates translated light-novel database. Requires local proxy server.',
    scribblehub:   'Scribble Hub original fiction. Requires local proxy server.',
    wuxiaworld:    'WuxiaWorld translated Chinese web novels. Requires local proxy server.',
    boxnovel:      'BoxNovel translated web novels. Requires local proxy server.',
    lightnovelworld: 'LightNovelWorld translated fiction. Requires local proxy server.',
    novelfull:     'NovelFull translated fiction. Requires local proxy server.',
    webnovel:      'WebNovel (QiDian International) commercial platform. Requires local proxy server.',
  };

  constructor(
    private settings: SettingsService,
    private auth: AuthStateService,
    private syncEngine: SyncEngineService,
    private db: DatabaseService,
    private coordinator: SearchCoordinatorService,
  ) {
    this.clientIdInput = this.settings.settings().googleClientId ?? '';
    this.backendUrlInput = this.settings.settings().backendProxyUrl ?? 'http://localhost:5000';

    if (this.backendProxyEnabled()) {
      this.checkBackendHealth();
    }
  }

  // ── Sources tab ────────────────────────────────────────────────────────────

  isSourceActive(id: string): boolean {
    return this.activeSourceIds().has(id);
  }

  getSourceDescription(id: string): string {
    return this.sourceDescriptions[id] ?? 'No description available.';
  }

  async toggleSourceSetting(id: string): Promise<void> {
    const current = Array.from(this.activeSourceIds());
    let next: string[];

    if (current.includes(id)) {
      // Prevent disabling the last active source
      if (current.length <= 1) return;
      next = current.filter(s => s !== id);
    } else {
      next = [...current, id];
    }

    await this.coordinator.setEnabledSources(next);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async setNavPosition(position: NavigationSettings['position']) {
    await this.settings.updateNavigation({ position });
  }
  async setNavStickiness(stickiness: NavigationSettings['stickiness']) {
    await this.settings.updateNavigation({ stickiness });
  }
  async setOneHandedMode(oneHandedMode: NavigationSettings['oneHandedMode']) {
    await this.settings.updateNavigation({ oneHandedMode });
  }
  async setMaxMobileTabs(maxVisibleMobileTabs: number) {
    await this.settings.updateNavigation({ maxVisibleMobileTabs });
  }

  // ── Proxy ──────────────────────────────────────────────────────────────────

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

  // ── Reader ─────────────────────────────────────────────────────────────────

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

  // ── Data ───────────────────────────────────────────────────────────────────

  async exportData() {
    const data = await this.db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
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