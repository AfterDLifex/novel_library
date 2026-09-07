import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cover-image',
  template: `
    @if (src) {
      <img
        [src]="src"
        [attr.alt]="alt"
        [style.aspect-ratio]="aspectRatio"
        loading="lazy"
        (error)="onError()"
        class="cover"
      />
    } @else {
      <div class="placeholder" [style.aspect-ratio]="aspectRatio" [class.square]="square">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.2">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5C3.89 3 3 3.89 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.89 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
    }
  `,
  styles: [`
    .cover, .placeholder {
      width: 100%;
      object-fit: cover;
      border-radius: 0.5rem;
    }
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--md-sys-color-outline) 12%, transparent);
    }
    .cover {
      background: color-mix(in srgb, var(--md-sys-color-outline) 12%, transparent);
    }
  `],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverImageComponent {
  @Input() src: string | undefined = '';
  @Input() alt: string = '';
  @Input() aspectRatio: string = '2/3';
  @Input() square: boolean = false;

  onError() {
    this.src = ''; // Trigger placeholder
  }
}
