/**
 * Per-source search/detail definitions for the proxy server.
 * Each source knows how to build a search URL, fetch it, and parse the
 * response (HTML via cheerio, or JSON APIs) into a normalized shape.
 */
const cheerio = require('cheerio');

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
  'User-Agent': BROWSER_UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Fetch a URL with timeout and browser-like headers. */
async function fetchPage(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      signal: controller.signal,
      redirect: 'follow',
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function absUrl(base, href) {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// HTML parsing helpers
// ---------------------------------------------------------------------------

/** Royal Road search results page. */
function parseRoyalRoadSearch(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];
  $('div.fiction-list-item').each((_, el) => {
    const item = $(el);
    const titleEl = item.find('h2 a[href*="/fiction/"]').first();
    const title = clean(titleEl.text());
    const href = titleEl.attr('href') || '';
    const cover = item.find('img').first().attr('src') || item.find('img').first().attr('data-src');
    const description = clean(item.find('.fiction-list-item__description, .description, div.margin-bottom-10 ~ div').first().text());
    if (title && href) {
      results.push({
        id: href.replace(/^\/fiction\//, '').replace(/\/$/, ''),
        title,
        author: clean(item.find('.author').first().text()).replace(/^by\s*/i, '') || undefined,
        coverUrl: cover ? absUrl(baseUrl, cover) : undefined,
        description: description || undefined,
        sourceUrl: absUrl(baseUrl, href),
      });
    }
  });
  return results;
}

/** NovelFull search results page. */
function parseNovelFullSearch(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];
  $('.list-truyen .row, .list.list-truyen .row').each((_, el) => {
    const row = $(el);
    const titleEl = row.find('h3 a, .truyen-title a').first();
    const title = clean(titleEl.text());
    const href = titleEl.attr('href') || '';
    const cover = row.find('img').first().attr('src') || row.find('img').first().attr('data-src');
    const author = clean(row.find('.author, .text-info a').first().text());
    if (title && href) {
      results.push({
        id: href.replace(/^\/+/, '').replace(/\.html$/, ''),
        title,
        author: author || undefined,
        coverUrl: cover ? absUrl(baseUrl, cover) : undefined,
        sourceUrl: absUrl(baseUrl, href),
      });
    }
  });
  return results;
}

/** LightNovelWorld search results page. */
function parseLightNovelWorldSearch(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];
  $('.novel-item, .novel-horizontal, .novel-list-item').each((_, el) => {
    const item = $(el);
    const titleEl = item.find('.novel-title a, h3 a, h2 a, a[href*="/novel/"]').first();
    const title = clean(titleEl.text());
    const href = titleEl.attr('href') || '';
    const cover = item.find('img').first().attr('src') || item.find('img').first().attr('data-src');
    if (title && href) {
      results.push({
        id: href.replace(/^\/novel\//, '').replace(/\/$/, ''),
        title,
        author: clean(item.find('.author, .novel-author').first().text()) || undefined,
        coverUrl: cover ? absUrl(baseUrl, cover) : undefined,
        description: clean(item.find('.novel-desc, .summary').first().text()) || undefined,
        sourceUrl: absUrl(baseUrl, href),
      });
    }
  });
  return results;
}

/** NovelUpdates series-finder results page. */
function parseNovelUpdatesSearch(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];
  $('div.search_main_box_nu, .search_main_box').each((_, el) => {
    const box = $(el);
    const titleEl = box.find('.search_title a, .search-title a').first();
    const title = clean(titleEl.text());
    const href = titleEl.attr('href') || '';
    const cover = box.find('img').first().attr('src') || box.find('img').first().attr('data-src');
    const genre = clean(box.find('.show_tags').first().text());
    if (title && href) {
      results.push({
        id: href,
        title,
        coverUrl: cover ? absUrl(baseUrl, cover) : undefined,
        description: genre || undefined,
        sourceUrl: absUrl(baseUrl, href),
      });
    }
  });
  return results;
}

/** Generic novel details page parsers (Royal Road / NovelFull / LNWorld / NU). */
function parseGenericDetails(html, baseUrl, config) {
  const $ = cheerio.load(html);
  const title = clean(
    $(config.detailsTitleSelector).first().text() || $('h1').first().text()
  );
  const description = clean(
    $(config.detailsDescSelector).first().text() ||
    $('meta[name="description"]').attr('content') ||
    ''
  );
  const cover =
    $(config.detailsCoverSelector).first().attr('src') ||
    $(config.detailsCoverSelector).first().attr('data-src') ||
    $('meta[property="og:image"]').attr('content');
  const genres = [];
  $(config.detailsGenresSelector).each((_, el) => {
    const g = clean($(el).text());
    if (g) genres.push(g);
  });
  return {
    title: title || 'Unknown Title',
    description: description || 'No description available.',
    coverUrl: cover ? absUrl(baseUrl, cover) : undefined,
    genres,
  };
}

// ---------------------------------------------------------------------------
// Source registry (server-side)
// ---------------------------------------------------------------------------

