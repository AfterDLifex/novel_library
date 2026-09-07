import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { IconComponent } from './shared/components/icon/icon.component';
import { ThemeService } from './theme.service';
import { SettingsService } from './core/storage/settings.service';
import { SyncEngineService } from './core/sync/sync-engine.service';
import { AuthStateService } from './core/auth/auth-state.service';

@Component({
  selector: 'app-root',
  template: `
        <div class="app-container" [class.theme-dark]="isDark()">
      <header class="app-header">
        <h1>Novel Library</h1>
        <div class="header-actions">
          @if (auth.authenticated()) {
            <button class="sync-btn" (click)="sync()" [disabled]="syncing()">
              <app-icon name="cloudSync" [size]="20" />
            </button>
          }
          <button class="theme-btn" (click)="toggleTheme()" aria-label="Toggle theme">
                        <app-icon [name]="isDark() ? 'visibility' : 'settings'" [size]="20" />
          </button>
        </div>
      </header>

      <main class="app-main">
        <router-outlet />
      </main>

      <app-bottom-nav />
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--md-sys-color-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .app-header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .sync-btn, .theme-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 0.4rem;
      color: var(--md-sys-color-on-surface-variant);
      transition: background 0.2s;
    }
    .sync-btn:hover, .theme-btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
      color: var(--md-sys-color-primary);
    }
    .app-main {
      flex: 1;
      overflow-y: auto;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterOutlet, BottomNavComponent, IconComponent],
})
export class App {
  readonly syncing = computed(() => this.syncEngine.syncing());
  readonly isDark = computed(() => this.settings.settings().reader.theme === 'dark');

  constructor(
    private theme: ThemeService,
    private settings: SettingsService,
    private syncEngine: SyncEngineService,
    public auth: AuthStateService
  ) { }

  async toggleTheme() {
    const current = this.settings.settings().reader.theme;
    const next = current === 'dark' ? 'light' : current === 'light' ? 'sepia' : 'dark';
    await this.theme.setTheme(next);
  }

  sync() {
    if (this.auth.authenticated()) {
      this.syncEngine.sync();
    }
  }
}

