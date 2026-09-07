import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CoverImageComponent } from '../../shared/components/cover-image/cover-image.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { DateAgoPipe } from '../../shared/pipes/date-ago.pipe';
import { HistoryItem, Novel } from '../../models';
import { DatabaseService } from '../../core/database/database.service';

@Component({
  selector: 'app-history-page',
  template: `
    <div class="history-page content-shell">
      <header class="page-header glass-strong">
        <div class="header-left">
          <app-icon name="history" [size]="24" class="header-icon" />
          <div>
            <h1>Reading History</h1>
            <p class="subtitle">Track your recent reading activities</p>
          </div>
        </div>

        @if (items().length > 0) {
          <button class="clear-btn glass lift" (click)="clearAll()" title="Clear all history">
            <app-icon name="delete" [size]="16" /> Clear History
          </button>
        }
      </header>

      <div class="history-container">
        @if (items().length > 0) {
          <cdk-virtual-scroll-viewport itemSize="88" class="viewport">
            <div *cdkVirtualFor="let item of items()" class="history-card glass lift" (click)="openHistoryItem(item)">
              <app-cover-image [src]="getItemCover(item)" [alt]="getItemTitle(item)" [aspectRatio]="'1/1'" />
              
              <div class="info">
                <h3>{{ getItemTitle(item) }}</h3>
                <p class="chapter">{{ item.chapterTitle }}</p>
                <div class="meta">
                  <span class="badge badge-primary">Ch. {{ item.chapterNumber }}</span>
                  <span class="time">{{ item.readAt | dateAgo }}</span>
                </div>
              </div>

              <div class="resume-badge">
                <app-icon name="arrowForward" [size]="18" />
              </div>
            </div>
          </cdk-virtual-scroll-viewport>
        } @else {
          <app-empty-state
            icon="history"
            title="No reading history"
            message="Your reading activity and progress will appear here automatically."
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .history-page {
      padding-top: 1.25rem;
      padding-bottom: 2.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-large);
      margin-bottom: 1.25rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon { color: var(--md-sys-color-secondary); }

    h1 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .subtitle { font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); margin: 0; }

    .clear-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-medium);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--md-sys-color-error);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .viewport {
      height: calc(100dvh - 220px);
      width: 100%;
    }

    .history-card {
      display: flex;
      gap: 0.85rem;
      align-items: center;
      padding: 0.75rem;
      border-radius: var(--radius-medium);
      margin-bottom: 0.6rem;
      cursor: pointer;
    }

    app-cover-image {
      width: 52px;
      min-width: 52px;
      border-radius: var(--radius-small);
      overflow: hidden;
    }

    .info {
      flex: 1;
      min-width: 0;
    }

    h3 {
      font-size: 0.92rem;
      font-weight: 650;
      margin: 0 0 0.15rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chapter {
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 0 0.35rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time {
      font-size: 0.72rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .resume-badge {
      color: var(--md-sys-color-primary);
      padding: 0.4rem;
    }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent, CoverImageComponent, EmptyStateComponent, DateAgoPipe, CdkVirtualScrollViewport, CdkVirtualForOf],
})
export class HistoryPageComponent {
  readonly items = signal<HistoryItem[]>([]);
  readonly novels = signal<Map<string, Novel>>(new Map());

  private router = inject(Router);

  constructor(private db: DatabaseService) {
    this.load();
  }

  async load() {
    const history = await this.db.getAllHistory();
    this.items.set(history);
    const novelIds = [...new Set(history.map((h) => h.novelId))];
    const novelMap = new Map<string, Novel>();
    for (const id of novelIds) {
      const n = await this.db.getNovel(id);
      if (n) novelMap.set(id, n);
    }
    this.novels.set(novelMap);
  }

  getItemTitle(item: HistoryItem): string {
    return this.novels().get(item.novelId)?.title ?? item.novelTitle;
  }

  getItemCover(item: HistoryItem): string | undefined {
    return this.novels().get(item.novelId)?.coverUrl;
  }

  openHistoryItem(item: HistoryItem) {
    this.router.navigate(['/reader', item.novelId, item.chapterId]);
  }

  async clearAll() {
    if (!confirm('Are you sure you want to clear all reading history?')) return;
    await this.db.clearHistory();
    await this.load();
  }
}
