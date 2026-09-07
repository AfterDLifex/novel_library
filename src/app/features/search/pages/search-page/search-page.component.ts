import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
        <p class="page-subtitle">Search globally across all your configured novel sources</p>
      </header>
      <header class="search-header">
        <div class="search-box">
          <app-icon name="search" [size]="20" />
          <input type="text" [(ngModel)]="query" (input)="onQueryChange()"
            placeholder="Search novels across {{ activeSourceCount() }} sources..." autocomplete="off" />
        </div>
        <button class="search-btn" (click)="doSearch()" [disabled]="loading()">Search</button>
      </header>

      <div class="source-filters">
        <button
          class="filter-toggle"
          (click)="showFilters.set(!showFilters())"
          [class.active]="showFilters()"
        >
          <app-icon name="settings" [size]="16" />
          <span>Sources</span>
          <app-icon name="arrowForward" [size]="14" [class.rotated]="showFilters()" />
        </button>
        <span class="active-count">{{ activeSourceCount() }} active</span>
      </div>

      @if (showFilters()) {
        <div class="source-list">
          @for (source of sources(); track source.id) {
            <button
              class="source-chip"
              [class.active]="isSourceActive(source.id)"
              (click)="toggleSource(source.id)"
            >
              <app-source-icon [sourceId]="source.id" [sourceName]="source.name" [size]="14" />
              <span class="chip-name">{{ source.name }}</span>
              @if (isSourceActive(source.id)) {
                <app-icon name="check" [size]="14" />
              }
            </button>
          }
        </div>
      }

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
          message="Try a different search term or enable more sources." />
      }

      @if (!loading() && !query.trim()) {
        <app-empty-state icon="search" title="Search for novels"
          message="Enter a title or author to find novels from your configured sources." />
      }
    </div>
  `,
  styles: [`
    .search-page { max-width: 720px; margin: 0 auto; padding: 1.25rem 1rem 2rem; }
    .page-title { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.15rem; letter-spacing: -0.01em; }
    .page-subtitle { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); margin: 0 0 1rem; }
    .search-header { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .search-box { flex: 1; display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.9rem; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 1.5rem; transition: border-color .2s, box-shadow .2s; }
    .search-box:focus-within { border-color: var(--md-sys-color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent); }
    .search-box app-icon { color: var(--md-sys-color-on-surface-variant); }
    .search-box input { flex: 1; border: none; outline: none; background: transparent; color: var(--md-sys-color-on-surface); font-size: 0.95rem; min-width: 0; }
    .search-btn { padding: 0.65rem 1.25rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 1.5rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all .2s; }
    .search-btn:hover:not(:disabled) { filter: brightness(1.08); box-shadow: var(--md-sys-elevation-2); }
    .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .source-filters { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .filter-toggle { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 1rem; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
    .filter-toggle:hover { border-color: var(--md-sys-color-primary); }
    .filter-toggle.active { border-color: var(--md-sys-color-primary); color: var(--md-sys-color-primary); background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent); }
    .filter-toggle .rotated { transform: rotate(90deg); transition: transform .2s; }
    .active-count { font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); }
    .source-list { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--md-sys-color-surface-variant); border-radius: var(--radius-medium); }
    .source-chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid transparent; border-radius: 1rem; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-size: 0.72rem; cursor: pointer; transition: all 0.2s; }
    .source-chip:hover { border-color: var(--md-sys-color-primary); }
    .source-chip.active { background: color-mix(in srgb, var(--md-sys-color-primary) 14%, var(--md-sys-color-surface)); border-color: var(--md-sys-color-primary); color: var(--md-sys-color-primary); font-weight: 600; }
    .chip-name { white-space: nowrap; }
    .loading { display: flex; justify-content: center; padding: 2.5rem; }
    .results { display: flex; flex-direction: column; gap: 0.6rem; }
    .results-count { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-on-surface-variant); margin: 0.25rem 0 0.5rem; }
    .source-errors { margin: 1rem 0; display: flex; flex-direction: column; gap: 0.4rem; }
  `],
  standalone: true,
  imports: [
    CommonModule, FormsModule, LoadingSpinnerComponent, ErrorMessageComponent,
    EmptyStateComponent, IconComponent, SearchResultCardComponent, SourceIconComponent,
  ],
})
export class SearchPageComponent {
  query = '';
  showFilters = signal(false);
  private querySubject = new Subject<string>();

  readonly results = computed(() => this.coordinator.results());
  readonly loading = computed(() => this.coordinator.loading());
  readonly errors = computed(() => this.coordinator.errors());
  readonly errorsArray = computed(() => Array.from(this.coordinator.errors().entries()));
  readonly sources = computed(() => this.coordinator.sources());
  readonly activeSourceIds = computed(() => this.coordinator.activeSourceIds());
  readonly activeSourceCount = computed(() => this.coordinator.activeSourceIds().size);

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

  isSourceActive(sourceId: string): boolean {
    return this.activeSourceIds().has(sourceId);
  }

  toggleSource(sourceId: string): void {
    this.coordinator.toggleSource(sourceId);
  }

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
