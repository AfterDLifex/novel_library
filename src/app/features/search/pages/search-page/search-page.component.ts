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
import { DatabaseService } from '../../../../core/database/database.service';
import { LibraryService } from '../../../library/library.service';
import { NovelSearchResult } from '../../../../models';

@Component({
  selector: 'app-search-page',
  template: `
    <div class="search-page">
      <header class="search-header">
        <div class="search-box">
          <app-icon name="search" size="20" />
          <input type="text" [(ngModel)]="query" (input)="onQueryChange()"
            placeholder="Search novels..." autocomplete="off" />
        </div>
        <button class="search-btn" (click)="doSearch()" [disabled]="loading()">Search</button>
      </header>

      @if (loading()) {
        <div class="loading"><app-loading-spinner /></div>
      }

      @if (errors().size > 0 && !loading()) {
        <div class="source-errors">
          @for (entry of errorsArray(); entry; track $index) {
            <app-error-message [message]="'Source error: ' + entry[1]" />
          }
        </div>
      }

      <div class="results" *ngIf="!loading() && results().length > 0">
        <app-search-result-card
          *ngFor="let result of results()"
          [result]="result"
          (addToLibrary)="onAddToLibrary($event)"
          [inLibrary]="inLibrary(result)"
        />
      </div>

      @if (!loading() && results().length === 0 && query.trim()) {
        <app-empty-state icon="search" title="No results found"
          message="Try a different search term." />
      }

      @if (!loading() && !query.trim()) {
        <app-empty-state icon="search" title="Search for novels"
          message="Enter a title or author to find novels from your configured sources." />
      }
    </div>
  `,
  styles: [`
    .search-page { padding: 1rem; }
    .search-header { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .search-box { flex: 1; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 0.5rem; }
    .search-box input { flex: 1; border: none; outline: none; background: transparent; color: var(--md-sys-color-on-surface); font-size: 0.9rem; }
    .search-btn { padding: 0.5rem 1rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
    .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .results { display: flex; flex-direction: column; gap: 0.5rem; }
    .source-errors { margin: 1rem 0; }
  `],
  standalone: true,
  imports: [
    CommonModule, FormsModule, LoadingSpinnerComponent, ErrorMessageComponent,
    EmptyStateComponent, IconComponent, SearchResultCardComponent,
  ],
})
export class SearchPageComponent {
  query = '';
  private querySubject = new Subject<string>();

  readonly results = computed(() => this.coordinator.results());
  readonly loading = computed(() => this.coordinator.loading());
  readonly errors = computed(() => this.coordinator.errors());
  readonly errorsArray = computed(() => Array.from(this.coordinator.errors().entries()));

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
