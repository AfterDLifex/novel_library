import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LibraryStore } from '../../library.store';
import { LibraryService } from '../../library.service';
import { NovelCardComponent } from '../../../../shared/components/novel-card/novel-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { LibraryItem } from '../../../../models';

export type SortOption = 'title' | 'lastRead' | 'progress' | 'dateAdded';

@Component({
  selector: 'app-library-page',
  template: `
    <div class="library-page content-shell">
      <!-- Top Control Bar -->
      <header class="library-header glass-strong">
        <div class="search-bar">
          <app-icon name="search" [size]="18" />
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search your library..."
            class="search-input"
          />
          @if (searchQuery) {
            <button class="clear-btn" (click)="searchQuery = ''">
              <app-icon name="close" [size]="16" />
            </button>
          }
        </div>

        <div class="header-actions">
          <!-- Sort Selector -->
          <div class="sort-selector">
            <app-icon name="sort" [size]="16" />
            <select [ngModel]="sortBy()" (ngModelChange)="setSort($event)">
              <option value="lastRead">Last Read</option>
              <option value="title">Title (A-Z)</option>
              <option value="progress">Reading Progress</option>
              <option value="dateAdded">Date Added</option>
            </select>
          </div>

          <!-- View Layout Toggle -->
          <button
            class="action-btn"
            (click)="toggleViewMode()"
            [title]="viewMode() === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
          >
            <app-icon [name]="viewMode() === 'grid' ? 'listView' : 'gridView'" [size]="18" />
          </button>

          <!-- Favorites Filter Toggle -->
          <button
            class="action-btn"
            [class.active]="showFavoritesOnly()"
            (click)="toggleFavorites()"
            title="Toggle Favorites Only"
          >
            <app-icon [name]="showFavoritesOnly() ? 'star' : 'starBorder'" [size]="18" />
          </button>
        </div>
      </header>

      <!-- Status Filter Chips -->
      <div class="filter-chips">
        <button
          *ngFor="let f of filterOptions"
          class="chip"
          [class.active]="activeFilter() === f.value"
          (click)="setFilter(f.value)"
        >
          {{ f.label }}
          <span class="chip-count">{{ getFilterCount(f.value) }}</span>
        </button>
      </div>

      <!-- Main Library Content -->
      <div class="library-content">
        @if (store.items().length === 0) {
          <app-empty-state
            icon="library"
            title="Your library is empty"
            message="Discover & add novels from online sources to build your reading collection."
          >
            <a routerLink="/search" class="primary-btn glass lift">
              <app-icon name="search" [size]="18" /> Search Novels
            </a>
          </app-empty-state>
        } @else {
          <div [class]="viewMode() === 'grid' ? 'grid-view' : 'list-view'">
            <app-novel-card
              *ngFor="let item of filteredItems()"
              [novel]="item"
              [layout]="viewMode()"
            />
          </div>

          @if (filteredItems().length === 0) {
            <div class="no-results glass">
              <app-icon name="filter" [size]="32" />
              <p>No novels match your current filter or search criteria.</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .library-page {
      padding-top: 1.25rem;
      padding-bottom: 2.5rem;
    }

    .library-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-large);
      margin-bottom: 1rem;
    }

    .search-bar {
      flex: 1;
      min-width: 220px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-full);
      color: var(--md-sys-color-on-surface-variant);
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--md-sys-color-on-surface);
      font-size: 0.88rem;
    }

    .clear-btn {
      background: none;
      border: none;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      padding: 0.1rem;
      display: flex;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-selector {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.75rem;
      background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-medium);
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .sort-selector select {
      background: transparent;
      border: none;
      outline: none;
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .action-btn {
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-medium);
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover, .action-btn.active {
      background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
      color: var(--md-sys-color-primary);
      border-color: var(--md-sys-color-primary);
    }

    .filter-chips {
      display: flex;
      gap: 0.4rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-full);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .chip:hover, .chip.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }

    .chip-count {
      font-size: 0.7rem;
      opacity: 0.85;
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-full);
      background: rgba(0, 0, 0, 0.15);
    }

    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.85rem;
    }

    .list-view {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-radius: var(--radius-medium);
      text-decoration: none;
      font-weight: 600;
      margin-top: 1rem;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem;
      border-radius: var(--radius-large);
      color: var(--md-sys-color-on-surface-variant);
      text-align: center;
    }

    @media (max-width: 640px) {
      .grid-view {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 0.6rem;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, NovelCardComponent,
    EmptyStateComponent, IconComponent, LoadingSpinnerComponent,
  ],
})
export class LibraryPageComponent {
  searchQuery = '';
  readonly activeFilter = signal<'all' | 'reading' | 'completed' | 'planned' | 'dropped'>('all');
  readonly showFav = signal(false);
  readonly sortBy = signal<SortOption>('lastRead');
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly filterOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'reading' as const, label: 'Reading' },
    { value: 'completed' as const, label: 'Completed' },
    { value: 'planned' as const, label: 'Planned' },
    { value: 'dropped' as const, label: 'Dropped' },
  ];

  readonly filteredItems = computed(() => {
    let items = [...this.store.items()];
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      items = items.filter(
        i => i.title.toLowerCase().includes(query) || (i.author && i.author.toLowerCase().includes(query))
      );
    }

    const filter = this.activeFilter();
    if (filter !== 'all') {
      items = items.filter((i) => i.status === filter);
    }
    if (this.showFav()) {
      items = items.filter((i) => i.favorite);
    }

    // Sort items
    const sort = this.sortBy();
    items.sort((a, b) => {
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sort === 'dateAdded') {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
      return 0;
    });

    return items;
  });

  constructor(
    readonly store: LibraryStore,
    private library: LibraryService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'favorites') {
        this.showFav.set(true);
      }
    });
  }

  setFilter(filter: 'all' | 'reading' | 'completed' | 'planned' | 'dropped') {
    this.activeFilter.set(filter);
  }

  getFilterCount(filter: string): number {
    const items = this.store.items();
    if (filter === 'all') return items.length;
    return items.filter(i => i.status === filter).length;
  }

  setSort(sort: SortOption) {
    this.sortBy.set(sort);
  }

  toggleViewMode() {
    this.viewMode.update(v => v === 'grid' ? 'list' : 'grid');
  }

  showFavoritesOnly() {
    return this.showFav();
  }

  toggleFavorites() {
    this.showFav.update((v) => !v);
  }
}
