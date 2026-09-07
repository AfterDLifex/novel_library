/**
 * Generates a unique ID for a novel based on source and source-specific ID.
 * This ensures the same novel from different sources doesn't collide.
 */
export function generateNovelId(sourceId: string, sourceNovelId: string): string {
  return `novel:${sourceId}:${sourceNovelId}`;
}

/**
 * Generates a unique ID for a chapter.
 */
export function generateChapterId(novelId: string, chapterNumber: number): string {
  return `chapter:${novelId}:${chapterNumber}`;
}

/**
 * Generates a unique ID for a library item.
 */
export function generateLibraryItemId(): string {
  return 'lib_' + crypto.randomUUID();
}

/**
 * Generates a unique ID for a bookmark.
 */
export function generateBookmarkId(): string {
  return 'bm_' + crypto.randomUUID();
}

/**
 * Generates a unique ID for a history item.
 */
export function generateHistoryId(): string {
  return 'hist_' + crypto.randomUUID();
}

/**
 * Generates a unique ID for a collection.
 */
export function generateCollectionId(): string {
  return 'col_' + crypto.randomUUID();
}

/**
 * Extracts source and sourceNovelId from a novel ID.
 */
export function parseNovelId(id: string): { sourceId: string; sourceNovelId: string } {
  const parts = id.split(':');
  if (parts.length >= 3 && parts[0] === 'novel') {
    return { sourceId: parts[1], sourceNovelId: parts[2] };
  }
  // Fallback for legacy IDs without the prefix
  if (parts.length >= 2) {
    return { sourceId: parts[0], sourceNovelId: parts.slice(1).join(':') };
  }
  return { sourceId: 'unknown', sourceNovelId: id };
}
