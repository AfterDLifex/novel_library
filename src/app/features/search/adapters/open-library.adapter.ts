import { NovelSourceAdapter } from './source.interface';
import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';

/**
 * Open Library search result document (one item of `docs`).
 * Docs: https://openlibrary.org/dev/docs/api/search
 */
interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  has_fulltext?: boolean;
  ebook_access?: string; // 'public' | 'borrowable' | 'printdisabled' | 'no ebook'
  subject?: string[];
  id_project_gutenberg?: string[];
 ia?: string[];
  language?: string[];
}

/** Work JSON returned by `https://openlibrary.org/works/{id}.json`. */
interface OpenLibraryWork {
  title?: string;
  description?: { type?: string; value?: string } | string;
  subjects?: string[];
  first_publish_date?: string;
  authors?: Array<{ author?: { key?: string }; name?: string }>;
}

/** Editions JSON entry — entries[i].ebooks[].read_url gives a real readable link. */
interface OpenLibraryEdition {
  title?: string;
  key?: string;
 ebooks?: Array<{ read_url?: string; preview_url?: string }>;
  identifiers?: { gutenberg?: string[] };
}

/**
 * Adapter for the Open Library public JSON API.

 * Why this is the reliable default:
 *   - 100% free, no API key, no registration (anonymous access works);
 *   - Stable infrastructure and CORS enabled (`Access-Control-Allow-Origin: *`),
 *     so it works DIRECTLY in the browser with no local proxy server or API key;
 *   - Aggregates millions of public-domain books/full-text via the Internet Archive and Gutenberg.


 * Docs: https://openlibrary.org/dev/docs/api/search
 */
export class OpenLibraryAdapter implements NovelSourceAdapter {
  readonly id = 'openlibrary';
  readonly name = 'Open Library';
  readonly isContentPermitted = true;
  readonly stable = true;

  private readonly baseUrl = 'https://openlibrary.org';

  private normalizeId(key: string | undefined): string {
    if (key) {
      return (key ?? '')
        .trim()
        .split('/')
        .filter(Boolean)
        .pop() || '';
    }
    return 'un' + Date.now() + Math.floor(Math.random() * 100000);
  }

  private coverUrl(cover_i?: number): string | undefined {
    return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-L.jpg` : undefined;
  }

  /** Strip an HTML payload / normalize to plain text. */
  private toPlain(description: OpenLibraryWork['description']): string {
    if (typeof description === 'string') return description.trim();
    if (description && typeof description === 'object' && 'value' in description) {
      return (description as { value?: string }).value?.trim() || '';
    }
    return '';
  }

  async search(query: string): Promise<NovelSearchResult[]> {
    if (!query.trim()) return [];
    try {
      const url =
        `${this.baseUrl}/search.json?q=${encodeURIComponent(query.trim())}&limit=40` +
        `&fields=key,title,author_name,cover_i,first_publish_year,has_fulltext,ebook_access,subject,id_project_gutenberg,ia,language`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Open Library API error: ${response.status}`);

      const data = await response.json() as { docs?: OpenLibraryDoc[] };
      return (data.docs ?? [])
        .map((doc) => {
          const id = this.normalizeId(doc.key);
          const subjects = (doc.subject ?? []).slice(0, 5);
          return {
            id,
            title: doc.title || 'Untitled',
            author: doc.author_name?.length ? doc.author_name[0] : undefined,
            coverUrl: this.coverUrl(doc.cover_i),
            description: subjects.length ? subjects.join(', ') : undefined,
            sourceId: this.id,
            sourceUrl: `${this.baseUrl}/works/${encodeURIComponent(id)}`,
            downloadCount: doc.first_publish_year,
          } as NovelSearchResult;
        })
        .filter((r) => r.title && r.title !== 'Untitled');
    } catch (error) {
      console.error('Open Library search error:', error);
      throw error;
    }
  }

  async getNovelDetails(novelId: string): Promise<NovelDetails> {
    try {
      const url = `${this.baseUrl}/works/${encodeURIComponent(novelId)}.json`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Open Library API error: ${response.status}`);

      const work: OpenLibraryWork = await response.json();
      const description = this.toPlain(work.description);
      const authors = (work.authors ?? []).map((a) => a.name || a.author?.key || '').filter(Boolean);

      return {
        id: `novel:${this.id}:${novelId}`,
        title: work.title || 'Unknown Title',
        alternativeTitles: [],
        author: authors[0] || undefined,
        description: description || 'No description available.',
        sourceUrl: `${this.baseUrl}/works/${encodeURIComponent(novelId)}`,
        sourceId: this.id,
        totalChapters: 1,
        status: 'completed',
        genres: (work.subjects ?? []).slice(0, 8),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters: [],
      };
    } catch (error) {
      console.error('Open Library details error:', error);
      throw error;
    }
  }

  /** Resolve a real "read online" URL where possible. */
  private async resolveReadUrl(novelId: string): Promise<{ url: string; site: string }> {
    // 1. Prefer a genuine readable edition (read_url / preview_url from the BookReader API).
    try {
      const editionsUrl =
        `${this.baseUrl}/works/${encodeURIComponent(novelId)}/editions.json?limit=8&fields=key,title,ebooks,identifiers`;
      const res = await fetch(editionsUrl, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json() as { entries?: OpenLibraryEdition[] };
        for (const entry of (data.entries ?? [])) {
          const ebook = (entry.ebooks ?? []).find((e) => e.read_url || e.preview_url);
          if (ebook?.read_url) return { url: ebook.read_url, site: 'Internet Archive (Open Library)' };
          if (ebook?.preview_url) return { url: ebook.preview_url, site: 'Internet Archive (Open Library)' };
          const gid = entry.identifiers?.gutenberg?.[0];
          if (gid) return { url: `https://www.gutenberg.org/ebooks/${gid}`, site: 'Project Gutenberg' };
        }
      }
    } catch { /* fall through to the work page link */ }

    // 2. Fallback: link to the Open Library work page (user can open any readable edition).
    return { url: `${this.baseUrl}/works/${encodeURIComponent(novelId)}`, site: 'Open Library' };
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    try {
      const details = await this.getNovelDetails(novelId);
      const read = await this.resolveReadUrl(novelId);
      return [{
        id: `chapter:${this.id}:${novelId}:1`,
        novelId: `novel:${this.id}:${novelId}`,
        title: details.title,
        number: 1,
        sourceUrl: read.url,
        content:
          `<p>This book from Open Library is available to read online — tap/click to open it:</p>` +
          `<p><a href="${read.url}" target="_blank" rel="noopener noreferrer">Read “${details.title}” on ${read.site}</a>.</p>`,
        createdAt: Date.now(),
        isContentAvailable: true,
      }];
    } catch (error) {
      console.error('Open Library chapters error:', error);
      return [];
    }
  }
}