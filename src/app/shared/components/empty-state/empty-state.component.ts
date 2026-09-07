import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <div class="icon-wrap">
        <app-icon [name]="icon" [size]="38"></app-icon>
      </div>
      <h3>{{ title }}</h3>
      @if (message) {
        <p>{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    .icon-wrap {
      width: 76px;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      color: var(--md-sys-color-primary);
    }
    .empty h3 { font-size: 1.1rem; margin: 0; color: var(--md-sys-color-on-surface); }
    .empty p { font-size: 0.875rem; margin: 0; max-width: 300px; line-height: 1.5; }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent],
})
export class EmptyStateComponent {
  @Input() icon: IconName = 'library';
  @Input() title: string = 'Nothing here yet';
  @Input() message: string = '';
}
