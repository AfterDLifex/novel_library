import Dexie, { Table } from 'dexie';
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
  CachedEntry,
} from '../../models';

export class NovelLibraryDatabase extends Dexie {
  novels!: Table<Novel, string>;
  chapters!: Table<Chapter, string>;
  library!: Table<LibraryItem, string>;
  progress!: Table<ReadingProgress, string>;
  bookmarks!: Table<Bookmark, string>;
  history!: Table<HistoryItem, string>;
  collections!: Table<Collection, string>;
  settings!: Table<AppSettings, string>;
  syncQueue!: Table<SyncOperation, string>;
  cache!: Table<CachedEntry, string>;

  constructor() {
    super('NovelLibraryDB');
    this.version(1).stores({
      novels: 'id, title, author, sourceId, updatedAt',
      chapters: 'id, novelId, number, [novelId+number]',
      library: 'id, novelId, title, status, favorite, updatedAt',
      progress: 'novelId, chapterNumber, updatedAt',
      bookmarks: 'id, novelId, chapterId, createdAt',
      history: 'id, novelId, readAt',
      collections: 'id, name, updatedAt',
      settings: 'deviceId, schemaVersion',
      syncQueue: 'id, entityType, synced, createdAt',
      cache: 'id, key, sourceId, expiresAt',
    });
  }
}

export const db = new NovelLibraryDatabase();
