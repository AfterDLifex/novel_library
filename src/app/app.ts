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
      <div class="bg-orbs" aria-hidden="true"><i></i><i></i><i></i></div>
      <header class="app-header">
        <h1 class="brand">
          <app-icon name="book" [size]="22" class="brand-icon" />
          <span>Novel Library</span>
        </h1>
        <div class="header-actions">
          @if (auth.authenticated()) {
            <button class="icon-btn sync-btn" (click)="sync()" [disabled]="syncing()" title="Sync">
              <app-icon name="cloudSync" [size]="20" />
            </button>
          }
          <button class="icon-btn theme-btn" (click)="toggleTheme()" aria-label="Toggle theme" title="Switch theme">
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
      position: relative;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at 18% 8%, color-mix(in srgb, var(--md-sys-color-primary-container) 35%, transparent) 0%, transparent 60%),
        radial-gradient(circle at 86% 28%, color-mix(in srgb, var(--md-sys-color-secondary-container) 30%, transparent) 0%, transparent 62%),
        radial-gradient(circle at 50% 96%, color-mix(in srgb, var(--md-sys-color-tertiary-container) 26%, transparent) 0%, transparent 68%),
        var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    /* Decorative blurred orbs drifting behind the frosted surfaces */
    .bg-orbs {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .bg-orbs i {
      position: absolute;
      border-radius: 50%;
      filter: blur(64px);
      will-change: transform;
      animation: orb-drift 26s ease-in-out infinite alternate;
    }
    .bg-orbs i:nth-child(1) { width: 340px; height: 340px; left: -70px; top: -50px; background: color-mix(in srgb, var(--md-sys-color-primary) 34%, transparent); }
    .bg-orbs i:nth-child(2) { width: 300px; height: 300px; right: -60px; top: 12%; background: color-mix(in srgb, var(--md-sys-color-tertiary) 28%, transparent); animation-delay: -8s; }
    .bg-orbs i:nth-child(3) { width: 360px; height: 360px; left: 30%; bottom: -80px; background: color-mix(in srgb, var(--md-sys-color-secondary) 26%, transparent); animation-delay: -16s; }
    @keyframes orb-drift {
      from { transform: translate(0, 0) scale(1); }
      50%  { transform: translate(90px, 60px) scale(1.15); }
      to   { transform: translate(-60px, 110px) scale(0.95); }
    }
    .app-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.25rem;
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--glass-bg-strong);
      backdrop-filter: blur(var(--glass-blur-strong)) saturate(1.5);
      -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(1.5);
      border-bottom: 1px solid var(--glass-border);
      box-shadow: 0 1px 0 var(--glass-border), 0 14px 30px rgba(0, 0, 0, 0.08);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 1.22rem;
      font-weight: 650;
      letter-spacing: -0.01em;
      margin: 0;
      color: var(--md-sys-color-on-background);
    }
    .brand-icon { color: var(--md-sys-color-primary); }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .icon-btn {
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--glass-bg) 60%, transparent);
      border: 1px solid var(--glass-border);
      cursor: pointer;
      border-radius: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s var(--ease-out);
    }
    .icon-btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
      color: var(--md-sys-color-primary);
      transform: translateY(-1px);
    }
    .sync-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .app-main {
      flex: 1;
      position: relative;
      z-index: 1;
      overflow-y: auto;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    @media (max-width: 480px) {
      .app-header { padding: 0.7rem 0.85rem; }
      .brand { font-size: 1.08rem; }
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