const SOURCES = {
  royalroad: {
    id: 'royalroad',
    name: 'Royal Road',
    baseUrl: 'https://www.royalroad.com',
    buildSearchUrl: (q) => `https://www.royalroad.com/fictions/search?keyword=${encodeURIComponent(q)}`,
    parseSearch: (html, baseUrl) => parseRoyalRoadSearch(html, baseUrl),
    detailsTitleSelector: 'h1.font-white, h1.fiction-title',
    detailsDescSelector: '.description',
    detailsCoverSelector: '.fiction-info img, .cover-image',
    detailsGenresSelector: '.fiction-genres a, .tags li a',
    buildDetailsUrl: (id) => `https://www.royalroad.com/fiction/${id}`,
  },
  novelfull: {
    id: 'novelfull',
    name: 'NovelFull',
    baseUrl: 'https://novelfull.com',
    buildSearchUrl: (q) => `https://novelfull.com/search?keyword=${encodeURIComponent(q)}`,
    parseSearch: (html, baseUrl) => parseNovelFullSearch(html, baseUrl),
    detailsTitleSelector: 'h1.title',
    detailsDescSelector: '.desc-text',
    detailsCoverSelector: '.book img',
    detailsGenresSelector: '.info a, .list-info a',
    buildDetailsUrl: (id) => `https://novelfull.com/${id}.html`,
  },
  lightnovelworld: {
    id: 'lightnovelworld',
    name: 'LightNovelWorld',
    baseUrl: 'https://www.lightnovelworld.com',
    buildSearchUrl: (q) => `https://www.lightnovelworld.com/search?q=${encodeURIComponent(q)}`,
    parseSearch: (html, baseUrl) => parseLightNovelWorldSearch(html, baseUrl),
    detailsTitleSelector: 'h1.novel-title, .novel-title',
    detailsDescSelector: '.content, .summary',
    detailsCoverSelector: '.cover img, .novel-cover img',
    detailsGenresSelector: '.genres li a, .genre a',
    buildDetailsUrl: (id) => `https://www.lightnovelworld.com/novel/${id}`,
  },
  novelupdates: {
    id: 'novelupdates',
    name: 'NovelUpdates',
    baseUrl: 'https://www.novelupdates.com',
    buildSearchUrl: (q) => `https://www.novelupdates.com/series-finder/?sf=1&sh=${encodeURIComponent(q)}`,
    parseSearch: (html, baseUrl) => parseNovelUpdatesSearch(html, baseUrl),
    detailsTitleSelector: 'h1.entry-title, .seriestitle',
    detailsDescSelector: '#editdescription, .seriesdescription',
    detailsCoverSelector: '.seriesimg img',
    detailsGenresSelector: '#seriesgenre a, .genre a',
    buildDetailsUrl: (id) => `https://www.novelupdates.com/series/${id}`,
  },
  syosetu: {
    id: 'syosetu',
    name: 'Shousetsuka ni Narou (Syosetu)',
    baseUrl: 'https://ncode.syosetu.com',
    // Official JSON API — no HTML parsing needed.
    buildSearchUrl: (q) =>
      `https://api.syosetu.com/novelapi/api/?out=json&of=t-n-w-s-ga-nt-gn&word=${encodeURIComponent(q)}&lim=20`,
    isJsonApi: true,
    parseSearch: (data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((item) => item.title)
        .map((item) => ({
          id: item.ncode,
          title: item.title,
          author: item.writer || undefined,
          description: item.story || undefined,
          sourceUrl: `https://ncode.syosetu.com/${item.ncode}/`,
        }));
    },
    buildDetailsUrl: (id) =>
      `https://api.syosetu.com/novelapi/api/?out=json&of=t-n-w-s-ga-nt-gn&ncode=${encodeURIComponent(id)}`,
    isJsonDetails: true,
    parseDetails: (data) => {
      const item = Array.isArray(data) ? data[0] : data;
      if (!item) throw new Error('Novel not found on Syosetu');
      return {
        title: item.title,
        description: item.story || 'No description available.',
        genres: item.genre ? [String(item.genre)] : [],
        totalChapters: item.general_all_no,
      };
    },
  },
};

function listSources() {
  return Object.values(SOURCES).map(({ id, name, baseUrl }) => ({ id, name, baseUrl }));
}

async function searchSource(sourceId, query) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error(`Unknown source: ${sourceId}`);
  const url = source.buildSearchUrl(query);
  const res = await fetchPage(url, source.isJsonApi ? { 'Accept': 'application/json' } : {});
  if (!res.ok) throw new Error(`Source returned HTTP ${res.status}`);
  if (source.isJsonApi) {
    return source.parseSearch(await res.json());
  }
  return source.parseSearch(await res.text(), source.baseUrl);
}

async function getDetails(sourceId, novelId) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error(`Unknown source: ${sourceId}`);
  const url = source.buildDetailsUrl(novelId);
  const res = await fetchPage(url, source.isJsonDetails ? { 'Accept': 'application/json' } : {});
  if (!res.ok) throw new Error(`Source returned HTTP ${res.status}`);
  if (source.isJsonDetails) {
    const parsed = source.parseDetails(await res.json());
    return { ...parsed, sourceUrl: `https://ncode.syosetu.com/${novelId}/` };
  }
  return parseGenericDetails(await res.text(), source.baseUrl, source);
}

module.exports = { listSources, searchSource, getDetails };


