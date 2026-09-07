import { Component, computed } from '@angular/core';
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
    <div class="app-container" [class]="'theme-' + currentTheme()">
      <div class="bg-orbs" aria-hidden="true"><i></i><i></i><i></i></div>
      
      <header class="app-header glass-strong">
        <div class="header-inner content-shell">
          <h1 class="brand">
            <app-icon name="bookOpen" [size]="24" class="brand-icon" />
            <span>Novel Library</span>
          </h1>
          <div class="header-actions">
            @if (auth.authenticated()) {
              <button class="icon-btn sync-btn" (click)="sync()" [disabled]="syncing()" title="Sync Data">
                <app-icon name="cloudSync" [size]="20" />
              </button>
            }
            <button class="icon-btn theme-btn" (click)="toggleTheme()" aria-label="Toggle theme" [title]="'Current theme: ' + currentTheme()">
              <app-icon [name]="currentTheme() === 'dark' || currentTheme() === 'midnight' ? 'sun' : 'moon'" [size]="20" />
            </button>
          </div>
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
      transition: background-color 0.3s ease;
    }
    
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
      filter: blur(72px);
      will-change: transform;
      animation: orb-drift 28s ease-in-out infinite alternate;
    }
    .bg-orbs i:nth-child(1) { width: 380px; height: 380px; left: -80px; top: -60px; background: color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent); }
    .bg-orbs i:nth-child(2) { width: 340px; height: 340px; right: -70px; top: 15%; background: color-mix(in srgb, var(--md-sys-color-tertiary) 22%, transparent); animation-delay: -9s; }
    .bg-orbs i:nth-child(3) { width: 400px; height: 400px; left: 32%; bottom: -100px; background: color-mix(in srgb, var(--md-sys-color-secondary) 20%, transparent); animation-delay: -18s; }
    @keyframes orb-drift {
      from { transform: translate(0, 0) scale(1); }
      50%  { transform: translate(100px, 70px) scale(1.12); }
      to   { transform: translate(-70px, 120px) scale(0.92); }
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 90;
      border-bottom: 1px solid var(--glass-border);
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      color: var(--md-sys-color-on-background);
      background: linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-icon { color: var(--md-sys-color-primary); }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      cursor: pointer;
      border-radius: 0.85rem;
      color: var(--md-sys-color-on-surface-variant);
      transition: all 0.22s var(--ease-out);
    }

    .icon-btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent);
      color: var(--md-sys-color-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .sync-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .app-main {
      flex: 1;
      position: relative;
      z-index: 1;
      padding-bottom: 1rem;
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterOutlet, BottomNavComponent, IconComponent],
})
export class App {
  readonly syncing = computed(() => this.syncEngine.syncing());
  readonly currentTheme = computed(() => this.settings.settings().reader.theme || 'dark');

  constructor(
    private theme: ThemeService,
    private settings: SettingsService,
    private syncEngine: SyncEngineService,
    public auth: AuthStateService
  ) { }

  async toggleTheme() {
    const current = this.currentTheme();
    const next = current === 'dark' ? 'light' : current === 'light' ? 'sepia' : current === 'sepia' ? 'midnight' : 'dark';
    await this.theme.setTheme(next);
  }

  sync() {
    if (this.auth.authenticated()) {
      this.syncEngine.sync();
    }
  }
}
