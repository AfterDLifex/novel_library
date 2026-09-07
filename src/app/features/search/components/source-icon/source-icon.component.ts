import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-source-icon',
  template: `
    <span class="source-icon" [attr.aria-label]="sourceName" [title]="sourceName">
      <svg [attr.viewBox]="'0 0 24 24'" [attr.width]="size" [attr.height]="size" fill="currentColor" aria-hidden="true">
        <path [attr.d]="iconPath" />
      </svg>
      @if (showLabel) {
        <span class="source-label">{{ sourceName }}</span>
      }
    </span>
  `,
  styles: [`
    .source-icon {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .source-label {
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  `],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceIconComponent {
  @Input() sourceId!: string;
  @Input() sourceName = '';
  @Input() size = 16;
  @Input() showLabel = false;

  protected get iconPath(): string {
    const icons: Record<string, string> = {
      // Open Library - open book / stack
      openlibrary: 'M12 3l9 4-9 4-9-4 9-4zm-9 7l9 4 9-4v5l-9 4-9-4v-5zm9 8l9-4v5l-9 4-9-4v-5l9 4z',
      // NovelUpdates - book with star
      novelupdates: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
      // Royal Road - crown/road
      royalroad: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z',
      // Scribble Hub - pen/scribble
      scribblehub: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
      // WuxiaWorld - dragon/mountain
      wuxiaworld: 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z',
      // BoxNovel - box/book
      boxnovel: 'M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9v-2h4V5h2v4h4v2z',
      // LightNovelWorld - sun/light
      lightnovelworld: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z',
      // NovelFull - open book
      novelfull: 'M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z',
      // WebNovel - globe/web
      webnovel: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
      // Default - generic source
      default: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    };
    return icons[this.sourceId] || icons['default'];
  }
}
