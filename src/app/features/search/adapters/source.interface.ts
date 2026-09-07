import { NovelSearchResult, NovelDetails, Chapter } from '../../../models';

/** Configuration for a source that provides novel metadata via HTTP. */
export interface SourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  searchEndpoint: string;
  detailsEndpoint: string;
  chaptersEndpoint?: string;
  isContentPermitted: boolean;
  headers?: Record<string, string>;
  /** Whether this source uses a JSON API (true) or HTML scraping (false) */
  isJsonApi?: boolean;
  /**
   * True for reliable, dependency-free sources that are enabled by default
   * (stable JSON APIs reachable directly from the browser, e.g. Gutendex,
   * Open Library). False for sources that scrape sites behind bot protection
   * and may fail — these stay available in the source filters but are OFF by
   * default so they don't spam errors on a normal search.
   */
  stable?: boolean;
}

/** Adapter interface for novel search sources. */
export interface NovelSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly isContentPermitted: boolean;
  /** Reliable defaults are active out-of-the-box; scraping sources default to OFF. */
  readonly stable?: boolean;
  search(query: string): Promise<NovelSearchResult[]>;
  getNovelDetails(novelId: string): Promise<NovelDetails>;
  getChapters?(novelId: string): Promise<Chapter[]>;
}
