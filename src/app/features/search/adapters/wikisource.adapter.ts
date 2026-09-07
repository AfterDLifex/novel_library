import { NovelSourceAdapter } from './source.interface';
import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';

interface WikiSearchResult {
  ns: number;
  title: string;
  pageid: number;
  size: number;
  wordcount: number;
  snippet: string;
  timestamp: string;
}

interface WikiSearchResponse {
  query: {
    searchinfo: { totalhits: number };
    search: WikiSearchResult[];
  };
}

interface WikiParseResponse {
  parse: {
    title: string;
    pageid: number;
    text: { '*': string };
    sections: Array<{ index: string; line: string; number: string }>;
  };
}

interface WikiCategoryMembersResponse {
  query: {
    categorymembers: Array<{ pageid: number; ns: number; title: string }>;
  };
}

const WS_API = 'https://en.wikisource.org/w/api.php';
const ORIGIN = '&origin=*';

/**
 * Adapter for the Wikisource MediaWiki API.
 * Provides access to full public-domain text for classic literature
 * hosted on English Wikisource.
 *
 * API reference: https://www.mediawiki.org/wiki/API:Get_the_contents_of_a_page
 */
export class WikisourceAdapter implements NovelSourceAdapter {
  readonly id = 'wikisource';
  readonly name = 'Wikisource (Classic Literature)';
  readonly isContentPermitted = true;
  readonly stable = true;

  // ─── Search ─────────────────────────────────────────────────────────────────

