import { Injectable, signal } from '@angular/core';
import { db } from '../database/indexed-db.service';
import { CachedEntry } from '../../models';

/**
 * Local cache service for storing search results and remote data.
 * Entries expire after a configurable TTL.
 */
@Injectable({ providedIn: 'root' })
export class LocalCacheService {
  private readonly _isLoaded = signal(false);
  readonly isLoaded = this._isLoaded.asReadonly();

  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await db.cache.count();
      this._isLoaded.set(true);
    } catch {
      this._isLoaded.set(true);
    }
  }

  async set(key: string, data: unknown, sourceId: string, ttlMs = this.DEFAULT_TTL_MS): Promise<void> {
    const entry: CachedEntry = {
      id: `cache_${crypto.randomUUID()}`,
      key,
      data,
      sourceId,
      expiresAt: Date.now() + ttlMs,
    };
    await db.cache.where('key').equals(key).delete();
    await db.cache.add(entry);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = await db.cache.where('key').equals(key).first();
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      await db.cache.where('key').equals(key).delete();
      return null;
    }
    return entry.data as T;
  }

  async delete(key: string): Promise<void> {
    await db.cache.where('key').equals(key).delete();
  }

  async clearExpired(): Promise<number> {
    return await db.cache.where('expiresAt').below(Date.now()).delete();
  }

  async clearBySource(sourceId: string): Promise<number> {
    return await db.cache.where('sourceId').equals(sourceId).delete();
  }

  async clearAll(): Promise<void> {
    await db.cache.clear();
  }

  static searchKey(sourceId: string, query: string): string {
    return `search:${sourceId}:${query.toLowerCase().trim()}`;
  }

  static detailsKey(sourceId: string, novelId: string): string {
    return `details:${sourceId}:${novelId}`;
  }

  static chaptersKey(sourceId: string, novelId: string): string {
    return `chapters:${sourceId}:${novelId}`;
  }
}