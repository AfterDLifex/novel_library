import { HttpSourceAdapter } from './http-source.adapter';
import { SourceConfig } from './source.interface';
import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';

/**
 * A JSON API-based source adapter that extends HttpSourceAdapter.
 * Handles JSON responses from APIs like Gutendex.
 */
export class JsonApiAdapter extends HttpSourceAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  /**
   * Override search to handle JSON response from API sources.
   */
  override async search(query: string): Promise<NovelSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const url = this.buildSearchUrl(query);
    const response = await this.fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseSearchResponse(data);
  }

  /**
   * Override details to handle JSON response from API sources.
   */
  override async getNovelDetails(novelId: string): Promise<NovelDetails> {
    const url = this.buildDetailsUrl(novelId);
    const response = await this.fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseDetailsResponse(data, novelId);
  }

  private parseSearchResponse(data: any): NovelSearchResult[] {
    // Handle response format with results array
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((book: any) => ({
        id: String(book.id),
        title: book.title,
        author: book.authors && book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
        coverUrl: book.formats?.['image/jpeg'] || undefined,
        description: book.subjects?.slice(0, 3).join(', ') || '',
        sourceId: this.config.id,
        sourceUrl: book.formats?.['text/html'] || `https://www.gutenberg.org/ebooks/${book.id}`,
        downloadCount: book.download_count
      }));
    }
    return [];
  }

  private parseDetailsResponse(data: any, novelId: string): NovelDetails {
    return {
      id: `novel:${this.config.id}:${novelId}`,
      title: data.title,
      alternativeTitles: [],
      author: data.authors && data.authors.length > 0 ? data.authors[0].name : 'Unknown Author',
      description: data.subjects?.join('\n') || 'No description available.',
      sourceUrl: data.formats?.['text/html'] || `https://www.gutenberg.org/ebooks/${data.id}`,
      sourceId: this.config.id,
      totalChapters: 0,
      status: 'completed',
      genres: data.subjects?.slice(0, 5) || [],
      coverUrl: data.formats?.['image/jpeg'] || undefined,
      downloadCount: data.download_count,
      languages: data.languages,
      bookshelves: data.bookshelves,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: []
    };
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        headers: this.config.headers || { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private buildSearchUrl(query: string): string {
    const endpoint = this.config.searchEndpoint.replace('{query}', encodeURIComponent(query.trim()));
    return `${this.config.baseUrl}${endpoint}`;
  }

  private buildDetailsUrl(novelId: string): string {
    const endpoint = this.config.detailsEndpoint.replace('{id}', novelId);
    return `${this.config.baseUrl}${endpoint}`;
  }
}
