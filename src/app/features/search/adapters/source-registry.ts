import { SourceConfig } from './source.interface';

/**
 * Registry of all supported online novel sources.
 * Each source provides metadata and search capabilities.
 */
export const NOVEL_SOURCES: SourceConfig[] = [
  // Jikan API (MyAnimeList Light Novels Database) - Free public API
  {
    id: 'jikan',
    name: 'Jikan (MyAnimeList Light Novels)',
    baseUrl: 'https://api.jikan.moe/v4',
    searchEndpoint: '/manga?type=lightnovel&q={query}',
    detailsEndpoint: '/manga/{id}',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
    isJsonApi: true
  },
  // Gutendex / Project Gutenberg - Free public domain books via JSON API
  {
    id: 'gutendex',
    name: 'Project Gutenberg (Gutendex)',
    baseUrl: 'https://gutendex.com',
    searchEndpoint: '/books?search={query}',
    detailsEndpoint: '/books/{id}',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
    isJsonApi: true
  },
  // Other sources (HTML scraping-based, may not work reliably due to bot protection)
  {
    id: 'novelupdates',
    name: 'NovelUpdates',
    baseUrl: 'https://www.novelupdates.com',
    searchEndpoint: '/series-finder/',
    detailsEndpoint: '/series/{id}/',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  },
  {
    id: 'royalroad',
    name: 'Royal Road',
    baseUrl: 'https://www.royalroad.com',
    searchEndpoint: '/fictions/search',
    detailsEndpoint: '/fiction/{id}',
    chaptersEndpoint: '/fiction/{id}/chapters',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
  },
  {
    id: 'scribblehub',
    name: 'Scribble Hub',
    baseUrl: 'https://www.scribblehub.com',
    searchEndpoint: '/?s={id}&post_type=fictionposts',
    detailsEndpoint: '/novel/{id}/',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  },
  {
    id: 'wuxiaworld',
    name: 'WuxiaWorld',
    baseUrl: 'https://www.wuxiaworld.com',
    searchEndpoint: '/api/novels/search',
    detailsEndpoint: '/novel/{id}',
    isContentPermitted: false,
    headers: { 'Accept': 'application/json' },
  },
  {
    id: 'boxnovel',
    name: 'BoxNovel',
    baseUrl: 'https://boxnovel.com',
    searchEndpoint: '/',
    detailsEndpoint: '/novel/{id}/',
    chaptersEndpoint: '/novel/{id}/chapter-{chapter}/',
    isContentPermitted: true,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  },
  {
    id: 'lightnovelworld',
    name: 'LightNovelWorld',
    baseUrl: 'https://www.lightnovelworld.com',
    searchEndpoint: '/search',
    detailsEndpoint: '/novel/{id}',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  },
  {
    id: 'novelfull',
    name: 'NovelFull',
    baseUrl: 'https://novelfull.com',
    searchEndpoint: '/search',
    detailsEndpoint: '/{id}.html',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  },
  {
    id: 'webnovel',
    name: 'WebNovel',
    baseUrl: 'https://www.webnovel.com',
    searchEndpoint: '/search',
    detailsEndpoint: '/book/{id}',
    isContentPermitted: false,
    headers: { 'Accept': 'application/json' },
  },
];

/**
 * Get a source config by its ID.
 */
export function getSourceById(id: string): SourceConfig | undefined {
  return NOVEL_SOURCES.find((s) => s.id === id);
}

/**
 * Get all source configs.
 */
export function getAllSources(): SourceConfig[] {
  return [...NOVEL_SOURCES];
}
