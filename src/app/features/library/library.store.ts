import { Injectable, signal, computed, effect } from '@angular/core';
import { LibraryService } from './library.service';
import { LibraryItem, ReadingProgress } from '../../models';

export interface LibraryItemWithProgress extends LibraryItem {
  progress?: ReadingProgress;
}

@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly _items = signal<LibraryItemWithProgress[]>([]);
  readonly items = this._items.asReadonly();

  readonly reading = computed(() => this._items().filter((i) => i.status === 'reading'));
  readonly completed = computed(() => this._items().filter((i) => i.status === 'completed'));
  readonly favorites = computed(() => this._items().filter((i) => i.favorite));
  readonly planned = computed(() => this._items().filter((i) => i.status === 'planned'));
  readonly dropped = computed(() => this._items().filter((i) => i.status === 'dropped'));

  readonly continueReading = computed(() =>
    this._items()
      .filter((i) => i.progress)
      .sort((a, b) => (b.progress!.updatedAt ?? 0) - (a.progress!.updatedAt ?? 0))
      .slice(0, 8)
  );

  readonly recentAdditions = computed(() =>
    [...this._items()]
      .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
      .slice(0, 8)
  );

  readonly count = computed(() => this._items().length);

  constructor(private library: LibraryService) {
    this.load();
  }

  async load(): Promise<void> {
    const items = await this.library.load();
    // Enrich with progress
    const withProgress = await Promise.all(
      items.map(async (item) => {
        const progress = await this.library.getProgress(item.novelId);
        return { ...item, progress: progress ?? undefined };
      })
    );
    this._items.set(withProgress);
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  async toggleFavorite(novelId: string): Promise<void> {
    await this.library.toggleFavorite(novelId);
    await this.load();
  }

  async updateStatus(novelId: string, status: LibraryItem['status']): Promise<void> {
    await this.library.update(novelId, { status });
    await this.load();
  }

  async removeFromLibrary(novelId: string): Promise<void> {
    await this.library.remove(novelId);
    await this.load();
  }
}
