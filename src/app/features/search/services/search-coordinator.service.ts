import { Injectable, signal } from '@angular/core';
import {
  NovelSearchResult,
  NovelDetails,
  Chapter,
} from '../../../models';
import { LocalCacheService } from '../../../core/storage/local-cache.service';
import { normalizeTitle } from '../../../core/utils/normalize.util';
import { generateNovelId } from '../../../core/utils/id.util';
import { NovelSourceAdapter, SourceConfig } from '../adapters/source.interface';
import { HttpSourceAdapter } from '../adapters/http-source.adapter';
import { JsonApiAdapter } from '../adapters/json-api.adapter';
import { NOVEL_SOURCES } from '../adapters/source-registry';
import { GutendexAdapter } from '../adapters/gutendex.adapter';
import { BackendSearchAdapter } from '../adapters/backend-search.adapter';
import { SettingsService } from '../../../core/storage/settings.service';
import { effect } from '@angular/core';

const DEFAULT_BACKEND_URL = 'http://localhost:5000';

/**
 * Search coordinator that manages multiple source adapters.
 * Uses Promise.allSettled for error isolation, normalizes and deduplicates results.
 */
@Injectable({ providedIn: 'root' })
export class SearchCoordinatorService {
  private readonly _results = signal<NovelSearchResult[]>([]);
  readonly results = this._results.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly _errors = signal<Map<string, string>>(new Map());
  readonly errors = this._errors.asReadonly();

  private readonly _sources = signal<NovelSourceAdapter[]>([]);
  readonly sources = this._sources.asReadonly();

  private readonly _activeSourceIds = signal<Set<string>>(new Set());
  readonly activeSourceIds = this._activeSourceIds.asReadonly();

  constructor(
    private cache: LocalCacheService,
    private settings: SettingsService
  ) {
    // Register the Gutendex adapter (works directly from the browser)
    this.registerSource(new GutendexAdapter());

    // Register online sources: via backend proxy if enabled, direct otherwise.
    this.registerOnlineSources();

    // Re-sync adapters whenever the backend proxy setting changes.
    effect(() => {
      this.applyBackendProxySetting();
    });
  }

  private registerOnlineSources(): void {
    for (const config of NOVEL_SOURCES) {
      // Skip sources registered by the backend proxy sync below.
      if (this.settings.settings().backendProxyEnabled) break;
      this.registerFromConfig(config);
    }
    this.applyBackendProxySetting();
  }

  /**
   * Swap direct (browser) adapters for backend-proxied adapters when the
   * backend proxy is enabled in settings, and back when disabled.
   */
  private applyBackendProxySetting(): void {
    const s = this.settings.settings();
    const enabled = !!s.backendProxyEnabled;
    const backendUrl = (s.backendProxyUrl || DEFAULT_BACKEND_URL).replace(/\/$/, '');

    const backendIds = ['jikan', 'royalroad', 'syosetu', 'novelfull', 'lightnovelworld', 'novelupdates'];

    if (enabled) {
      // Remove direct adapters for proxied sources, add backend adapters.
      for (const id of backendIds) {
        const existing = this._sources().find((a) => a.id === id);
        if (existing && !(existing instanceof BackendSearchAdapter)) {
          this.unregisterSource(id);
        }
      }
      for (const id of backendIds) {
        if (!this._sources().some((a) => a.id === id)) {
          const name = NOVEL_SOURCES.find((c) => c.id === id)?.name ?? id;
          this.registerSource(new BackendSearchAdapter(id, name, backendUrl));
        }
      }
    } else {
      // Remove backend adapters, restore direct adapters for configured sources.
      for (const id of backendIds) {
        const existing = this._sources().find((a) => a.id === id);
        if (existing instanceof BackendSearchAdapter) {
          this.unregisterSource(id);
        }
      }
      for (const config of NOVEL_SOURCES) {
        if (config.id === 'gutendex') continue;
        if (!this._sources().some((a) => a.id === config.id)) {
          this.registerFromConfig(config);
        }
      }
    }
  }