  async search(query: string): Promise<NovelSearchResult[]> {
    if (!query.trim()) return [];

    try {
      const url =
        `${WS_API}?action=query&list=search&srsearch=${encodeURIComponent(query.trim())}` +
        `&srnamespace=0&srlimit=20&srprop=snippet|size|wordcount&format=json${ORIGIN}`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Wikisource API error: ${res.status}`);

      const data: WikiSearchResponse = await res.json();
      const results = data.query?.search ?? [];

      return results.map((item) => ({
        id: String(item.pageid),
        title: item.title,
        author: this.guessAuthorFromTitle(item.title),
        coverUrl: undefined,
        description: this.stripHtml(item.snippet),
        sourceId: this.id,
        sourceName: this.name,
        sourceUrl: `https://en.wikisource.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        downloadCount: item.wordcount,
      }));
    } catch (error) {
      throw error;
    }
  }

  // ─── Details ────────────────────────────────────────────────────────────────

  async getNovelDetails(novelId: string): Promise<NovelDetails> {
    try {
      // novelId may be a pageId (numeric) or a page title slug
      const param = /^\d+$/.test(novelId)
        ? `pageids=${novelId}`
        : `titles=${encodeURIComponent(novelId)}`;

      const url =
        `${WS_API}?action=query&${param}&prop=revisions|categories&rvprop=content&cllimit=10&format=json${ORIGIN}`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Wikisource API error: ${res.status}`);

      const data = await res.json();
      const pages: Record<string, any> = data.query?.pages ?? {};
      const page = Object.values(pages)[0] as any;
      if (!page || page.missing) throw new Error('Page not found on Wikisource');

      const title: string = page.title;
      const categories: string[] = (page.categories ?? []).map((c: any) =>
        (c.title as string).replace(/^Category:/, '')
      );

      const chapters = await this.buildChapterList(title);

      return {
        id: `novel:${this.id}:${page.pageid}`,
        title,
        alternativeTitles: [],
        author: this.guessAuthorFromTitle(title),
        description: `Public-domain text hosted on English Wikisource.\n\nCategories: ${categories.slice(0, 5).join(', ') || 'N/A'}`,
        sourceUrl: `https://en.wikisource.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        sourceId: this.id,
        sourceName: this.name,
        status: 'completed',
        genres: categories.slice(0, 5),
        totalChapters: chapters.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters,
        languages: ['en'],
      };
    } catch (error) {
      throw error;
    }
  }

  // ─── Chapters ───────────────────────────────────────────────────────────────

  async getChapters(novelId: string): Promise<Chapter[]> {
    const details = await this.getNovelDetails(novelId);
    return details.chapters;
  }

  // ─── Chapter content ────────────────────────────────────────────────────────

  /**
   * Returns the full parsed HTML of a Wikisource page.
   * novelId — the numeric pageId stored on the novel
   * chapterId — format: chapter:wikisource:<pageId>:<chapterIndex>
   */
  async getChapterContent(
    novelId: string,
    chapterId: string
  ): Promise<{ title: string; content: string; sourceUrl?: string }> {
    try {
      // chapterId: "chapter:wikisource:<pageId>:<encodedTitle>"
      const parts = chapterId.split(':');
      const encodedTitle = parts.slice(3).join(':');
      const pageTitle = decodeURIComponent(encodedTitle);

      const url =
        `${WS_API}?action=parse&page=${encodeURIComponent(pageTitle)}` +
        `&prop=text&disablelimitreport=1&format=json${ORIGIN}`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Wikisource content error: ${res.status}`);

      const data: WikiParseResponse = await res.json();
      const rawHtml = data.parse?.text?.['*'] ?? '<p>Content not available.</p>';

      // Clean Wikisource chrome: remove edit/nav toolbars, fix relative links
      const cleaned = this.cleanWikisourceHtml(rawHtml);

      return {
        title: data.parse?.title ?? pageTitle,
        content: cleaned,
        sourceUrl: `https://en.wikisource.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
      };
    } catch (error) {
      return {
        title: 'Error',
        content: '<p>Failed to load chapter content from Wikisource.</p>',
      };
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Tries to build a chapter list from sub-pages of the given title.
   * Falls back to a single "Full text" chapter when no sub-pages exist.
   */
  private async buildChapterList(pageTitle: string): Promise<Chapter[]> {
    try {
      // Ask for pages in the category or sub-pages
      const url =
        `${WS_API}?action=query&list=allpages` +
        `&apprefix=${encodeURIComponent(pageTitle + '/')}&apnamespace=0&aplimit=50&format=json${ORIGIN}`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      const subPages: Array<{ pageid: number; title: string }> =
        data.query?.allpages ?? [];

      if (subPages.length > 0) {
        return subPages.map((p, i) => ({
          id: `chapter:${this.id}:${encodeURIComponent(pageTitle)}:${encodeURIComponent(p.title)}`,
          novelId: `novel:${this.id}:${p.pageid}`,
          title: p.title.replace(`${pageTitle}/`, '').trim() || `Chapter ${i + 1}`,
          number: i + 1,
          sourceUrl: `https://en.wikisource.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
          createdAt: Date.now(),
          isContentAvailable: true,
        }));
      }
    } catch {
      // fall through to single-chapter fallback
    }

    // Fallback: entire page is one readable unit
    return [
      {
        id: `chapter:${this.id}:${encodeURIComponent(pageTitle)}:${encodeURIComponent(pageTitle)}`,
        novelId: `novel:${this.id}:0`,
        title: 'Full Text',
        number: 1,
        sourceUrl: `https://en.wikisource.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
        createdAt: Date.now(),
        isContentAvailable: true,
      },
    ];
  }

  /** Remove Wikisource UI elements that shouldn't appear in the reader. */
  private cleanWikisourceHtml(html: string): string {
    return html
      // Remove edit section links
      .replace(/<span class="mw-editsection[^"]*"[\s\S]*?<\/span>/g, '')
      // Remove navigation tables / header boxes
      .replace(/<table[^>]*class="[^"]*navigation[^"]*"[\s\S]*?<\/table>/gi, '')
      .replace(/<table[^>]*class="[^"]*header[^"]*"[\s\S]*?<\/table>/gi, '')
      // Fix relative src/href → absolute
      .replace(/href="\/wiki\//g, 'href="https://en.wikisource.org/wiki/')
      .replace(/src="\/\/upload/g, 'src="https://upload');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
  }

  /**
   * Heuristic: Wikisource page titles often follow "Work/Author" or
   * just the work title. When an author subpage like "Author:Name" is
   * embedded, extract it — otherwise return empty so the UI shows nothing.
   */
  private guessAuthorFromTitle(title: string): string | undefined {
    // Pattern: "Work (Author Name)" e.g. "Frankenstein (Shelley)"
    const parens = title.match(/\(([^)]+)\)$/);
    if (parens) return parens[1];
    return undefined;
  }
}
