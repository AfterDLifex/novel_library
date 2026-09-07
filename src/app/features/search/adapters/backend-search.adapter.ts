import { NovelSourceAdapter } from './source.interface';
import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';

/**
 * Adapter that routes search/detail requests through the local backend
 * proxy server (server/src/server.js). The server performs the actual
 * requests to the novel websites server-side, bypassing browser CORS
 * restrictions and avoiding some bot-blocking issues.
 */
export class BackendSearchAdapter implements NovelSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly isContentPermitted: boolean;

  constructor(
    private readonly sourceId: string,
    private readonly sourceName: string,
    private readonly baseUrl: string,
    isContentPermitted = false
  ) {
    this.id = sourceId;
    this.name = sourceName;
    this.isContentPermitted = isContentPermitted;
  }

  async search(query: string): Promise<NovelSearchResult[]> {
    if (!query.trim()) return [];
    const url = `${this.baseUrl}/api/search?source=${encodeURIComponent(this.sourceId)}&q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url);
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch { /* ignore parse errors */ }
      throw new Error(message);
    }
    const results: NovelSearchResult[] = await res.json();
    return results.map((r) => ({ ...r, sourceId: this.sourceId }));
  }

  async getNovelDetails(novelId: string): Promise<NovelDetails> {
    const url = `${this.baseUrl}/api/details?source=${encodeURIComponent(this.sourceId)}&id=${encodeURIComponent(novelId)}`;
    const res = await fetch(url);
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch { /* ignore parse errors */ }
      throw new Error(message);
    }
    const data = await res.json();
    return {
      id: `novel:${this.sourceId}:${novelId}`,
      title: data.title ?? 'Unknown Title',
      alternativeTitles: [],
      author: data.author,
      coverUrl: data.coverUrl,
      description: data.description,
      sourceUrl: data.sourceUrl ?? `${this.baseUrl}`,
      sourceId: this.sourceId,
      totalChapters: data.totalChapters,
      status: 'unknown',
      genres: data.genres ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: [] as Chapter[],
    };
  }
}
