import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NovelSearchResult } from '../../../../models';
import { CoverImageComponent } from '../../../../shared/components/cover-image/cover-image.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-search-result-card',
  template: `
    <div class="result-card">
      <a [routerLink]="['/novel', novelId]" class="card-link">
        <app-cover-image [src]="result.coverUrl" [alt]="result.title" [aspectRatio]="'3/4'" />
        <div class="result-info">
          <h3>{{ result.title }}</h3>
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
          <app-icon name="check" size="18" />
        } @else {
          <app-icon name="addCircle" size="18" />
        }
      </button>
    </div>
  `,
  styles: [`
    .result-card {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.75rem;
      border-radius: 0.75rem;
      background: var(--md-sys-color-surface);
      box-shadow: var(--md-sys-elevation-1);
    }
    .card-link {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      text-decoration: none;
      color: inherit;
    }
    app-cover-image { width: 48px; min-width: 48px; }
    .result-info { flex: 1; min-width: 0; }
    h3 { font-size: 0.95rem; font-weight: 600; margin: 0 0 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .author { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); margin: 0 0 0.25rem; }
    .description { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 0.4rem;
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: all 0.2s;
    }
    .add-btn:hover { background: color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent); color: var(--md-sys-color-primary); }
    .add-btn.added { background: color-mix(in srgb, var(--md-sys-color-secondary) 15%, transparent); color: var(--md-sys-color-secondary); }
    .add-btn:disabled { cursor: default; opacity: 0.6; }
  `],
  standalone: true,
  imports: [CommonModule, CoverImageComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultCardComponent {
  @Input() result!: NovelSearchResult;
  @Input() inLibrary = false;
  @Output() addToLibrary = new EventEmitter<NovelSearchResult>();

  get novelId(): string {
    return `novel:${this.result.sourceId}:${this.result.id}`;
  }

  add() {
    this.addToLibrary.emit(this.result);
  }
}
