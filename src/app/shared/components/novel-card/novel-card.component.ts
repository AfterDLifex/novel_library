import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryItem } from '../../../models';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { CoverImageComponent } from '../cover-image/cover-image.component';

@Component({
  selector: 'app-novel-card',
  template: `
    <a [routerLink]="['/novel', novel.novelId]" class="card">
      <app-cover-image [src]="novel.coverUrl" [alt]="novel.title" />
      <div class="info">
        <h3>{{ novel.title }}</h3>
        @if (novel.author) {
          <p class="author">{{ novel.author }}</p>
        }
        <div class="meta">
          <span class="status" [class]="'status-' + novel.status">{{ novel.status }}</span>
          @if (progressChapterNum) {
            <span class="progress">Ch. {{ progressChapterNum }} · {{ progressPercentNum }}%</span>
          }
        </div>
      </div>
      @if (novel.favorite) {
        <app-icon name="star" size="16" class="favorite-icon" />
      }
    </a>
  `,
  styles: [`
    .card {
      display: flex;
      gap: 0.5rem;
      text-decoration: none;
      color: inherit;
      padding: 0.5rem;
      border-radius: 0.75rem;
      background: var(--md-sys-color-surface);
      box-shadow: var(--md-sys-elevation-1, 0 1px 2px rgba(0,0,0,0.08));
      transition: box-shadow 0.2s ease;
      position: relative;
      height: 100%;
      align-items: center;
    }
    .card:hover { box-shadow: var(--md-sys-elevation-2, 0 2px 4px rgba(0,0,0,0.12)); }
    app-cover-image { width: 48px; min-width: 48px; }
    .info { flex: 1; min-width: 0; }
    h3 { font-size: 0.9rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .author { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
    .status { font-size: 0.65rem; padding: 0.125rem 0.4rem; border-radius: 0.375rem; font-weight: 600; }
    .status-reading { background: color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent); color: var(--md-sys-color-primary); }
    .status-completed { background: color-mix(in srgb, var(--md-sys-color-secondary) 15%, transparent); color: var(--md-sys-color-secondary); }
    .status-planned { background: color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent); color: var(--md-sys-color-on-surface-variant); }
    .status-dropped { background: color-mix(in srgb, var(--md-sys-color-error) 15%, transparent); color: var(--md-sys-color-error); }
    .progress { font-size: 0.65rem; color: var(--md-sys-color-on-surface-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .favorite-icon { position: absolute; top: 4px; right: 4px; color: #ffd43b; }
  `],
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, CoverImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovelCardComponent {
  @Input() novel!: LibraryItem;
  @Input() showProgress: boolean = true;
  @Input() progressChapterNum: number | null = null;
  @Input() progressPercentNum: number = 0;
}