  registerSource(adapter: NovelSourceAdapter): void {
    this._sources.update((s) => [...s, adapter]);
    this._activeSourceIds.update((set) => new Set(set).add(adapter.id));
  }

  registerFromConfig(config: SourceConfig): void {
    // Use JsonApiAdapter for JSON API sources, HttpSourceAdapter for HTML scraping
    const adapter = config.isJsonApi 
      ? new JsonApiAdapter(config) 
      : new HttpSourceAdapter(config);
    this.registerSource(adapter);
  }

  unregisterSource(sourceId: string): void {
    this._sources.update((s) => s.filter((a) => a.id !== sourceId));
    this._activeSourceIds.update((set) => {
      const next = new Set(set);
      next.delete(sourceId);
      return next;
    });
  }

  toggleSource(sourceId: string): void {
    const current = this._activeSourceIds();
    if (current.has(sourceId)) {
      this._activeSourceIds.update((set) => {
        const next = new Set(set);
        next.delete(sourceId);
        return next;
      });
    } else {
      this._activeSourceIds.update((set) => new Set(set).add(sourceId));
    }
  }

  getSourceName(sourceId: string): string {
    const source = this._sources().find((s) => s.id === sourceId);
    return source?.name ?? sourceId;
  }

  async search(query: string): Promise<void> {
    if (!query.trim()) {
      this._results.set([]);
      return;
    }

    this._loading.set(true);
    this._errors.set(new Map());

    const sources = this._sources().filter((s) => this._activeSourceIds().has(s.id));
    const searchPromises = sources.map(async (source) => {
      const cacheKey = LocalCacheService.searchKey(source.id, query);
      const cached = await this.cache.get<NovelSearchResult[]>(cacheKey);
      if (cached) {
        return { sourceId: source.id, results: cached };
      }
      try {
        const results = await source.search(query);
        await this.cache.set(cacheKey, results, source.id);
        return { sourceId: source.id, results };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this._errors.update((m) => new Map(m).set(source.id, msg));
        return { sourceId: source.id, results: [] as NovelSearchResult[] };
      }
    });

    const settled = await Promise.allSettled(searchPromises);
    const allResults = settled
      .filter((s) => s.status === 'fulfilled')
      .flatMap((s) => (s as PromiseFulfilledResult<any>).value.results as NovelSearchResult[]);

    const deduplicated = this.deduplicate(allResults);
    this._results.set(deduplicated);
    this._loading.set(false);
  }

