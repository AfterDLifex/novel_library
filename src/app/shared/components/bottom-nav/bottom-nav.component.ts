import { Component, ChangeDetectionStrategy, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';
import { SettingsService } from '../../../core/storage/settings.service';
import { NavigationSettings } from '../../../models';

interface NavItem {
  label: string;
  icon: IconName;
  path: string;
  desc?: string;
}

@Component({
  selector: 'app-bottom-nav',
  template: `
    <!-- Navigation Bar Container -->
    <nav
      class="navigation-bar glass-strong"
      [ngClass]="[
        'pos-' + navSettings().position,
        'stickiness-' + navSettings().stickiness,
        navSettings().oneHandedMode !== 'disabled' ? 'hand-' + navSettings().oneHandedMode : '',
        hiddenOnScroll() && navSettings().stickiness === 'autohide' ? 'nav-hidden' : ''
      ]"
    >
      <div class="nav-container">
        <!-- Desktop / Wide Viewport Items (All 7) -->
        <ng-container *ngFor="let item of allNavItems">
          <a
            [routerLink]="[item.path]"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item desktop-only"
          >
            <div class="icon-wrapper">
              <app-icon [name]="item.icon" [size]="20" />
            </div>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </ng-container>

        <!-- Mobile / Compact Viewport Items (Primary visible items) -->
        <ng-container *ngFor="let item of visibleMobileNavItems()">
          <a
            [routerLink]="[item.path]"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item mobile-only"
            (click)="closeOverflow()"
          >
            <div class="icon-wrapper">
              <app-icon [name]="item.icon" [size]="20" />
            </div>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </ng-container>

        <!-- Mobile "More" Tab button if there are overflow items -->
        <button
          *ngIf="hasOverflowItems()"
          type="button"
          class="nav-item mobile-only overflow-toggle-btn"
          [class.active]="overflowOpen()"
          (click)="toggleOverflow()"
          aria-label="More navigation options"
        >
          <div class="icon-wrapper">
            <app-icon [name]="overflowOpen() ? 'close' : 'moreHorizontal'" [size]="20" />
          </div>
          <span class="nav-label">More</span>
        </button>
      </div>
    </nav>

    <!-- Mobile Overflow Drawer Sheet -->
    <div
      *ngIf="overflowOpen()"
      class="overflow-backdrop"
      (click)="closeOverflow()"
    >
      <div class="overflow-sheet glass-strong" (click)="$event.stopPropagation()">
        <div class="sheet-header">
          <div class="sheet-handle"></div>
          <div class="sheet-title-row">
            <h3>Quick Navigation</h3>
            <button class="sheet-close-btn" (click)="closeOverflow()">
              <app-icon name="close" [size]="18" />
            </button>
          </div>
        </div>

        <div class="sheet-grid">
          <a
            *ngFor="let item of overflowNavItems()"
            [routerLink]="[item.path]"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="sheet-card glass"
            (click)="closeOverflow()"
          >
            <div class="card-icon">
              <app-icon [name]="item.icon" [size]="24" />
            </div>
            <div class="card-info">
              <span class="card-title">{{ item.label }}</span>
              <span class="card-desc">{{ item.desc }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- One-Handed Quick Thumb Speed Dial Button -->
    <div
      *ngIf="navSettings().oneHandedMode !== 'disabled'"
      class="thumb-dial-container"
      [class.thumb-right]="navSettings().oneHandedMode === 'right'"
      [class.thumb-left]="navSettings().oneHandedMode === 'left'"
    >
      <!-- Speed Dial Arc Options -->
      <div class="thumb-menu glass-strong" [class.open]="thumbMenuOpen()">
        <a
          *ngFor="let item of allNavItems"
          [routerLink]="[item.path]"
          routerLinkActive="active"
          class="thumb-item"
          [title]="item.label"
          (click)="thumbMenuOpen.set(false)"
        >
          <app-icon [name]="item.icon" [size]="20" />
          <span class="thumb-label">{{ item.label }}</span>
        </a>
      </div>

      <!-- Trigger Dial Button -->
      <button
        type="button"
        class="thumb-trigger-btn glass-strong lift"
        (click)="toggleThumbMenu()"
        [title]="'One-Handed Speed Dial (' + navSettings().oneHandedMode + ')'"
      >
        <app-icon [name]="thumbMenuOpen() ? 'close' : 'gridView'" [size]="22" />
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      z-index: 100;
    }

    .navigation-bar {
      width: 100%;
      z-index: 100;
      border-top: 1px solid var(--glass-border);
      padding-bottom: env(safe-area-inset-bottom, 0);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, box-shadow 0.3s ease;
    }

    /* Position Variants */
    .pos-bottom {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
    }
    
    .pos-top {
      position: sticky;
      top: 60px;
      left: 0;
      right: 0;
      border-top: none;
      border-bottom: 1px solid var(--glass-border);
    }

    .pos-floating-bottom {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 2rem);
      max-width: 900px;
      border-radius: 2rem;
      border: 1px solid var(--glass-border);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
    }
    .pos-floating-bottom.nav-hidden {
      transform: translate(-50%, calc(100% + 2rem));
    }

    .pos-floating-top {
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 2rem);
      max-width: 900px;
      border-radius: 2rem;
      border: 1px solid var(--glass-border);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
    }
    .pos-floating-top.nav-hidden {
      transform: translate(-50%, -160%);
    }

    .pos-bottom.nav-hidden {
      transform: translateY(105%);
    }
    .pos-top.nav-hidden {
      transform: translateY(-105%);
    }

    /* Stickiness: static */
    .stickiness-static {
      position: relative !important;
      transform: none !important;
    }

    /* One-handed alignments */
    .hand-right .nav-container {
      justify-content: flex-end;
      gap: 0.25rem;
      padding-right: 1.25rem;
    }
    .hand-left .nav-container {
      justify-content: flex-start;
      gap: 0.25rem;
      padding-left: 1.25rem;
    }

    .nav-container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      max-width: var(--content-max, 1200px);
      margin: 0 auto;
      height: 60px;
      padding: 0 0.5rem;
    }

    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      flex: 1;
      height: 100%;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      font-size: 0.72rem;
      font-weight: 500;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.22s var(--ease-out);
    }

    .icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 28px;
      border-radius: 14px;
      transition: transform 0.25s var(--ease-out), background 0.25s ease;
    }

    .nav-item:hover .icon-wrapper {
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      color: var(--md-sys-color-primary);
      transform: translateY(-1px);
    }

    .nav-item.active {
      color: var(--md-sys-color-primary);
      font-weight: 650;
    }

    .nav-item.active .icon-wrapper {
      background: color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
      color: var(--md-sys-color-primary);
    }

    .nav-label {
      white-space: nowrap;
      letter-spacing: -0.01em;
    }

    /* Responsive visibility */
    .desktop-only { display: none; }
    .mobile-only { display: flex; }

    @media (min-width: 768px) {
      .desktop-only { display: flex; }
      .mobile-only { display: none !important; }

      .nav-container {
        justify-content: center;
        gap: 1.25rem;
      }

      .nav-item {
        flex: initial;
        flex-direction: row;
        gap: 0.5rem;
        padding: 0 1.25rem;
        border-radius: 1.5rem;
        height: 42px;
      }
      .nav-label { font-size: 0.85rem; }
    }

    /* Mobile Overflow Drawer Sheet */
    .overflow-backdrop {
      position: fixed;
      inset: 0;
      z-index: 105;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-end;
      animation: fadeIn 0.22s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .overflow-sheet {
      width: 100%;
      max-height: 75dvh;
      border-radius: 1.5rem 1.5rem 0 0;
      border-top: 1px solid var(--glass-border);
      padding: 1rem 1.25rem 2rem;
      overflow-y: auto;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .sheet-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }

    .sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--md-sys-color-outline-variant, rgba(150, 150, 150, 0.4));
      margin-bottom: 0.75rem;
    }

    .sheet-title-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sheet-title-row h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0;
    }

    .sheet-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .sheet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .sheet-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
      border-radius: 1rem;
      text-decoration: none;
      color: var(--md-sys-color-on-surface);
      border: 1px solid var(--glass-border);
      transition: all 0.2s ease;
    }

    .sheet-card.active {
      background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
    }

    .sheet-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    .card-icon {
      color: var(--md-sys-color-primary);
    }
    .card-info {
      display: flex;
      flex-direction: column;
    }
    .card-title {
      font-weight: 650;
      font-size: 0.85rem;
    }
    .card-desc {
      font-size: 0.7rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    /* One-Handed Quick Thumb Dial Button */
    .thumb-dial-container {
      position: fixed;
      bottom: 5.25rem;
      z-index: 104;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .thumb-right { right: 1.25rem; }
    .thumb-left { left: 1.25rem; }

    .thumb-trigger-btn {
      width: 48px;
      height: 48px;
      border-radius: 24px;
      border: 1px solid var(--glass-border);
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.22s var(--ease-out);
    }

    .thumb-trigger-btn:hover {
      transform: scale(1.08);
    }

    .thumb-menu {
      position: absolute;
      bottom: 60px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.6rem;
      border-radius: 1.25rem;
      border: 1px solid var(--glass-border);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
      opacity: 0;
      pointer-events: none;
      transform: translateY(15px) scale(0.9);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .thumb-right .thumb-menu { right: 0; }
    .thumb-left .thumb-menu { left: 0; }

    .thumb-menu.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .thumb-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.85rem;
      border-radius: 0.85rem;
      color: var(--md-sys-color-on-surface);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
      transition: background 0.2s ease;
    }

    .thumb-item:hover, .thumb-item.active {
      background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
      color: var(--md-sys-color-primary);
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  readonly navSettings = computed(() => this.settings.settings().navigation || {
    position: 'floating-bottom',
    stickiness: 'autohide',
    oneHandedMode: 'disabled',
    maxVisibleMobileTabs: 4,
  });

  overflowOpen = signal(false);
  thumbMenuOpen = signal(false);
  hiddenOnScroll = signal(false);

  private lastScrollY = 0;

  readonly allNavItems: NavItem[] = [
    { label: 'Home', icon: 'home', path: 'home', desc: 'Featured & Latest' },
    { label: 'Search', icon: 'search', path: 'search', desc: 'Browse Novels' },
    { label: 'Library', icon: 'library', path: 'library', desc: 'Saved Books' },
    { label: 'Bookmarks', icon: 'bookmarks', path: 'bookmarks', desc: 'Saved Chapters' },
    { label: 'History', icon: 'history', path: 'history', desc: 'Recent Reading' },
    { label: 'Collections', icon: 'collections', path: 'collections', desc: 'Custom Lists' },
    { label: 'Settings', icon: 'settings', path: 'settings', desc: 'App Preferences' },
  ];

  readonly visibleMobileNavItems = computed(() => {
    const limit = this.navSettings().maxVisibleMobileTabs || 4;
    // Leave room for "More" button if total items exceeds limit
    if (this.allNavItems.length > limit) {
      return this.allNavItems.slice(0, Math.max(1, limit - 1));
    }
    return this.allNavItems;
  });

  readonly overflowNavItems = computed(() => {
    const limit = this.navSettings().maxVisibleMobileTabs || 4;
    if (this.allNavItems.length > limit) {
      return this.allNavItems.slice(Math.max(1, limit - 1));
    }
    return [];
  });

  readonly hasOverflowItems = computed(() => this.overflowNavItems().length > 0);

  constructor(private settings: SettingsService) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.navSettings().stickiness !== 'autohide') {
      if (this.hiddenOnScroll()) this.hiddenOnScroll.set(false);
      return;
    }

    const currentY = window.scrollY || document.documentElement.scrollTop;
    if (currentY <= 30) {
      this.hiddenOnScroll.set(false);
    } else if (currentY > this.lastScrollY + 6 && currentY > 60) {
      // Scrolling down -> hide navbar
      this.hiddenOnScroll.set(true);
      if (this.overflowOpen()) this.overflowOpen.set(false);
      if (this.thumbMenuOpen()) this.thumbMenuOpen.set(false);
    } else if (currentY < this.lastScrollY - 6) {
      // Scrolling up -> show navbar
      this.hiddenOnScroll.set(false);
    }
    this.lastScrollY = currentY;
  }

  toggleOverflow() {
    this.overflowOpen.update((v) => !v);
  }

  closeOverflow() {
    this.overflowOpen.set(false);
  }

  toggleThumbMenu() {
    this.thumbMenuOpen.update((v) => !v);
  }
}
