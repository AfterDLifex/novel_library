import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NovelSearchResult } from '../../../../models';
import { CoverImageComponent } from '../../../../shared/components/cover-image/cover-image.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SourceBadgeComponent } from '../source-badge/source-badge.component';

@Component({
  selector: 'app-search-result-card',
  template: `
    <div class="result-card">
      <a [routerLink]="['/novel', novelId]" class="card-link">
        <app-cover-image [src]="result.coverUrl" [alt]="result.title" [aspectRatio]="'3/4'" />
        <div class="result-info">
          <div class="title-row">
            <h3>{{ result.title }}</h3>
            <app-source-badge [sourceId]="result.sourceId" [sourceName]="sourceName" />
          </div>
          @if (result.author) {
            <p class="author">{{ result.author }}</p>
          }
          @if (result.description) {
            <p class="description">{{ result.description }}</p>
          }
        </div>
      </a>
      <button
        class="add-btn"
        [class.added]="inLibrary"
        (click)="add()"
        [disabled]="inLibrary"
        aria-label="Add to library"
      >
        @if (inLibrary) {
          <app-icon name="check" [size]="18" />
        } @else {
          <app-icon name="addCircle" [size]="18" />
        }
      </button>
    </div>
  `,
  styles: [`
    .result-card {
      display: flex;
      gap: 0.85rem;
      align-items: stretch;
      padding: 0.9rem;
      border-radius: var(--radius-medium, 0.75rem);
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      transition: box-shadow 0.2s, transform 0.2s var(--ease-out), border-color 0.2s;
    }
    .result-card:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--glass-border));
    }
    .card-link {
      display: flex;
      gap: 0.85rem;
      flex: 1;
      min-width: 0;
      text-decoration: none;
      color: inherit;
    }
    app-cover-image { width: 64px; min-width: 64px; border-radius: 0.5rem; overflow: hidden; }
    .result-info { flex: 1; min-width: 0; }
    .title-row {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0 0 0.15rem;
      line-height: 1.3;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      flex: 1;
      min-width: 0;
      color: var(--md-sys-color-on-surface);
    }
    .author { font-size: 0.78rem; color: var(--md-sys-color-primary); margin: 0 0 0.3rem; font-weight: 500; }
    .description { font-size: 0.75rem; line-height: 1.45; color: var(--md-sys-color-on-surface-variant); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .add-btn {
      align-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 50%;
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .add-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent); color: var(--md-sys-color-primary); transform: scale(1.05); }
    .add-btn.added { background: color-mix(in srgb, var(--md-sys-color-secondary) 15%, transparent); color: var(--md-sys-color-secondary); }
    .add-btn:disabled { cursor: default; opacity: 0.6; }
  `],
  standalone: true,
  imports: [CommonModule, RouterLink, CoverImageComponent, IconComponent, SourceBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultCardComponent {
  @Input() result!: NovelSearchResult;
  @Input() inLibrary = false;
  @Input() sourceName = '';
  @Output() addToLibrary = new EventEmitter<NovelSearchResult>();

  get novelId(): string {
    return `novel:${this.result.sourceId}:${this.result.id}`;
  }

  add() {
    this.addToLibrary.emit(this.result);
  }
}
