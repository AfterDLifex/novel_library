import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

interface NavItem {
  label: string;
  icon: IconName;
  path: string;
}

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="navigation-bar glass-strong">
      <div class="nav-container">
        <a
          *ngFor="let item of navItems"
          [routerLink]="[item.path]"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
        >
          <div class="icon-wrapper">
            <app-icon [name]="item.icon" [size]="20" />
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .navigation-bar {
      position: sticky;
      bottom: 0;
      z-index: 100;
      width: 100%;
      border-top: 1px solid var(--glass-border);
      padding-bottom: env(safe-area-inset-bottom, 0);
      transition: background 0.3s ease;
    }

    .nav-container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      max-width: var(--content-max, 1200px);
      margin: 0 auto;
      height: 62px;
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
      font-size: 0.7rem;
      font-weight: 500;
      transition: color 0.22s var(--ease-out);
    }

    .icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
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

    @media (min-width: 768px) {
      .nav-container {
        justify-content: center;
        gap: 1.5rem;
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
  `],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    { label: 'Home', icon: 'home', path: 'home' },
    { label: 'Search', icon: 'search', path: 'search' },
    { label: 'Library', icon: 'library', path: 'library' },
    { label: 'Bookmarks', icon: 'bookmarks', path: 'bookmarks' },
    { label: 'History', icon: 'history', path: 'history' },
    { label: 'Collections', icon: 'collections', path: 'collections' },
    { label: 'Settings', icon: 'settings', path: 'settings' },
  ];
}
