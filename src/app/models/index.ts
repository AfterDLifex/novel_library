export interface Comment {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt?: string | number;
  likes?: number;
}

export interface Novel {
  id: string;
  title: string;
  alternativeTitles: string[];
  author?: string;
  coverUrl?: string;
  description?: string;
  sourceUrl: string;
  sourceId: string;
  sourceName?: string;
  rating?: number;
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
  isContentAvailable?: boolean;
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
  sourceName?: string;
  rating?: number;
  totalChapters?: number;
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
  sourceUrl?: string;
  sourceName?: string;
  note?: string;
  scrollPosition?: number;
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
  theme: 'light' | 'dark' | 'sepia' | 'midnight';
  contentWidth: number;
  keepScreenAwake: boolean;
}

export interface NavigationSettings {
  position: 'bottom' | 'top' | 'floating-bottom' | 'floating-top';
  stickiness: 'sticky' | 'autohide' | 'static';
  oneHandedMode: 'disabled' | 'right' | 'left';
  maxVisibleMobileTabs: number;
}

export interface AppSettings {
  reader: ReaderSettings;
  navigation?: NavigationSettings;
  syncEnabled: boolean;
  lastSyncAt?: number;
  schemaVersion?: number;
  deviceId: string;
  googleClientId?: string;
  /** Route online novel searches through the local backend proxy server. */
  backendProxyEnabled?: boolean;
  /** Base URL of the backend proxy server (default http://localhost:5000). */
  backendProxyUrl?: string;
  defaultSourceId?: string;
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
  sourceName?: string;
  sourceUrl: string;
  rating?: number;
  downloadCount?: number;
}

export interface NovelDetails extends Novel {
  chapters: Chapter[];
  comments?: Comment[];
  downloadCount?: number;
  languages?: string[];
  bookshelves?: string[];
}

export interface CachedEntry {
  id: string;
  key: string;
  data: unknown;
  sourceId: string;
  expiresAt: number;
}
