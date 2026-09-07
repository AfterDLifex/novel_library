import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.component';

interface NavItem {
  label: string;
  icon: IconName;
  path: string;
}

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="bottom-nav">
      <a
        *ngFor="let item of navItems"
        [routerLink]="[item.path]"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="nav-item"
      >
        <app-icon [name]="item.icon" [size]="22" />
        <span>{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 60px;
      position: sticky;
      bottom: 0;
      z-index: 100;
      background: var(--glass-bg-strong);
      backdrop-filter: blur(var(--glass-blur-strong)) saturate(1.5);
      -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(1.5);
      border-top: 1px solid var(--glass-border);
      box-shadow: 0 1px 0 var(--glass-border), 0 -12px 24px rgba(0, 0, 0, 0.08);
      padding: env(safe-area-inset-bottom, 0);
    }
    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      flex: 1;
      height: 60px;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      font-size: 0.7rem;
      transition: color 0.2s ease;
    }
    .nav-item::before {
      content: '';
      position: absolute;
      top: 5px;
      left: 50%;
      width: 36px;
      height: 27px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
      transform: translateX(-50%) scale(0.5);
      opacity: 0;
      transition: transform 0.22s var(--ease-out), opacity 0.22s ease;
    }
    .nav-item:hover { color: var(--md-sys-color-primary); }
    .nav-item.active { color: var(--md-sys-color-primary); }
    .nav-item.active::before {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
    .nav-item.active app-icon { color: var(--md-sys-color-primary); }
    @media (max-width: 360px) {
      .bottom-nav { height: 56px; }
      .nav-item { height: 56px; font-size: 0.64rem; }
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
    { label: 'Settings', icon: 'settings', path: 'settings' },
  ];
}
