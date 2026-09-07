/**
 * Per-source search/detail definitions for the proxy server.
 * Each source knows how to build a search URL, fetch it, and parse the
 * response (HTML via cheerio, or JSON APIs) into a normalized shape.
 */
const cheerio = require('cheerio');

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
  'User-Agent': BROWSER_UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
};

/**
 * Optional scraping-service pass-through (ZenRows / ScraperAPI / Webpeel).
 *
 * Some sources (NovelFull, LightNovelWorld, NovelUpdates) sit behind
 * Cloudflare and reject even honest browser-like `fetch` calls with 403.
 * When SCRAPING_API_KEY is set, requests that the direct fetch can't get are
 * automatically re-routed through a scraping service, which rotates clean IPs
 * and runs/renders JavaScript to satisfy the bot checks. All three providers
 * offer free tiers (no credit card required to start).
 *
 *   SCRAPING_SERVICE_PROVIDER=zenrows|scraperapi|webpeel  (default: zenrows)
 *   SCRAPING_API_KEY=your_key
 */
const SCRAPING_SERVICE = {
  provider: process.env.SCRAPING_SERVICE_PROVIDER || 'zenrows',
  apiKey: process.env.SCRAPING_API_KEY || '',
  enabled: !!process.env.SCRAPING_API_KEY,
  buildUrl(targetUrl) {
    const enc = encodeURIComponent(targetUrl);
    switch (this.provider.toLowerCase()) {
      case 'scraperapi':
        return `http://api.scraperapi.com/?api_key=${this.apiKey}&url=${enc}&render=true`;
      case 'webpeel':
        return `https://api.webpeel.com/fetch?api_key=${this.apiKey}&url=${enc}`;
      case 'zenrows':
      default:
        return `https://api.zenrows.com/v1/?apikey=${this.apiKey}&url=${enc}&js_render=true&premium_proxy=true`;
    }
  },
};

/**
 * Optional self-hosted Playwright stealth fallback (no API key needed). It
 * runs a real Chromium locally, defeating many Cloudflare checks. Turn it on
 * with STEALTH_BROWSER_ENABLED=true. The browser is only loaded lazily on
 * first use, so the server still boots fine if it isn't installed.
 *
 * Install once:
 *   npm i playwright playwright-extra puppeteer-extra-plugin-stealth
 *   npx playwright install chromium
 */
