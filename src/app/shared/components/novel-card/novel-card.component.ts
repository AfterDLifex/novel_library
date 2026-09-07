import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryItem } from '../../../models';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { CoverImageComponent } from '../cover-image/cover-image.component';

@Component({
  selector: 'app-novel-card',
  template: `
    <a [routerLink]="['/novel', novel.novelId]" class="card glass lift" [class.list-mode]="layout === 'list'">
      <div class="cover-wrapper">
        <app-cover-image [src]="novel.coverUrl" [alt]="novel.title" />
        @if (novel.favorite) {
          <div class="fav-badge">
            <app-icon name="star" [size]="14" />
          </div>
        }
      </div>

      <div class="info">
        <h3 [title]="novel.title">{{ novel.title }}</h3>
        @if (novel.author) {
          <p class="author">{{ novel.author }}</p>
        }
        
        <div class="meta">
          <span class="status-badge" [class]="'status-' + novel.status">{{ novel.status }}</span>
          @if (progressChapterNum) {
            <span class="progress-text">Ch. {{ progressChapterNum }}</span>
          }
        </div>

        @if (showProgress && progressPercentNum > 0) {
          <div class="progress-bar-container">
            <div class="progress-bar-fill" [style.width.%]="progressPercentNum"></div>
          </div>
        }
      </div>
    </a>
  `,
  styles: [`
    .card {
      display: flex;
      gap: 0.85rem;
      text-decoration: none;
      color: inherit;
      padding: 0.75rem;
      border-radius: var(--radius-medium);
      position: relative;
      align-items: center;
      height: 100%;
    }

    .cover-wrapper {
      position: relative;
      width: 56px;
      min-width: 56px;
      border-radius: var(--radius-small);
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    app-cover-image {
      width: 100%;
      display: block;
    }

    .fav-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      color: #ffd700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    h3 {
      font-size: 0.92rem;
      font-weight: 650;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--md-sys-color-on-surface);
    }

    .author {
      font-size: 0.76rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.2rem;
    }

    .status-badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-full);
      font-weight: 650;
      text-transform: capitalize;
    }

    .status-reading {
      background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
      color: var(--md-sys-color-primary);
    }
    .status-completed {
      background: color-mix(in srgb, #4caf50 18%, transparent);
      color: #4caf50;
    }
    .status-planned {
      background: color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent);
      color: var(--md-sys-color-on-surface-variant);
    }
    .status-dropped {
      background: color-mix(in srgb, var(--md-sys-color-error) 18%, transparent);
      color: var(--md-sys-color-error);
    }

    .progress-text {
      font-size: 0.72rem;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
    }

    .progress-bar-container {
      width: 100%;
      height: 4px;
      background: color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 0.35rem;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--md-sys-color-primary), var(--md-sys-color-secondary));
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .card.list-mode {
      padding: 0.6rem 1rem;
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, CoverImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovelCardComponent {
  @Input() novel!: LibraryItem;
  @Input() layout: 'grid' | 'list' = 'grid';
  @Input() showProgress = true;
  @Input() progressChapterNum: number | null = null;
  @Input() progressPercentNum = 0;
}