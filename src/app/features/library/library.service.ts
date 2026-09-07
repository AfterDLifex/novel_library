import { Injectable, signal } from '@angular/core';
import { db } from '../../core/database/indexed-db.service';
import { LibraryItem, Novel, ReadingProgress } from '../../models';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private _items = signal<LibraryItem[]>([]);
  readonly items = this._items.asReadonly();

  constructor() {
    this.load();
  }

    async load() {
    const data = await db.library.toArray();
    const sorted = data.sort((a, b) => (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0));
    this._items.set(sorted);
    return sorted;
  }

  async add(novel: Novel): Promise<LibraryItem> {
    const existing = await db.library.get({ novelId: novel.id });
    if (existing) return existing;

    const item: LibraryItem = {
      id: 'lib_' + crypto.randomUUID(),
      novelId: novel.id,
      title: novel.title,
      alternativeTitles: novel.alternativeTitles,
      author: novel.author,
      coverUrl: novel.coverUrl,
      sourceUrl: novel.sourceUrl,
      sourceId: novel.sourceId,
      addedAt: Date.now(),
      updatedAt: Date.now(),
      favorite: false,
      status: 'planned',
    };
    await db.library.add(item);
    await db.novels.put(novel);
    await this.load();
    return item;
  }

  async update(novelId: string, changes: Partial<LibraryItem>) {
    await db.library.where({ novelId }).modify((item) => {
      Object.assign(item, changes, { updatedAt: Date.now() });
    });
    await this.load();
  }

  async remove(novelId: string) {
    await db.library.where({ novelId }).delete();
    await db.progress.where({ novelId }).delete();
    await db.bookmarks.where({ novelId }).delete();
    await db.history.where({ novelId }).delete();
    await this.load();
  }

  async getProgress(novelId: string): Promise<ReadingProgress | undefined> {
    return db.progress.get(novelId);
  }

  async saveProgress(progress: ReadingProgress) {
    await db.progress.put(progress);
    await db.library.where({ novelId: progress.novelId }).modify((item) => {
      item.lastReadAt = Date.now();
      item.status = 'reading';
      item.updatedAt = Date.now();
    });
    await this.load();
  }

  async toggleFavorite(novelId: string) {
    const item = await db.library.get({ novelId });
    if (item) {
      await this.update(novelId, { favorite: !item.favorite });
    }
  }
}