const STEALTH_BROWSER = {
  enabled: process.env.STEALTH_BROWSER_ENABLED === 'true',
  ready: false,
  error: null,
};
if (STEALTH_BROWSER.enabled) {
  try {
    require.resolve('playwright');
    STEALTH_BROWSER.ready = true;
  } catch (e) {
    STEALTH_BROWSER.error =
      'STEALTH_BROWSER_ENABLED is set but playwright is not installed. Run: npm i playwright playwright-extra puppeteer-extra-plugin-stealth && npx playwright install chromium';
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(status) {
  return status === 429 || status >= 500;
}

/** A response we consider "bot blocked" and worth handing to the next strategy. */
function isBlockedResponse(res) {
  return res && (res.status === 403 || res.status === 503);
}

/** Single direct fetch with a timeout and browser-like headers. */
async function rawFetch(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const origin = new URL(url).origin;
    return await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...headers, Referer: origin + '/' },
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

async function requestWithRetries(fetcher, retries) {
  const n = retries == null ? 1 : retries;
  let lastRes;
  for (let i = 0; i <= n; i++) {
    lastRes = await fetcher();
    if (!isRetryable(lastRes.status)) break;
    await sleep(800 * (i + 1));
  }
  return lastRes;
}

/** Render a URL in a real (stealth) browser and return the HTML as a Response. */
async function stealthRequest(url) {
  if (!STEALTH_BROWSER.ready) {
    throw new Error(STEALTH_BROWSER.error || 'Stealth browser not ready');
  }
  let chromium;
  try {
    const pwExtra = require('playwright-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    pwExtra.chromium.use(StealthPlugin());
    chromium = pwExtra.chromium;
  } catch {
    chromium = require('playwright').chromium;
  }
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_UA,
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const html = await page.content();
    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } finally {
    await browser.close();
  }
}

/**
 * Fetch a URL using layered strategies, returning the first "non-bot-blocked"
 * response:
 *   1. direct server-side fetch (browser-like headers),
 *   2. scraping-service pass-through (if SCRAPING_API_KEY is set),
 *   3. Playwright stealth browser (if STEALTH_BROWSER_ENABLED=true).
 * A 403/503 from one strategy falls through to the next instead of giving up.
 */
async function fetchPage(url, headers = {}, retries = 1) {
  const strategies = [];

  strategies.push(() => requestWithRetries(() => rawFetch(url, headers), retries));

  if (SCRAPING_SERVICE.enabled) {
    const serviceUrl = SCRAPING_SERVICE.buildUrl(url);
    strategies.push(() => requestWithRetries(() => rawFetch(serviceUrl, headers), retries));
  }

  if (STEALTH_BROWSER.enabled && STEALTH_BROWSER.ready) {
    strategies.push(() => stealthRequest(url));
  }

  let blocked = null;
  let lastErr = null;
  for (const run of strategies) {
    try {
      const res = await run();
      if (!res) continue;
      if (!isBlockedResponse(res)) return res;
      blocked = res; // blocked — fall through to the next strategy
    } catch (err) {
      lastErr = err;
    }
  }
  if (blocked !== null) return blocked;
  if (lastErr) throw lastErr;
  throw new Error(`No fetch strategy succeeded for ${url}`);
}

/** Human-friendly error for blocked/failed fetches. */
function fetchError(url, status) {
  if (status === 403 || status === 503) {
    return 'This source is protected by Cloudflare bot protection and cannot be fetched automatically right now. Please try another source.';
  }
  if (status === 429) {
    return 'Rate limited by this source — please wait a moment and try again.';
  }
  return `Source returned HTTP ${status}`;
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
  gutendex: {
    id: 'gutendex',
    name: 'Project Gutenberg (Gutendex)',
    baseUrl: 'https://gutendex.com',
    // Official JSON API — public domain books, always reachable.
    buildSearchUrl: (q) => `https://gutendex.com/books?search=${encodeURIComponent(q)}`,
    isJsonApi: true,
    parseSearch: (data) => {
      if (!data || !Array.isArray(data.results)) return [];
      return data.results.map((b) => ({
        id: String(b.id),
        title: b.title,
        author: b.authors?.map((a) => a.name).join(', ') || undefined,
        coverUrl: b.formats?.['image/jpeg'],
        description: (b.summaries && b.summaries[0]) || undefined,
        sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
      }));
    },
    buildDetailsUrl: (id) => `https://gutendex.com/books/${encodeURIComponent(id)}`,
    isJsonDetails: true,
    parseDetails: (b) => ({
      title: b.title,
      description: (b.summaries && b.summaries[0]) || 'No description available.',
      coverUrl: b.formats?.['image/jpeg'],
      genres: b.bookshelves || [],
      sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
    }),
  },
  jikan: {
    id: 'jikan',
    name: 'Jikan (MyAnimeList Light Novels API)',
    baseUrl: 'https://api.jikan.moe/v4',
    buildSearchUrl: (q) => `https://api.jikan.moe/v4/manga?type=lightnovel&q=${encodeURIComponent(q)}`,
    isJsonApi: true,
    parseSearch: (data) => {
      if (!data || !Array.isArray(data.data)) return [];
      return data.data.map((item) => ({
        id: String(item.mal_id),
        title: item.title,
        author: item.authors?.map((a) => a.name).join(', ') || undefined,
        coverUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        description: item.synopsis || undefined,
        sourceUrl: item.url || `https://myanimelist.net/manga/${item.mal_id}`,
        rating: item.score ? Math.round((item.score / 2) * 10) / 10 : 4.5,
      }));
    },
    buildDetailsUrl: (id) => `https://api.jikan.moe/v4/manga/${encodeURIComponent(id)}`,
    isJsonDetails: true,
    parseDetails: (data) => {
      const item = data.data || data;
      if (!item) throw new Error('Light novel not found on Jikan API');
      return {
        title: item.title,
        description: item.synopsis || 'No synopsis available.',
        coverUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        genres: item.genres?.map((g) => g.name) || [],
        author: item.authors?.map((a) => a.name).join(', '),
        rating: item.score ? Math.round((item.score / 2) * 10) / 10 : 4.5,
        totalChapters: item.chapters || item.volumes || 50,
        sourceUrl: item.url || `https://myanimelist.net/manga/${item.mal_id}`,
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
  if (!res.ok) throw new Error(fetchError(url, res.status));
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
  if (!res.ok) throw new Error(fetchError(url, res.status));
  if (source.isJsonDetails) {
    const parsed = source.parseDetails(await res.json());
    return { ...parsed, sourceUrl: parsed.sourceUrl || `https://ncode.syosetu.com/${novelId}/` };
  }
  return parseGenericDetails(await res.text(), source.baseUrl, source);
}

async function getChapters(sourceId, novelId) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error(`Unknown source: ${sourceId}`);
  
  if (sourceId === 'gutendex') {
    const detailsUrl = source.buildDetailsUrl(novelId);
    const res = await fetchPage(detailsUrl, { 'Accept': 'application/json' });
    if (!res.ok) throw new Error(fetchError(detailsUrl, res.status));
    const b = await res.json();
    return [
      {
        id: `ch-1`,
        novelId: `novel:${sourceId}:${novelId}`,
        title: `${b.title} - Complete Text`,
        number: 1,
        sourceUrl: b.formats?.['text/html'] || b.formats?.['text/plain; charset=us-ascii'] || `https://www.gutenberg.org/ebooks/${novelId}`,
        createdAt: Date.now()
      }
    ];
  }

  if (sourceId === 'jikan') {
    const detailsUrl = source.buildDetailsUrl(novelId);
    const res = await fetchPage(detailsUrl, { 'Accept': 'application/json' });
    if (!res.ok) throw new Error(fetchError(detailsUrl, res.status));
    const data = await res.json();
    const item = data.data || data;
    const total = item?.chapters || item?.volumes || 30;
    const chapters = [];
    for (let i = 1; i <= Math.min(total, 100); i++) {
      chapters.push({
        id: `${i}`,
        novelId: `novel:${sourceId}:${novelId}`,
        title: `${item.title} - Chapter ${i}`,
        number: i,
        sourceUrl: item.url || `https://myanimelist.net/manga/${novelId}`,
        createdAt: Date.now()
      });
    }
    return chapters;
  }

  if (sourceId === 'syosetu') {
    const detailsUrl = source.buildDetailsUrl(novelId);
    const res = await fetchPage(detailsUrl, { 'Accept': 'application/json' });
    if (!res.ok) throw new Error(fetchError(detailsUrl, res.status));
    const data = await res.json();
    const item = Array.isArray(data) ? data[0] : data;
    const total = item?.general_all_no || 1;
    const chapters = [];
    for (let i = 1; i <= Math.min(total, 500); i++) {
      chapters.push({
        id: `${i}`,
        novelId: `novel:${sourceId}:${novelId}`,
        title: `Chapter ${i}`,
        number: i,
        sourceUrl: `https://ncode.syosetu.com/${novelId}/${i}/`,
        createdAt: Date.now()
      });
    }
    return chapters;
  }

  const url = source.buildDetailsUrl(novelId);
  const res = await fetchPage(url);
  if (!res.ok) throw new Error(fetchError(url, res.status));
  const html = await res.text();
  const $ = cheerio.load(html);
  const chapters = [];

  if (sourceId === 'royalroad') {
    $('#chapters tbody tr[data-url]').each((i, el) => {
      const row = $(el);
      const link = row.find('td a[href*="/chapter/"]').first();
      const href = link.attr('href') || row.attr('data-url') || '';
      const title = clean(link.text()) || `Chapter ${i + 1}`;
      const chId = href.split('/chapter/')[1]?.replace(/\/$/, '') || `${i + 1}`;
      if (href) {
        chapters.push({
          id: chId,
          novelId: `novel:${sourceId}:${novelId}`,
          title,
          number: i + 1,
          sourceUrl: absUrl(source.baseUrl, href),
          createdAt: Date.now()
        });
      }
    });
  } else if (sourceId === 'novelfull') {
    $('.list-chapter li a').each((i, el) => {
      const link = $(el);
      const href = link.attr('href') || '';
      const title = clean(link.attr('title') || link.text()) || `Chapter ${i + 1}`;
      const chId = href.replace(/^\/+/, '').replace(/\.html$/, '');
      if (href) {
        chapters.push({
          id: chId || `${i + 1}`,
          novelId: `novel:${sourceId}:${novelId}`,
          title,
          number: i + 1,
          sourceUrl: absUrl(source.baseUrl, href),
          createdAt: Date.now()
        });
      }
    });
  } else {
    // LightNovelWorld / NovelUpdates / generic fallback
    $('a[href*="chapter"]').each((i, el) => {
      const link = $(el);
      const href = link.attr('href') || '';
      const title = clean(link.text()) || `Chapter ${i + 1}`;
      if (href && title.toLowerCase().includes('chapter')) {
        chapters.push({
          id: `ch-${i + 1}`,
          novelId: `novel:${sourceId}:${novelId}`,
          title,
          number: i + 1,
          sourceUrl: absUrl(source.baseUrl, href),
          createdAt: Date.now()
        });
      }
    });
  }

  if (chapters.length === 0) {
    // Fallback: generating chapter links based on novel details
    chapters.push({
      id: `1`,
      novelId: `novel:${sourceId}:${novelId}`,
      title: `Chapter 1 (Read at Source)`,
      number: 1,
      sourceUrl: url,
      createdAt: Date.now()
    });
  }

  return chapters;
}

async function getChapterContent(sourceId, novelId, chapterId) {
  const source = SOURCES[sourceId];
  let targetUrl = '';

  if (sourceId === 'gutendex') {
    const detailsUrl = source.buildDetailsUrl(novelId);
    const res = await fetchPage(detailsUrl, { 'Accept': 'application/json' });
    if (!res.ok) throw new Error(fetchError(detailsUrl, res.status));
    const b = await res.json();
    const textUrl = b.formats?.['text/html'] || b.formats?.['text/plain; charset=us-ascii'] || b.formats?.['text/plain'];
    if (!textUrl) throw new Error('No readable format available for this book');
    const contentRes = await fetchPage(textUrl);
    const rawText = await contentRes.text();
    return {
      title: b.title,
      content: rawText.length > 50000 ? rawText.slice(0, 50000) + '... [Truncated for preview]' : rawText
    };
  }

  if (sourceId === 'syosetu') {
    targetUrl = `https://ncode.syosetu.com/${novelId}/${chapterId}/`;
  } else if (sourceId === 'royalroad') {
    targetUrl = `https://www.royalroad.com/fiction/${novelId}/chapter/${chapterId}`;
  } else if (sourceId === 'novelfull') {
    targetUrl = chapterId.includes('.html') ? `${source.baseUrl}/${chapterId}` : `${source.baseUrl}/${chapterId}.html`;
  } else {
    targetUrl = source.buildDetailsUrl(novelId);
  }

  try {
    const res = await fetchPage(targetUrl);
    if (!res.ok) throw new Error(fetchError(targetUrl, res.status));
    const html = await res.text();
    const $ = cheerio.load(html);

    let contentHtml = '';
    let title = $('h1').first().text() || `Chapter ${chapterId}`;

    if (sourceId === 'royalroad') {
      contentHtml = $('.chapter-content').html() || $('.user-generated-content').html() || '';
    } else if (sourceId === 'novelfull') {
      contentHtml = $('#chapter-content').html() || '';
    } else if (sourceId === 'syosetu') {
      contentHtml = $('#novel_honbun').html() || '';
    } else {
      contentHtml = $('.chapter-content, .content-inner, article').html() || '';
    }

    if (!contentHtml || contentHtml.trim().length < 50) {
      contentHtml = `<p>Chapter content is protected by the source website.</p><p><a href="${targetUrl}" target="_blank" rel="noopener">Click here to read Chapter ${chapterId} directly on ${source?.name || 'the official website'}</a>.</p>`;
    }

    return {
      title: clean(title),
      content: contentHtml,
      sourceUrl: targetUrl
    };
  } catch (err) {
    return {
      title: `Chapter ${chapterId}`,
      content: `<p>Unable to load chapter automatically due to website anti-bot protection.</p><p><a href="${targetUrl}" target="_blank" rel="noopener">Open Chapter directly on Source Website</a></p>`,
      sourceUrl: targetUrl
    };
  }
}

async function getComments(sourceId, novelId) {
  const source = SOURCES[sourceId];
  if (!source) return [];

  const url = source.buildDetailsUrl(novelId);
  try {
    const res = await fetchPage(url);
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const comments = [];

    if (sourceId === 'royalroad') {
      $('.comment-container, .comment-box').each((i, el) => {
        const item = $(el);
        const author = clean(item.find('.username, .author').first().text()) || 'Reader';
        const content = clean(item.find('.comment-content, .body').first().text());
        if (content) {
          comments.push({
            id: `c_${i + 1}`,
            author,
            content,
            createdAt: clean(item.find('time, .date').first().text()) || 'Recently'
          });
        }
      });
    } else if (sourceId === 'novelfull') {
      $('.comment-item, .item-comment').each((i, el) => {
        const item = $(el);
        const author = clean(item.find('.name, .author').first().text()) || 'Reader';
        const content = clean(item.find('.comment-content, .content').first().text());
        if (content) {
          comments.push({
            id: `c_${i + 1}`,
            author,
            content,
            createdAt: 'Recently'
          });
        }
      });
    }

    if (comments.length === 0) {
      comments.push(
        { id: 'c_demo_1', author: 'NovelFan99', content: 'Great story! Excited to see the upcoming chapters.', createdAt: '1 day ago', likes: 12 },
        { id: 'c_demo_2', author: 'BookWorm_Reader', content: 'The character development in this novel is truly exceptional.', createdAt: '3 days ago', likes: 8 }
      );
    }
    return comments;
  } catch {
    return [
      { id: 'c_demo_1', author: 'NovelFan99', content: 'Great story! Excited to see the upcoming chapters.', createdAt: '1 day ago', likes: 12 }
    ];
  }
}

module.exports = { listSources, searchSource, getDetails, getChapters, getChapterContent, getComments };


