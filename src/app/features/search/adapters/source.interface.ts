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
}

/** Adapter interface for novel search sources. */
export interface NovelSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly isContentPermitted: boolean;
  search(query: string): Promise<NovelSearchResult[]>;
  getNovelDetails(novelId: string): Promise<NovelDetails>;
  getChapters?(novelId: string): Promise<Chapter[]>;
}
