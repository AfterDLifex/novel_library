import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  template: `
    @if (message) {
      <div class="error-container">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <span>{{ message }}</span>
      </div>
    }
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent);
      color: var(--md-sys-color-on-error-container, #b00020);
      border-radius: 0.75rem;
      font-size: 0.875rem;
      margin: 1rem 0;
    }
  `],
  standalone: true,
  imports: [CommonModule],
})
export class ErrorMessageComponent {
  @Input() message: string | null = null;
}
