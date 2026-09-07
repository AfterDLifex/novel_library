import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <div class="page">
      <header class="page-header">
        <h1>History</h1>
        <button class="clear-btn" (click)="clearAll()" *ngIf="items().length > 0" title="Clear history">
          <app-icon name="delete" [size]="18" /> Clear
        </button>
      </header>

      <cdk-virtual-scroll-viewport itemSize="88" class="viewport" *ngIf="items().length > 0; else empty">
        <div *cdkVirtualFor="let item of items()" class="history-item">
          <app-cover-image [src]="getItemCover(item)" [alt]="getItemTitle(item)" [aspectRatio]="'1/1'" />
          <div class="info">
            <h3>{{ getItemTitle(item) }}</h3>
            <p class="chapter">{{ item.chapterTitle }}</p>
            <p class="meta">
              <span>Ch. {{ item.chapterNumber }}</span>
              <span>· {{ item.readAt | dateAgo }}</span>
            </p>
          </div>
        </div>
      </cdk-virtual-scroll-viewport>

      <ng-template #empty>
        <app-empty-state icon="history" title="No reading history" message="Your reading history will appear here." />
      </ng-template>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .page-header h1 { font-size: 1.25rem; margin: 0; }
    .clear-btn { background: none; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 0.3rem; padding: 0.2rem 0.6rem; cursor: pointer; font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); }
    .viewport { height: calc(100dvh - 180px); width: 100%; }
    .history-item {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.55rem;
      border-radius: 0.65rem;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      cursor: pointer;
      transition: border-color 0.2s ease, transform 0.2s var(--ease-out);
    }
    .history-item:hover {
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 28%, var(--glass-border));
      transform: translateY(-1px);
    }
    app-cover-image { width: 48px; min-width: 48px; }
    .info { flex: 1; min-width: 0; }
    h3 { font-size: 0.9rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chapter { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { display: flex; gap: 0.4rem; font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0; }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent, CoverImageComponent, EmptyStateComponent, DateAgoPipe, CdkVirtualScrollViewport, CdkVirtualForOf],
})
export class HistoryPageComponent {
  readonly items = signal<HistoryItem[]>([]);
  readonly novels = signal<Map<string, Novel>>(new Map());

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

  async clearAll() {
    if (!confirm('Are you sure you want to clear all reading history?')) return;
    await this.db.clearHistory();
    await this.load();
  }
}
