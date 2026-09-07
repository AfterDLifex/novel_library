import { Injectable, signal } from '@angular/core';
import { db } from './indexed-db.service';
import {
  Novel,
  Chapter,
  LibraryItem,
  ReadingProgress,
  Bookmark,
  HistoryItem,
  Collection,
  AppSettings,
  SyncOperation,
} from '../../models';
import { generateLibraryItemId } from '../utils/id.util';

/**
 * High-level database service that wraps Dexie operations.
 * Provides a clean API for all data access across the application.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  readonly ready = signal(false);

  // Novels
  getNovel(id: string): Promise<Novel | undefined> {
    return db.novels.get(id);
  }

  async putNovel(novel: Novel): Promise<void> {
    await db.novels.put(novel);
  }

  // Chapters
  getChapter(id: string): Promise<Chapter | undefined> {
    return db.chapters.get(id);
  }

  getChaptersByNovel(novelId: string): Promise<Chapter[]> {
    return db.chapters.where({ novelId }).sortBy('number');
  }

  async putChapter(chapter: Chapter): Promise<void> {
    await db.chapters.put(chapter);
  }

  async putChapters(chapters: Chapter[]): Promise<void> {
    await db.chapters.bulkPut(chapters);
  }

  // Library
  getLibraryItem(novelId: string): Promise<LibraryItem | undefined> {
    return db.library.get({ novelId });
  }

  getAllLibraryItems(): Promise<LibraryItem[]> {
    return db.library.orderBy('updatedAt').reverse().toArray();
  }

  async addToLibrary(novel: Novel, status: LibraryItem['status'] = 'planned'): Promise<LibraryItem> {
    const existing = await this.getLibraryItem(novel.id);
    if (existing) return existing;

    const item: LibraryItem = {
      id: generateLibraryItemId(),
      novelId: novel.id,
      title: novel.title,
      alternativeTitles: novel.alternativeTitles ?? [],
      author: novel.author,
      coverUrl: novel.coverUrl,
      sourceUrl: novel.sourceUrl,
      sourceId: novel.sourceId,
      addedAt: Date.now(),
      updatedAt: Date.now(),
      favorite: false,
      status,
    };

    await db.library.add(item);
    await db.novels.put(novel);
    return item;
  }

  async updateLibraryItem(novelId: string, changes: Partial<Omit<LibraryItem, 'id' | 'novelId'>>): Promise<void> {
    await db.library.where({ novelId }).modify({ ...changes, updatedAt: Date.now() });
  }

  async removeFromLibrary(novelId: string): Promise<void> {
    await db.transaction('rw', [
      db.library, db.progress, db.bookmarks, db.history,
    ], async () => {
      await db.library.where({ novelId }).delete();
      await db.progress.where({ novelId }).delete();
      await db.bookmarks.where({ novelId }).delete();
      await db.history.where({ novelId }).delete();
    });
  }

  getFavoriteItems(): Promise<LibraryItem[]> {
    return db.library.where({ favorite: 1 }).sortBy('updatedAt');
  }

  getItemsByStatus(status: LibraryItem['status']): Promise<LibraryItem[]> {
    return db.library.where({ status }).sortBy('updatedAt');
  }

    searchLibrary(query: string): Promise<LibraryItem[]> {
    const lower = query.toLowerCase();
    return db.library
      .where('title')
      .startsWith(lower)
      .or('author')
      .startsWith(lower)
      .toArray();
  }

  // Progress
  getProgress(novelId: string): Promise<ReadingProgress | undefined> {
    return db.progress.get(novelId);
  }

  getAllProgress(): Promise<ReadingProgress[]> {
    return db.progress.toArray();
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    await db.progress.put(progress);
  }

  // Bookmarks
  getBookmark(id: string): Promise<Bookmark | undefined> {
    return db.bookmarks.get(id);
  }

  getBookmarksByNovel(novelId: string): Promise<Bookmark[]> {
    return db.bookmarks.where({ novelId }).sortBy('createdAt');
  }

  getAllBookmarks(): Promise<Bookmark[]> {
    return db.bookmarks.orderBy('createdAt').reverse().toArray();
  }

  async addBookmark(bookmark: Omit<Bookmark, 'id'> & Partial<Pick<Bookmark, 'id'>>): Promise<void> {
    await db.bookmarks.add({ ...bookmark, id: bookmark.id ?? `bm_${crypto.randomUUID()}` });
  }

  async removeBookmark(id: string): Promise<void> {
    await db.bookmarks.delete(id);
  }

  // History
  getHistoryByNovel(novelId: string): Promise<HistoryItem[]> {
    return db.history.where({ novelId }).sortBy('readAt');
  }

  getAllHistory(): Promise<HistoryItem[]> {
    return db.history.orderBy('readAt').reverse().toArray();
  }

  async addHistoryItem(item: Omit<HistoryItem, 'id'> & Partial<Pick<HistoryItem, 'id'>>): Promise<void> {
    const existing = await db.history.where({ novelId: item.novelId, chapterId: item.chapterId }).first();
    if (existing) {
      await db.history.update(existing.id, { readAt: item.readAt, chapterNumber: item.chapterNumber, chapterTitle: item.chapterTitle });
    } else {
      await db.history.add({ ...item, id: item.id ?? `hist_${crypto.randomUUID()}` });
    }
  }

  // Collections
  getCollection(id: string): Promise<Collection | undefined> {
    return db.collections.get(id);
  }

  getAllCollections(): Promise<Collection[]> {
    return db.collections.orderBy('name').toArray();
  }

  async saveCollection(collection: Collection): Promise<void> {
    await db.collections.put(collection);
  }

  async deleteCollection(id: string): Promise<void> {
    await db.collections.delete(id);
  }

  // Settings
  getSettings(): Promise<AppSettings | undefined> {
    return db.settings.toCollection().first();
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put(settings);
  }

  // Sync Queue
  getPendingOperations(): Promise<SyncOperation[]> {
    return db.syncQueue.where({ synced: 0 }).toArray();
  }

  async enqueueOperation(op: Omit<SyncOperation, 'id' | 'synced'>): Promise<string> {
    const operation: SyncOperation = {
      ...op,
      id: `sync_${crypto.randomUUID()}`,
      synced: false,
    };
    await db.syncQueue.add(operation);
    return operation.id;
  }

  async markOperationSynced(id: string): Promise<void> {
    await db.syncQueue.update(id, { synced: true });
  }

  async clearSyncedOperations(): Promise<void> {
    await db.syncQueue.where({ synced: 1 }).delete();
  }

  // Export/Import
  async exportData(): Promise<unknown> {
    return {
      novels: await db.novels.toArray(),
      chapters: await db.chapters.toArray(),
      library: await db.library.toArray(),
      progress: await db.progress.toArray(),
      bookmarks: await db.bookmarks.toArray(),
      history: await db.history.toArray(),
      collections: await db.collections.toArray(),
      settings: await db.settings.toArray(),
    };
  }

  async importData(data: Awaited<ReturnType<DatabaseService['exportData']>>): Promise<void> {
    // await db.transaction('rw', db.novels, db.chapters, db.library, db.progress, db.bookmarks, db.history, db.collections, db.settings, async () => {
    //   await db.novels.clear();
    //   await db.chapters.clear();
    //   await db.library.clear();
    //   await db.progress.clear();
    //   await db.bookmarks.clear();
    //   await db.history.clear();
    //   await db.collections.clear();
    //   await db.settings.clear();

    //   if (data.novels?.length) await db.novels.bulkAdd(data.novels);
    //   if (data.chapters?.length) await db.chapters.bulkAdd(data.chapters);
    //   if (data.library?.length) await db.library.bulkAdd(data.library);
    //   if (data.progress?.length) await db.progress.bulkAdd(data.progress);
    //   if (data.bookmarks?.length) await db.bookmarks.bulkAdd(data.bookmarks);
    //   if (data.history?.length) await db.history.bulkAdd(data.history);
    //   if (data.collections?.length) await db.collections.bulkAdd(data.collections);
    //   if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    // });
  }

  // Clear all data
  async clearAll(): Promise<void> {
    // await db.transaction('rw', db.novels, db.chapters, db.library, db.progress, db.bookmarks, db.history, db.collections, db.settings, db.syncQueue, async () => {
    //   await db.novels.clear();
    //   await db.chapters.clear();
    //   await db.library.clear();
    //   await db.progress.clear();
    //   await db.bookmarks.clear();
    //   await db.history.clear();
    //   await db.collections.clear();
    //   await db.settings.clear();
    //   await db.syncQueue.clear();
    // });
  }
}
