import { NovelSourceAdapter } from './source.interface';
import { NovelSearchResult, NovelDetails, Chapter, Comment } from '../../../models';

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
    isContentPermitted = true
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
    return results.map((r) => ({ ...r, sourceId: this.sourceId, sourceName: this.name }));
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

    let comments: Comment[] = [];
    try {
      comments = await this.getComments(novelId);
    } catch {
      /* ignore comment failure */
    }

    return {
      id: `novel:${this.sourceId}:${novelId}`,
      title: data.title ?? 'Unknown Title',
      alternativeTitles: [],
      author: data.author,
      coverUrl: data.coverUrl,
      description: data.description,
      sourceUrl: data.sourceUrl ?? `${this.baseUrl}`,
      sourceId: this.sourceId,
      sourceName: this.name,
      rating: data.rating ?? 4.5,
      totalChapters: data.totalChapters,
      status: 'unknown',
      genres: data.genres ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: [] as Chapter[],
      comments,
    };
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    const url = `${this.baseUrl}/api/chapters?source=${encodeURIComponent(this.sourceId)}&id=${encodeURIComponent(novelId)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  }

  async getChapterContent(novelId: string, chapterId: string): Promise<{ title: string; content: string; sourceUrl?: string }> {
    const url = `${this.baseUrl}/api/chapter-content?source=${encodeURIComponent(this.sourceId)}&novelId=${encodeURIComponent(novelId)}&chapterId=${encodeURIComponent(chapterId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async getComments(novelId: string): Promise<Comment[]> {
    const url = `${this.baseUrl}/api/comments?source=${encodeURIComponent(this.sourceId)}&id=${encodeURIComponent(novelId)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  }
}
