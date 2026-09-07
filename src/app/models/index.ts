export interface Novel {
  id: string;
  title: string;
  alternativeTitles: string[];
  author?: string;
  coverUrl?: string;
  description?: string;
  sourceUrl: string;
  sourceId: string;
  totalChapters?: number;
  status: 'ongoing' | 'completed' | 'hiatus' | 'unknown';
  genres: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  number: number;
  content?: string;
  sourceUrl: string;
  publishedAt?: number;
  createdAt: number;
}

export interface LibraryItem {
  id: string;
  novelId: string;
  title: string;
  alternativeTitles: string[];
  author?: string;
  coverUrl?: string;
  sourceUrl: string;
  sourceId: string;
  addedAt: number;
  updatedAt: number;
  favorite: boolean;
  status: 'reading' | 'completed' | 'planned' | 'dropped';
  lastReadAt?: number;
}

export interface ReadingProgress {
  novelId: string;
  chapterId: string;
  chapterNumber: number;
  progressPercent: number;
  scrollPosition?: number;
  updatedAt: number;
  deviceId: string;
}

export interface Bookmark {
  id: string;
  novelId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  note?: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  novelId: string;
  chapterId: string;
  chapterNumber: number;
  novelTitle: string;
  chapterTitle: string;
  readAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  novelIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'sepia';
  contentWidth: number;
  keepScreenAwake: boolean;
}

export interface AppSettings {
  reader: ReaderSettings;
  syncEnabled: boolean;
  lastSyncAt?: number;
  schemaVersion?: number;
  deviceId: string;
  googleClientId?: string;
}

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'library' | 'progress' | 'bookmark' | 'collection' | 'settings';
  entityId: string;
  payload: unknown;
  createdAt: number;
  synced: boolean;
}

export interface NovelSearchResult {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  sourceId: string;
  sourceUrl: string;
}

export interface NovelDetails extends Novel {
  chapters: Chapter[];
}

export interface CachedEntry {
  id: string;
  key: string;
  data: unknown;
  sourceId: string;
  expiresAt: number;
}
