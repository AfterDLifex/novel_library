import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CoverImageComponent } from '../../shared/components/cover-image/cover-image.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { DateAgoPipe } from '../../shared/pipes/date-ago.pipe';
import { Bookmark, Novel } from '../../models';
import { DatabaseService } from '../../core/database/database.service';

@Component({
  selector: 'app-bookmarks-page',
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Bookmarks</h1>
        <span class="count">{{ count() }} bookmarks</span>
      </header>

      <cdk-virtual-scroll-viewport itemSize="88" class="viewport" *ngIf="items().length > 0; else empty">
        <div *cdkVirtualFor="let item of items()" class="bookmark-item">
          <app-cover-image [src]="getItemCover(item)" [alt]="getItemTitle(item)" [aspectRatio]="'1/1'" />
          <div class="info">
            <h3>{{ getItemTitle(item) }}</h3>
            <p class="chapter">{{ item.title }}</p>
            <p class="meta">
              <span>Ch. {{ item.chapterNumber }}</span>
              <span>· {{ item.createdAt | dateAgo }}</span>
            </p>
            @if (item.note) {
              <p class="note">{{ item.note }}</p>
            }
          </div>
          <button class="delete-btn" (click)="delete(item)" title="Delete bookmark">
            <app-icon name="delete" [size]="18" />
          </button>
        </div>
      </cdk-virtual-scroll-viewport>

      <ng-template #empty>
        <app-empty-state icon="bookmarks" title="No bookmarks" message="Bookmark chapters while reading to see them here." />
      </ng-template>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .page-header h1 { font-size: 1.25rem; margin: 0; }
    .count { font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant); }
    .viewport { height: calc(100dvh - 180px); width: 100%; }
    .bookmark-item {
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
    }
    app-cover-image { width: 48px; min-width: 48px; }
    .info { flex: 1; min-width: 0; }
    h3 { font-size: 0.9rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chapter { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { display: flex; gap: 0.4rem; font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0; }
    .note { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0.25rem 0 0; white-space: pre-wrap; }
    .delete-btn {
      background: none; border: none; cursor: pointer; padding: 0.3rem;
      color: var(--md-sys-color-on-surface-variant); border-radius: 0.3rem;
    }
    .delete-btn:hover { color: var(--md-sys-color-error); background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent); }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent, CoverImageComponent, EmptyStateComponent, DateAgoPipe, CdkVirtualScrollViewport, CdkVirtualForOf],
})
export class BookmarksPageComponent {
  readonly items = signal<Bookmark[]>([]);
  readonly novels = signal<Map<string, Novel>>(new Map());
  readonly count = computed(() => this.items().length);

  constructor(private db: DatabaseService) {
    this.load();
  }

  async load() {
    const bookmarks = await this.db.getAllBookmarks();
    this.items.set(bookmarks);
    const novelIds = [...new Set(bookmarks.map((b: Bookmark) => b.novelId))];
    const novelMap = new Map<string, Novel>();
    for (const id of novelIds) {
      const n = await this.db.getNovel(id);
      if (n) novelMap.set(id, n);
    }
    this.novels.set(novelMap);
  }

  getItemTitle(item: Bookmark): string {
    return this.novels().get(item.novelId)?.title ?? item.title;
  }

  getItemCover(item: Bookmark): string | undefined {
    return this.novels().get(item.novelId)?.coverUrl;
  }

  async delete(item: Bookmark) {
    await this.db.removeBookmark(item.id);
    await this.load();
  }
}
