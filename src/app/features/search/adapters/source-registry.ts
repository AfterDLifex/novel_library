import { SourceConfig } from './source.interface';

/**
 * Registry of all supported online novel sources.
 * Each source provides metadata and search capabilities.
 */
export const NOVEL_SOURCES: SourceConfig[] = [
  // Open Library - Free public JSON API, no key, CORS enabled, direct from the browser.
  // Reliable default: rich metadata + public-domain full-text (Internet Archive/Gutenberg).
  {
    id: 'openlibrary',
    name: 'Open Library',
    baseUrl: 'https://openlibrary.org',
    searchEndpoint: '/search.json',
    detailsEndpoint: '/works/{id}.json',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
    isJsonApi: true,
    stable: true
  },
  // Jikan API (MyAnimeList Light Novels Database) - Free public JSON API (rate-limited)
  {
    id: 'jikan',
    name: 'Jikan (MyAnimeList Light Novels)',
    baseUrl: 'https://api.jikan.moe/v4',
    searchEndpoint: '/manga?type=lightnovel&q={query}',
    detailsEndpoint: '/manga/{id}',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
    isJsonApi: true,
    stable: true
  },
  // Gutendex / Project Gutenberg - Free public domain books via JSON API.
  // Default readable source; direct from browser, works even when scraping sources fail.
  {
    id: 'gutendex',
    name: 'Project Gutenberg (Gutendex)',
    baseUrl: 'https://gutendex.com',
    searchEndpoint: '/books?search={query}',
    detailsEndpoint: '/books/{id}',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
    isJsonApi: true,
    stable: true,
    providesFullText: true,
  },
  // Wikisource - MediaWiki-based public-domain full-text library.
  // Provides parsed HTML of entire book pages and sub-chapter pages directly.
  {
    id: 'wikisource',
    name: 'Wikisource (Classic Literature)',
    baseUrl: 'https://en.wikisource.org',
    searchEndpoint: '/w/api.php?action=query&list=search&srsearch={query}&format=json&origin=*',
    detailsEndpoint: '/w/api.php?action=parse&page={id}&prop=text&format=json&origin=*',
    isContentPermitted: true,
    headers: { 'Accept': 'application/json' },
    isJsonApi: true,
    stable: true,
    providesFullText: true,
  },
  // HTML scraping-based sources below are kept selectable by the user, but are NOT
  // enabled by default because many sit behind bot protection (Cloudflare) and fail.
  {
    id: 'novelupdates',
    name: 'NovelUpdates',
    baseUrl: 'https://www.novelupdates.com',
    searchEndpoint: '/series-finder/',
    detailsEndpoint: '/series/{id}/',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
    stable: false
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
    stable: false
  },
  {
    id: 'scribblehub',
    name: 'Scribble Hub',
    baseUrl: 'https://www.scribblehub.com',
    searchEndpoint: '/?s={id}&post_type=fictionposts',
    detailsEndpoint: '/novel/{id}/',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
    stable: false
  },
  {
    id: 'wuxiaworld',
    name: 'WuxiaWorld',
    baseUrl: 'https://www.wuxiaworld.com',
    searchEndpoint: '/api/novels/search',
    detailsEndpoint: '/novel/{id}',
    isContentPermitted: false,
    headers: { 'Accept': 'application/json' },
    stable: false
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
    stable: false
  },
  {
    id: 'lightnovelworld',
    name: 'LightNovelWorld',
    baseUrl: 'https://www.lightnovelworld.com',
    searchEndpoint: '/search',
    detailsEndpoint: '/novel/{id}',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
    stable: false
  },
  {
    id: 'novelfull',
    name: 'NovelFull',
    baseUrl: 'https://novelfull.com',
    searchEndpoint: '/search',
    detailsEndpoint: '/{id}.html',
    isContentPermitted: false,
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
    stable: false
  },
  {
    id: 'webnovel',
    name: 'WebNovel',
    baseUrl: 'https://www.webnovel.com',
    searchEndpoint: '/search',
    detailsEndpoint: '/book/{id}',
    isContentPermitted: false,
    headers: { 'Accept': 'application/json' },
    stable: false
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
