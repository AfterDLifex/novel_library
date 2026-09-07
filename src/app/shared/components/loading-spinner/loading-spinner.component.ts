import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <svg class="spinner" viewBox="0 0 50 50" aria-label="Loading" role="progressbar">
      <circle
        class="spinner-track"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        opacity="0.2"
      />
      <circle
        class="spinner-indicator"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray="80, 125"
      />
    </svg>
  `,
  styles: [`
    .spinner {
      width: 2rem;
      height: 2rem;
      color: var(--spinner-color, #1976d2);
      animation: rotate 1.4s linear infinite;
    }
    .spinner-indicator {
      transform-origin: center;
      animation: dash 1.4s ease-in-out infinite;
    }
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
    @keyframes dash {
      0% { stroke-dashoffset: 0; }
      50% { stroke-dashoffset: -60; }
      100% { stroke-dashoffset: -125; }
    }
  `],
  standalone: true,
})
export class LoadingSpinnerComponent {}
