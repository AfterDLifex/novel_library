/**
 * Local backend proxy for the Novel Library Angular app.
 *
 * Browsers can't call novel websites directly (CORS + bot protection),
 * so this small Express server performs the requests server-side, parses
 * the responses, and exposes a clean JSON API:
 *
 *   GET /api/sources                     -> [{ id, name, baseUrl }]
 *   GET /api/search?source=<id>&q=<str>  -> [{ id, title, author?, ... }]
 *   GET /api/details?source=<id>&id=<id> -> { title, description, ... }
 *   GET /api/health                      -> { status: 'ok' }
 *
 * Run:  npm install && npm start   (default port 5000)
 */
const express = require('express');
const cors = require('cors');
const { listSources, searchSource, getDetails, getChapters, getChapterContent, getComments } = require('./sources');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Allow the Angular dev server (any origin) to call us.
app.use(express.json());

// --- Simple in-memory cache to avoid hammering target sites ----------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  // Basic size cap.
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// --- Routes ----------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', sources: listSources().length });
});

app.get('/api/sources', (_req, res) => {
  res.json(listSources());
});

app.get('/api/search', async (req, res) => {
  const { source, q } = req.query;
  if (!source) return res.status(400).json({ error: 'Missing "source" query parameter' });
  if (!q || !String(q).trim()) return res.json([]);

  const cacheKey = `search:${source}:${String(q).trim().toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await searchSource(String(source), String(q).trim());
    cacheSet(cacheKey, results);
    res.json(results);
  } catch (err) {
    // console.error(`[search] ${source} "${q}":`, err.message);
    res.status(502).json({ error: `Search failed for "${source}": ${err.message}` });
  }
});

app.get('/api/details', async (req, res) => {
  const { source, id } = req.query;
  if (!source || !id) {
    return res.status(400).json({ error: 'Missing "source" or "id" query parameter' });
  }

  const cacheKey = `details:${source}:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const details = await getDetails(String(source), String(id));
    cacheSet(cacheKey, details);
    res.json(details);
  } catch (err) {
    //console.error(`[details] ${source} ${id}:`, err.message);
    res.status(502).json({ error: `Details failed for "${source}/${id}": ${err.message}` });
  }
});

app.get('/api/chapters', async (req, res) => {
  const { source, id } = req.query;
  if (!source || !id) {
    return res.status(400).json({ error: 'Missing "source" or "id" query parameter' });
  }

  const cacheKey = `chapters:${source}:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const chapters = await getChapters(String(source), String(id));
    cacheSet(cacheKey, chapters);
    res.json(chapters);
  } catch (err) {
    //console.error(`[chapters] ${source} ${id}:`, err.message);
    res.status(502).json({ error: `Chapters failed for "${source}/${id}": ${err.message}` });
  }
});

app.get('/api/chapter-content', async (req, res) => {
  const { source, novelId, chapterId } = req.query;
  if (!source || !novelId || !chapterId) {
    return res.status(400).json({ error: 'Missing "source", "novelId", or "chapterId" parameter' });
  }

  const cacheKey = `content:${source}:${novelId}:${chapterId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const content = await getChapterContent(String(source), String(novelId), String(chapterId));
    cacheSet(cacheKey, content);
    res.json(content);
  } catch (err) {
    //console.error(`[chapter-content] ${source} ${novelId} ${chapterId}:`, err.message);
    res.status(502).json({ error: `Chapter content failed: ${err.message}` });
  }
});

app.get('/api/comments', async (req, res) => {
  const { source, id } = req.query;
  if (!source || !id) {
    return res.status(400).json({ error: 'Missing "source" or "id" query parameter' });
  }

  const cacheKey = `comments:${source}:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const comments = await getComments(String(source), String(id));
    cacheSet(cacheKey, comments);
    res.json(comments);
  } catch (err) {
    //console.error(`[comments] ${source} ${id}:`, err.message);
    res.status(502).json({ error: `Comments failed for "${source}/${id}": ${err.message}` });
  }
});

// Fallback: friendly 404 for unknown API routes.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Unknown API endpoint' });
});

app.listen(PORT, () => {
  //console.log(`Novel Library proxy server running at http://localhost:${PORT}`);
  //console.log(`Sources: ${listSources().map((s) => s.id).join(', ')}`);
});
