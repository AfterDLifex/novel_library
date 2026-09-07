import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

interface NavItem {
  label: string;
  icon: string;
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
        <app-icon [name]="item.icon" size="22" />
        <span>{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 56px;
      background: var(--md-sys-color-surface);
      border-top: 1px solid var(--md-sys-color-outline-variant);
      position: sticky;
      bottom: 0;
      z-index: 100;
      padding: env(safe-area-inset-bottom, 0);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex: 1;
      height: 56px;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      font-size: 0.7rem;
      transition: color 0.2s ease;
    }
    .nav-item:hover { color: var(--md-sys-color-primary); }
    .nav-item.active { color: var(--md-sys-color-primary); }
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
