import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibraryStore } from '../../library.store';
import { LibraryService } from '../../library.service';
import { NovelCardComponent } from '../../../../shared/components/novel-card/novel-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';


@Component({
  selector: 'app-library-page',
  template: `
    <div class="library-page">
      <header class="page-header">
        <div class="filters">
          @for (f of filterOptions; track f.value) {
            <button
              class="filter-btn"
              [class.active]="activeFilter() === f.value"
              (click)="setFilter(f.value)"
            >
              {{ f.label }}
            </button>
          }
        </div>
        <div class="view-controls">
          <button class="view-btn" (click)="toggleFavorites()" [class.active]="showFavoritesOnly()">
            <app-icon [name]="showFavoritesOnly() ? 'star' : 'starBorder'" size="18" />
          </button>
          <button class="view-btn" routerLink="/search">
            <app-icon name="search" size="18" />
          </button>
        </div>
      </header>

      <div class="content">
        @if (store.items().length === 0) {
          <app-empty-state
            icon="library"
            title="Your library is empty"
            message="Search for novels and add them to your library."
          >
            <a routerLink="/search" class="action-btn">
              <app-icon name="search" size="18" /> Search Novels
            </a>
          </app-empty-state>
        } @else {
          <div class="grid">
            <app-novel-card
              *ngFor="let item of filteredItems()"
              [novel]="item"
              [progressChapterNum]="item.progress?.chapterNumber ?? null"
              [progressPercentNum]="item.progress?.progressPercent ?? 0"
            />
          </div>
          @if (filteredItems().length === 0) {
            <p class="empty-filter">No items match the selected filter.</p>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .library-page { padding: 1rem; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 0.5rem;
    }
    .filters { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .filter-btn {
      padding: 0.3rem 0.8rem;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 0.5rem;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn.active, .filter-btn:hover {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }
    .view-controls { display: flex; gap: 0.25rem; }
    .view-btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 0.4rem;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
    }
    .view-btn.active {
      background: color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent);
      color: var(--md-sys-color-primary);
    }
    .content { margin-top: 1rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
    }
    app-novel-card { width: 100%; }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
      color: var(--md-sys-color-primary);
      border-radius: 0.5rem;
      text-decoration: none;
    }
    .empty-filter { text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant); }
  `],
  standalone: true,
  imports: [
    CommonModule, RouterLink, NovelCardComponent,
    EmptyStateComponent, IconComponent, LoadingSpinnerComponent,
  ],
})
export class LibraryPageComponent {
  readonly activeFilter = signal<'all' | 'reading' | 'completed' | 'planned' | 'dropped'>('all');
  readonly showFav = signal(false);

  readonly filterOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'reading' as const, label: 'Reading' },
    { value: 'completed' as const, label: 'Completed' },
    { value: 'planned' as const, label: 'Planned' },
    { value: 'dropped' as const, label: 'Dropped' },
  ];

  readonly filteredItems = computed(() => {
    let items = this.store.items();
    const filter = this.activeFilter();
    if (filter !== 'all') {
      items = items.filter((i) => i.status === filter);
    }
    if (this.showFav()) {
      items = items.filter((i) => i.favorite);
    }
    return items;
  });

  constructor(
    readonly store: LibraryStore,
    private library: LibraryService
  ) {}

  setFilter(filter: 'all' | 'reading' | 'completed' | 'planned' | 'dropped') {
    this.activeFilter.set(filter);
  }

  showFavoritesOnly() {
    return this.showFav();
  }

  toggleFavorites() {
    this.showFav.update((v) => !v);
  }
}
