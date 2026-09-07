import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SearchCoordinatorService } from '../../services/search-coordinator.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SearchResultCardComponent } from '../../components/search-results/search-results.component';
import { SourceIconComponent } from '../../components/source-icon/source-icon.component';
import { DatabaseService } from '../../../../core/database/database.service';
import { LibraryService } from '../../../library/library.service';
import { NovelSearchResult } from '../../../../models';

@Component({
  selector: 'app-search-page',
  template: `
    <div class="search-page">
      <header class="page-header">
        <h1 class="page-title">Discover Novels</h1>
        <p class="page-subtitle">Search across your configured content sources</p>
      </header>

      <header class="search-header">
        <div class="search-box">
          <app-icon name="search" [size]="20" />
          <input type="text" [(ngModel)]="query" (input)="onQueryChange()"
            placeholder="Search novels..." autocomplete="off" />
        </div>
        <button class="search-btn" (click)="doSearch()" [disabled]="loading()">Search</button>
      </header>

      <!-- Active sources passive bar -->
      <div class="sources-bar">
        <div class="sources-bar-chips">
          @for (source of activeSources(); track source.id) {
            <span class="source-chip-passive">
              <app-source-icon [sourceId]="source.id" [sourceName]="source.name" [size]="12" />
              {{ source.name }}
            </span>
          }
        </div>
        <a class="manage-sources-link" routerLink="/settings" [queryParams]="{ tab: 'sources' }"
          (click)="openSourcesTab()">
          <app-icon name="settings" [size]="13" /> Manage
        </a>
      </div>

      @if (loading()) {
        <div class="loading"><app-loading-spinner /></div>
      }

      @if (errors().size > 0 && !loading()) {
        <div class="source-errors">
          @for (entry of errorsArray(); track $index) {
            <app-error-message [message]="getSourceErrorLabel(entry[0]) + ': ' + entry[1]" />
          }
        </div>
      }

      <div class="results" *ngIf="!loading() && results().length > 0">
        <p class="results-count">{{ results().length }} results from {{ sourcesFoundIn(results()) }} source(s)</p>
        <app-search-result-card
          *ngFor="let result of results()"
          [result]="result"
          [sourceName]="getSourceName(result.sourceId)"
          (addToLibrary)="onAddToLibrary($event)"
          [inLibrary]="inLibrary(result)"
        />
      </div>

      @if (!loading() && results().length === 0 && query.trim()) {
        <app-empty-state icon="search" title="No results found"
          message="Try a different search term or enable more sources in Settings → Sources." />
      }

      @if (!loading() && !query.trim()) {
        <app-empty-state icon="search" title="Search for novels"
          message="Enter a title or author to find novels from your active sources." />
      }
    </div>
  `,
  styles: [`
    .search-page { max-width: 720px; margin: 0 auto; padding: 1.25rem 1rem 2rem; }
    .page-title { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.15rem; letter-spacing: -0.01em; }
    .page-subtitle { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); margin: 0 0 1rem; }

    /* Search row */
    .search-header { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
    .search-box {
      flex: 1; display: flex; align-items: center; gap: 0.5rem;
      padding: 0.7rem 1rem;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
      border: 1px solid var(--glass-border);
      border-radius: 1.6rem;
      box-shadow: var(--glass-shadow);
      transition: border-color .2s, box-shadow .2s;
    }
    .search-box:hover { border-color: color-mix(in srgb, var(--md-sys-color-primary) 30%, var(--glass-border)); }
    .search-box:focus-within {
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent), var(--glass-shadow);
    }
    .search-box app-icon { color: var(--md-sys-color-on-surface-variant); }
    .search-box input { flex: 1; border: none; outline: none; background: transparent; color: var(--md-sys-color-on-surface); font-size: 0.95rem; min-width: 0; }
    .search-btn {
      padding: 0.65rem 1.25rem;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border: none; border-radius: 1.5rem;
      font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all .2s;
    }
    .search-btn:hover:not(:disabled) { filter: brightness(1.08); box-shadow: var(--md-sys-elevation-2); }
    .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Active sources passive bar */
    .sources-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .sources-bar-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; flex: 1; }
    .source-chip-passive {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.65rem;
      border: 1px solid var(--glass-border);
      border-radius: 100px;
      background: var(--glass-bg);
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
    }
    .manage-sources-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--md-sys-color-primary);
      text-decoration: none;
      padding: 0.25rem 0.6rem;
      border-radius: 100px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
      background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .manage-sources-link:hover { background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent); }

    .loading { display: flex; justify-content: center; padding: 2.5rem; }
    .results { display: flex; flex-direction: column; gap: 0.6rem; }
    .results-count { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-on-surface-variant); margin: 0.25rem 0 0.5rem; }
    .source-errors { margin: 1rem 0; display: flex; flex-direction: column; gap: 0.4rem; }
  `],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    LoadingSpinnerComponent, ErrorMessageComponent,
    EmptyStateComponent, IconComponent, SearchResultCardComponent, SourceIconComponent,
  ],
})
export class SearchPageComponent {
  query = '';
  private querySubject = new Subject<string>();

  readonly results = computed(() => this.coordinator.results());
  readonly loading = computed(() => this.coordinator.loading());
  readonly errors = computed(() => this.coordinator.errors());
  readonly errorsArray = computed(() => Array.from(this.coordinator.errors().entries()));
  readonly sources = computed(() => this.coordinator.sources());
  readonly activeSourceIds = computed(() => this.coordinator.activeSourceIds());
  readonly activeSourceCount = computed(() => this.coordinator.activeSourceIds().size);
  /** Filtered list of sources that are currently active — shown as passive chips. */
  readonly activeSources = computed(() =>
    this.coordinator.sources().filter(s => this.coordinator.activeSourceIds().has(s.id))
  );

  private readonly libraryItems = signal<Set<string>>(new Set());
  private readonly database = inject(DatabaseService);

  constructor(
    private coordinator: SearchCoordinatorService,
    private library: LibraryService,
  ) {
    this.querySubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        this.coordinator.search(q);
        return [];
      })
    ).subscribe();
  }

  onQueryChange() {
    this.querySubject.next(this.query);
  }

  doSearch() {
    this.coordinator.search(this.query);
  }

  /** Called when user clicks "Manage" — the router navigates; nothing else needed. */
  openSourcesTab(): void {}

  getSourceName(sourceId: string): string {
    return this.coordinator.getSourceName(sourceId);
  }

  getSourceErrorLabel(sourceId: string): string {
    return this.coordinator.getSourceName(sourceId);
  }

  sourcesFoundIn(results: NovelSearchResult[]): number {
    return new Set(results.map((r) => r.sourceId)).size;
  }

  inLibrary(result: NovelSearchResult): boolean {
    return this.libraryItems().has(result.sourceUrl);
  }

  async onAddToLibrary(result: NovelSearchResult) {
    const novel = await this.coordinator.getNovelDetails(
      `novel:${result.sourceId}:${result.id}`
    );
    if (!novel) return;
    await this.database.addToLibrary(novel as any);
    this.libraryItems.update((s) => new Set(s).add(result.sourceUrl));
    await this.library.load();
  }
}