  private deduplicate(results: NovelSearchResult[]): NovelSearchResult[] {
    const seen = new Map<string, NovelSearchResult>();
    for (const result of results) {
      const key = normalizeTitle(result.title) + ':' + (result.author ? normalizeTitle(result.author) : '');
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { ...result, id: generateNovelId(result.sourceId, result.id) });
      } else {
        seen.set(key, this.mergeResults(existing, result));
      }
    }
    return Array.from(seen.values());
  }

  private mergeResults(a: NovelSearchResult, b: NovelSearchResult): NovelSearchResult {
    return {
      id: a.id,
      title: a.title || b.title,
      author: a.author || b.author,
      coverUrl: a.coverUrl || b.coverUrl,
      description: (a.description?.length || 0) >= (b.description?.length || 0) ? a.description : b.description,
      sourceId: a.sourceId,
      sourceUrl: a.sourceUrl,
      downloadCount: a.downloadCount || b.downloadCount,
    };
  }

  async getNovelDetails(novelId: string): Promise<NovelDetails | null> {
    const { sourceId, sourceNovelId } = this.parseNovelId(novelId);
    const source = this._sources().find((s) => s.id === sourceId);
    if (!source) return null;

    const cacheKey = LocalCacheService.detailsKey(sourceId, sourceNovelId);
    const cached = await this.cache.get<NovelDetails>(cacheKey);
    if (cached) return cached;

    const details = await source.getNovelDetails(sourceNovelId);
    await this.cache.set(cacheKey, details, sourceId);
    return details;
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    const { sourceId, sourceNovelId } = this.parseNovelId(novelId);
    const source = this._sources().find((s) => s.id === sourceId);
    if (!source?.getChapters) return [];

    const cacheKey = LocalCacheService.chaptersKey(sourceId, sourceNovelId);
    const cached = await this.cache.get<Chapter[]>(cacheKey);
    if (cached) return cached;

    const chapters = await source.getChapters!(sourceNovelId);
    await this.cache.set(cacheKey, chapters, sourceId);
    return chapters;
  }

  async getChapterContent(novelId: string, chapterId: string): Promise<{ title: string; content: string; sourceUrl?: string }> {
    const { sourceId, sourceNovelId } = this.parseNovelId(novelId);
    const source = this._sources().find((s) => s.id === sourceId);

    if (source && 'getChapterContent' in source) {
      return (source as any).getChapterContent(sourceNovelId, chapterId);
    }
    return {
      title: `Chapter ${chapterId}`,
      content: '<p>Content preview not available directly. Please view on the novel source website.</p>'
    };
  }

  private parseNovelId(id: string): { sourceId: string; sourceNovelId: string } {
    const parts = id.split(':');
    if (parts.length >= 3 && parts[0] === 'novel') {
      return { sourceId: parts[1], sourceNovelId: parts.slice(2).join(':') };
    }
    return { sourceId: 'mock', sourceNovelId: id };
  }
}

/** Mock search adapter for development/testing. */
class MockSearchAdapter implements NovelSourceAdapter {
  readonly id = 'mock';
  readonly name = 'Mock Source (Development)';
  readonly isContentPermitted = true;

  private readonly mockNovels: NovelSearchResult[] = [
    { id: 'lord-of-mysteries', title: 'Lord of Mysteries', author: 'Cuttlefish', description: 'A modern fantasy tale.', sourceId: 'mock', sourceUrl: 'mock://lord-of-mysteries' },
    { id: 'solo-leveling', title: 'Solo Leveling', author: 'Chu-Gong', description: 'The weakest hunter becomes the strongest.', sourceId: 'mock', sourceUrl: 'mock://solo-leveling' },
    { id: 'omniscient-reader', title: 'Omniscient Reader', author: 'Sing-shong', description: 'A reader trapped in the web novel.', sourceId: 'mock', sourceUrl: 'mock://omniscient-reader' },
  ];

  async search(query: string): Promise<NovelSearchResult[]> {
    const lower = query.toLowerCase();
    return this.mockNovels.filter((n) => n.title.toLowerCase().includes(lower) || (n.author ?? '').toLowerCase().includes(lower));
  }

  async getNovelDetails(novelId: string): Promise<NovelDetails> {
    const novel = this.mockNovels.find((n) => n.id === novelId);
    if (!novel) throw new Error('Novel not found');
    return {
      id: `novel:${this.id}:${novelId}`,
      title: novel.title,
      alternativeTitles: [],
      author: novel.author,
      description: novel.description,
      sourceUrl: novel.sourceUrl,
      sourceId: this.id,
      totalChapters: 540,
      status: 'completed',
      genres: ['Fantasy', 'Mystery'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: Array.from({ length: 540 }, (_, i) => ({
        id: `chapter:${this.id}:${novelId}:${i + 1}`,
        novelId: `novel:${this.id}:${novelId}`,
        title: `Chapter ${i + 1}`,
        number: i + 1,
        sourceUrl: `mock://${novelId}/chapter/${i + 1}`,
        createdAt: Date.now(),
      })),
    } as NovelDetails;
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    const details = await this.getNovelDetails(novelId);
    return (details as any).chapters || [];
  }
}