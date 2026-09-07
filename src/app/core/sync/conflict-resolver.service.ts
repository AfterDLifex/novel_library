import { Injectable } from '@angular/core';
import { ReadingProgress, LibraryItem, Bookmark, Collection } from '../../models';

@Injectable({ providedIn: 'root' })
export class ConflictResolverService {
  resolveProgress(local: ReadingProgress, remote: ReadingProgress): ReadingProgress {
    if (local.chapterNumber > remote.chapterNumber) return local;
    if (remote.chapterNumber > local.chapterNumber) return remote;
    return local.updatedAt > remote.updatedAt ? local : remote;
  }

  resolveLibraryItem(local: LibraryItem, remote: LibraryItem): LibraryItem {
    return local.updatedAt > remote.updatedAt ? local : remote;
  }

  mergeBookmarks(local: Bookmark[], remote: Bookmark[]): Bookmark[] {
    const map = new Map<string, Bookmark>();
    for (const b of local) map.set(b.id, b);
    for (const b of remote) {
      const existing = map.get(b.id);
      if (!existing || b.createdAt > existing.createdAt) {
        map.set(b.id, b);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  mergeCollections(local: Collection[], remote: Collection[]): Collection[] {
    const map = new Map<string, Collection>();
    for (const c of local) map.set(c.id, c);
    for (const c of remote) {
      const existing = map.get(c.id);
      if (!existing || c.updatedAt > existing.updatedAt) {
        map.set(c.id, c);
      }
    }
    return Array.from(map.values());
  }
}
