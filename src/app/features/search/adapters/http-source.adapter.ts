import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';
import { NovelSourceAdapter, SourceConfig } from './source.interface';

/**
 * A generic HTTP-based source adapter.
 * Configurable via SourceConfig, allowing users to point to any compatible API.
 */
export class HttpSourceAdapter implements NovelSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly isContentPermitted: boolean;
  private readonly config: SourceConfig;

  constructor(config: SourceConfig) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.isContentPermitted = config.isContentPermitted;
  }

  async search(query: string): Promise<NovelSearchResult[]> {
    const qs = this.config.searchEndpoint.includes('?') ? '&' : '?';
    const url = `${this.config.baseUrl}${this.config.searchEndpoint}${qs}q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: this.config.headers });
    if (!response.ok) throw new Error(`${this.name} search failed: ${response.status}`);
    const data = await response.json();
    return this.normalizeSearchResults(data);
  }

  async getNovelDetails(novelId: string): Promise<NovelDetails> {
    const url = `${this.config.baseUrl}${this.config.detailsEndpoint.replace('{id}', novelId)}`;
    const response = await fetch(url, { headers: this.config.headers });
    if (!response.ok) throw new Error(`${this.name} details failed: ${response.status}`);
    const data = await response.json();
    return this.normalizeNovelDetails(data);
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    if (!this.config.chaptersEndpoint || !this.isContentPermitted) return [];
    const url = `${this.config.baseUrl}${this.config.chaptersEndpoint.replace('{id}', novelId)}`;
    const response = await fetch(url, { headers: this.config.headers });
    if (!response.ok) throw new Error(`${this.name} chapters failed: ${response.status}`);
    const data = await response.json();
    return this.normalizeChapters(data);
  }

  private normalizeSearchResults(data: any): NovelSearchResult[] {
    const arr = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    return arr.map((item: any) => ({
      id: item.id ?? item.key ?? '',
      title: item.title ?? item.name ?? '',
      author: item.author ?? item.authors?.[0]?.name,
      coverUrl: item.coverUrl ?? item.imageLinks?.thumbnail ?? item.image,
      description: item.description ?? '',
      sourceId: this.id,
      sourceUrl: `${this.config.baseUrl}${this.config.detailsEndpoint.replace('{id}', item.id ?? item.key ?? '')}`,
    }));
  }

  private normalizeNovelDetails(data: any): NovelDetails {
    return {
      id: `novel:${this.id}:${data.id ?? data.key ?? ''}`,
      title: data.title ?? data.name ?? '',
      alternativeTitles: data.alternativeTitles ?? data.altTitles ?? [],
      author: data.author ?? data.authors?.[0]?.name,
      coverUrl: data.coverUrl ?? data.imageLinks?.thumbnail ?? data.image,
      description: data.description ?? '',
      sourceUrl: data.url ?? `${this.config.baseUrl}${this.config.detailsEndpoint.replace('{id}', data.id ?? data.key ?? '')}`,
      sourceId: this.id,
      totalChapters: data.totalChapters ?? data.chaptersCount,
      status: this.mapStatus(data.status),
      genres: data.genres ?? data.categories ?? [],
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: data.updatedAt ?? Date.now(),
      chapters: [],
    };
  }

  private normalizeChapters(data: any): Chapter[] {
    if (!Array.isArray(data?.chapters)) return [];
    return data.chapters.map((ch: any, idx: number) => ({
      id: `chapter:${this.id}:${ch.id ?? ch.key ?? idx}`,
      novelId: '',
      title: ch.title ?? ch.name ?? `Chapter ${idx + 1}`,
      number: ch.number ?? ch.chapter ?? idx + 1,
      content: ch.content,
      sourceUrl: ch.url ?? ch.sourceUrl ?? '',
      publishedAt: ch.publishedAt,
      createdAt: ch.createdAt ?? Date.now(),
    }));
  }

  private mapStatus(status: string): Novel['status'] {
    const s = (status ?? '').toLowerCase();
    if (s.includes('complete')) return 'completed' as const;
    if (s.includes('ongoing') || s.includes('publish') || s.includes('update')) return 'ongoing' as const;
    if (s.includes('hiatus')) return 'hiatus' as const;
    return 'unknown' as const;
  }
}