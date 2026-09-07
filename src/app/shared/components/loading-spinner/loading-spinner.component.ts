import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner" aria-label="Loading">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  `,
  styles: [`
    .spinner {
      display: inline-flex;
      gap: 0.3rem;
    }
    .dot {
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 50%;
      background: var(--spinner-color, #1976d2);
      animation: pulse 1.2s ease-in-out infinite both;
    }
    .dot:nth-child(2) { animation-delay: -0.2s; }
    .dot:nth-child(3) { animation-delay: -0.4s; }
    @keyframes pulse {
      0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
  `],
  standalone: true,
})
export class LoadingSpinnerComponent {}
