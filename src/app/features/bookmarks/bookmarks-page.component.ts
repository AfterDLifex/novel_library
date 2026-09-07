import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    <div class="bookmarks-page content-shell">
      <header class="page-header glass-strong">
        <div class="header-left">
          <app-icon name="bookmarks" [size]="24" class="header-icon" />
          <div>
            <h1>Bookmarks</h1>
            <p class="subtitle">{{ count() }} chapter bookmarks saved</p>
          </div>
        </div>
      </header>

      <div class="bookmarks-container">
        @if (items().length > 0) {
          <cdk-virtual-scroll-viewport itemSize="92" class="viewport">
            <div *cdkVirtualFor="let item of items()" class="bookmark-card glass lift" (click)="openBookmark(item)">
              <app-cover-image [src]="getItemCover(item)" [alt]="getItemTitle(item)" [aspectRatio]="'1/1'" />
              
              <div class="info">
                <h3>{{ getItemTitle(item) }}</h3>
                <p class="chapter">{{ item.title }}</p>
                <div class="meta">
                  <span class="badge badge-primary">Ch. {{ item.chapterNumber }}</span>
                  <span class="time">{{ item.createdAt | dateAgo }}</span>
                </div>
                @if (item.note) {
                  <p class="note">{{ item.note }}</p>
                }
              </div>

              <button class="delete-btn" (click)="delete($event, item)" title="Delete bookmark">
                <app-icon name="delete" [size]="18" />
              </button>
            </div>
          </cdk-virtual-scroll-viewport>
        } @else {
          <app-empty-state
            icon="bookmarks"
            title="No bookmarks yet"
            message="Bookmark chapters while reading to quickly jump back to your favorite moments."
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .bookmarks-page {
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

    .header-icon { color: var(--md-sys-color-primary); }

    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .subtitle {
      font-size: 0.78rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
    }

    .viewport {
      height: calc(100dvh - 220px);
      width: 100%;
    }

    .bookmark-card {
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

    .note {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0.35rem 0 0;
      white-space: pre-wrap;
    }

    .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.4rem;
      color: var(--md-sys-color-on-surface-variant);
      border-radius: var(--radius-medium);
      transition: all 0.2s;
    }
    .delete-btn:hover {
      color: var(--md-sys-color-error);
      background: color-mix(in srgb, var(--md-sys-color-error) 15%, transparent);
    }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent, CoverImageComponent, EmptyStateComponent, DateAgoPipe, CdkVirtualScrollViewport, CdkVirtualForOf],
})
export class BookmarksPageComponent {
  readonly items = signal<Bookmark[]>([]);
  readonly novels = signal<Map<string, Novel>>(new Map());
  readonly count = computed(() => this.items().length);

  private router = inject(Router);

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

  openBookmark(item: Bookmark) {
    this.router.navigate(['/reader', item.novelId, item.chapterId]);
  }

  async delete(event: Event, item: Bookmark) {
    event.stopPropagation();
    await this.db.removeBookmark(item.id);
    await this.load();
  }
}
