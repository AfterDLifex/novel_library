import { NovelSourceAdapter } from './source.interface';
import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';

interface GutendexBook {
  id: number;
  title: string;
  authors: Array<{ name: string; birth_year: number | null; death_year: number | null }>;
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: {
    'text/html'?: string;
    'application/epub+zip'?: string;
    'application/x-mobipocket-ebook'?: string;
    'application/rdf+xml'?: string;
    'image/jpeg'?: string;
    'text/plain; charset=utf-8'?: string;
    'text/plain'?: string;
  };
  download_count: number;
}

interface GutendexSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

/**
 * Adapter for the Gutendex API (Project Gutenberg).
 * Provides access to thousands of free public domain books.
 * API docs: https://gutendex.com/
 */
export class GutendexAdapter implements NovelSourceAdapter {
  readonly id = 'gutendex';
  readonly name = 'Project Gutenberg (Gutendex)';
  readonly isContentPermitted = true;
  readonly stable = true;

  private readonly baseUrl = 'https://gutendex.com';

  async search(query: string): Promise<NovelSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/books?search=${encodeURIComponent(query.trim())}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Gutendex API error: ${response.status}`);
      }

      const data: GutendexSearchResponse = await response.json();
      
      return data.results.map(book => ({
        id: String(book.id),
        title: book.title,
        author: book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
        coverUrl: book.formats['image/jpeg'] || undefined,
        description: book.subjects.slice(0, 3).join(', '),
        sourceId: this.id,
        sourceUrl: book.formats['text/html'] || `https://www.gutenberg.org/ebooks/${book.id}`,
        downloadCount: book.download_count
      }));
    } catch (error) {
      console.error('Gutendex search error:', error);
      throw error;
    }
  }

  async getNovelDetails(novelId: string): Promise<NovelDetails> {
    try {
      const url = `${this.baseUrl}/books/${novelId}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Gutendex API error: ${response.status}`);
      }

      const book: GutendexBook = await response.json();

      return {
        id: `novel:${this.id}:${book.id}`,
        title: book.title,
        alternativeTitles: [],
        author: book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
        description: book.subjects.join('\n') || 'No description available.',
        sourceUrl: book.formats['text/html'] || `https://www.gutenberg.org/ebooks/${book.id}`,
        sourceId: this.id,
        totalChapters: 0,
        status: 'completed',
        genres: book.subjects.slice(0, 5),
        coverUrl: book.formats['image/jpeg'] || undefined,
        downloadCount: book.download_count,
        languages: book.languages,
        bookshelves: book.bookshelves,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters: []
      };
    } catch (error) {
      console.error('Gutendex details error:', error);
      throw error;
    }
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    try {
      const details = await this.getNovelDetails(novelId);
      
      // Return the book itself as a single chapter with the HTML link
      return [{
        id: `chapter:${this.id}:${novelId}:1`,
        novelId: `novel:${this.id}:${novelId}`,
        title: details.title,
        number: 1,
        sourceUrl: details.sourceUrl,
        content: 'Read this book on Project Gutenberg',
        createdAt: Date.now(),
        isContentAvailable: true
      }];
    } catch (error) {
      console.error('Gutendex chapters error:', error);
      return [];
    }
  }

  /**
   * Fetches the plain text content of a book from Project Gutenberg.
   * This can be used to display the full book content in the reader.
   */
  async getChapterContent(chapterId: string): Promise<string> {
    try {
      const novelId = chapterId.split(':')[2];
      const url = `${this.baseUrl}/books/${novelId}`;
      const response = await fetch(url);
      const book: GutendexBook = await response.json();
      
      // Get the plain text URL
      const textUrl = book.formats['text/plain; charset=utf-8'] || book.formats['text/plain'];
      
      if (textUrl) {
        const textResponse = await fetch(textUrl);
        return await textResponse.text();
      }
      
      return 'Text version not available. Please read on Project Gutenberg website.';
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      return 'Error loading content.';
    }
  }
}
