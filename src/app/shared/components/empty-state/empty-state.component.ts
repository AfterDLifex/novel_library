import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <app-icon [name]="icon" [size]="48"></app-icon>
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
      gap: 0.75rem;
      padding: 2rem 1rem;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    .empty h3 { font-size: 1.1rem; margin: 0; color: var(--md-sys-color-on-surface); }
    .empty p { font-size: 0.875rem; margin: 0; max-width: 280px; }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent],
})
export class EmptyStateComponent {
  @Input() icon: IconName = 'library';
  @Input() title: string = 'Nothing here yet';
  @Input() message: string = '';
}
