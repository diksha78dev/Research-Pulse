import express from 'express';
import cors from 'cors';
import RSSParser from 'rss-parser';
import NodeCache from 'node-cache';

const app = express();
const parser = new RSSParser({ timeout: 10000, headers: { 'User-Agent': 'ResearchPulse/1.0' } });
const cache = new NodeCache({ stdTTL: 1800 }); // 30 min cache

app.use(cors());
app.use(express.json());

// ── RSS feed registry ─────────────────────────────────────────────────────────
// Each feed has: url, type (paper|news|article), source label, category tags
const FEEDS = [
  // ── Research Papers ──────────────────────────────────────────────────────
  { url: 'https://rss.arxiv.org/rss/cs.AI',        type: 'paper',   source: 'arXiv',           tags: ['AI','machine learning','deep learning'] },
  { url: 'https://rss.arxiv.org/rss/cs.LG',        type: 'paper',   source: 'arXiv',           tags: ['machine learning','neural networks','algorithms'] },
  { url: 'https://rss.arxiv.org/rss/cs.CL',        type: 'paper',   source: 'arXiv',           tags: ['NLP','language models','text'] },
  { url: 'https://rss.arxiv.org/rss/cs.CV',        type: 'paper',   source: 'arXiv',           tags: ['computer vision','image','video'] },
  { url: 'https://rss.arxiv.org/rss/cs.RO',        type: 'paper',   source: 'arXiv',           tags: ['robotics','automation','control'] },
  { url: 'https://rss.arxiv.org/rss/stat.ML',      type: 'paper',   source: 'arXiv',           tags: ['statistics','machine learning','bayesian'] },
  { url: 'https://rss.arxiv.org/rss/q-bio',        type: 'paper',   source: 'arXiv',           tags: ['biology','genetics','bioinformatics'] },
  { url: 'https://rss.arxiv.org/rss/cond-mat',     type: 'paper',   source: 'arXiv',           tags: ['physics','materials','condensed matter','polymer'] },
  { url: 'https://rss.arxiv.org/rss/physics',      type: 'paper',   source: 'arXiv',           tags: ['physics','quantum','optics'] },
  { url: 'https://rss.arxiv.org/rss/chem.ph',      type: 'paper',   source: 'arXiv',           tags: ['chemistry','chemical','molecular','polymer'] },
  { url: 'https://rss.arxiv.org/rss/econ',         type: 'paper',   source: 'arXiv',           tags: ['economics','finance','market'] },
  { url: 'https://rss.arxiv.org/rss/astro-ph',     type: 'paper',   source: 'arXiv',           tags: ['astronomy','space','astrophysics'] },

  // ── Technology News ───────────────────────────────────────────────────────
  { url: 'https://techcrunch.com/feed/',            type: 'news',    source: 'TechCrunch',      tags: ['technology','startup','business','AI'] },
  { url: 'https://feeds.feedburner.com/TheHackersNews', type: 'news', source: 'The Hacker News', tags: ['cybersecurity','hacking','vulnerability'] },
  { url: 'https://www.wired.com/feed/rss',          type: 'news',    source: 'Wired',           tags: ['technology','science','culture','AI'] },
  { url: 'https://www.technologyreview.com/feed/',  type: 'news',    source: 'MIT Tech Review', tags: ['technology','research','AI','innovation'] },
  { url: 'https://venturebeat.com/feed/',           type: 'news',    source: 'VentureBeat',     tags: ['AI','technology','business','ML'] },
  { url: 'https://www.theverge.com/rss/index.xml',  type: 'news',    source: 'The Verge',       tags: ['technology','gadgets','science','AI'] },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'news', source: 'Ars Technica', tags: ['technology','science','computing'] },
  { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', type: 'news', source: 'BBC Science', tags: ['science','environment','research'] },
  { url: 'https://rss.sciencedaily.com/rss/all.xml', type: 'news',   source: 'Science Daily',   tags: ['science','research','health','technology'] },
  { url: 'https://phys.org/rss-feed/',              type: 'news',    source: 'Phys.org',        tags: ['physics','science','research','technology'] },
  { url: 'https://www.nature.com/nature.rss',       type: 'news',    source: 'Nature',          tags: ['science','research','biology','chemistry','physics'] },

  // ── Articles / Blogs ──────────────────────────────────────────────────────
  { url: 'https://towardsdatascience.com/feed',     type: 'article', source: 'Towards Data Science', tags: ['data science','ML','python','statistics'] },
  { url: 'https://machinelearningmastery.com/blog/feed/', type: 'article', source: 'ML Mastery', tags: ['machine learning','deep learning','tutorial'] },
  { url: 'https://distill.pub/rss.xml',             type: 'article', source: 'Distill',         tags: ['ML','visualization','explainability'] },
  { url: 'https://openai.com/blog/rss.xml',         type: 'article', source: 'OpenAI Blog',     tags: ['AI','GPT','safety','research'] },
  { url: 'https://deepmind.com/blog/feed/basic/',   type: 'article', source: 'DeepMind Blog',   tags: ['AI','reinforcement learning','research'] },
  { url: 'https://ai.googleblog.com/feeds/posts/default', type: 'article', source: 'Google AI Blog', tags: ['AI','ML','research','Google'] },
  { url: 'https://bair.berkeley.edu/blog/feed.xml', type: 'article', source: 'BAIR Blog',       tags: ['AI','robotics','research','Berkeley'] },
  { url: 'https://huggingface.co/blog/feed.xml',    type: 'article', source: 'HuggingFace Blog',tags: ['NLP','transformers','open source','ML'] },
  { url: 'https://developer.nvidia.com/blog/feed/', type: 'article', source: 'NVIDIA Blog',     tags: ['GPU','AI','hardware','computing'] },
  { url: 'https://engineering.fb.com/feed/',        type: 'article', source: 'Meta Engineering',tags: ['AI','engineering','ML','research'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function parseDate(item) {
  const raw = item.pubDate || item.isoDate || item.date || '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

function matchesKeyword(item, keyword) {
  if (!keyword || keyword.trim() === '') return true;
  const kw = keyword.toLowerCase().trim();
  const searchText = [
    item.title || '',
    item.summary || '',
    item.content || '',
    ...(item.tags || [])
  ].join(' ').toLowerCase();
  // Support multi-word keyword and partial matches
  const words = kw.split(/\s+/);
  return words.every(w => searchText.includes(w));
}

function matchesDateFilter(item, dateFilter) {
  if (!dateFilter || dateFilter === 'all') return true;
  const d = new Date(item.date);
  const now = new Date();

  if (dateFilter === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (dateFilter === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  if (dateFilter === 'month') {
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    return d >= monthAgo;
  }
  if (dateFilter === 'year') {
    const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);
    return d >= yearAgo;
  }
  // Specific YYYY or YYYY-MM
  if (/^\d{4}$/.test(dateFilter)) return d.getFullYear() === parseInt(dateFilter);
  if (/^\d{4}-\d{2}$/.test(dateFilter)) {
    return d.getFullYear() === parseInt(dateFilter.slice(0, 4)) &&
           d.getMonth() + 1 === parseInt(dateFilter.slice(5));
  }
  return true;
}

async function fetchFeed(feedConfig) {
  const cacheKey = `feed_${feedConfig.url}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items = (feed.items || []).slice(0, 50).map((item, idx) => {
      const d = parseDate(item);
      return {
        id: `${feedConfig.source}_${idx}_${d.getTime()}`,
        title: (item.title || 'Untitled').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
        summary: stripHtml(item.contentSnippet || item.content || item.summary || ''),
        url: item.link || item.guid || '#',
        date: d.toISOString(),
        dateLabel: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        source: feedConfig.source,
        type: feedConfig.type,
        tags: feedConfig.tags,
        author: item.author || item.creator || feedConfig.source,
      };
    });
    cache.set(cacheKey, items);
    return items;
  } catch (err) {
    console.warn(`Failed to fetch ${feedConfig.url}: ${err.message}`);
    return [];
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Main search endpoint
// GET /api/search?q=polymer&date=year&type=all&page=1&limit=20
app.get('/api/search', async (req, res) => {
  const { q = '', date = 'all', type = 'all', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  // Determine which feeds to fetch based on type filter
  const feedsToFetch = type === 'all' ? FEEDS : FEEDS.filter(f => f.type === type);

  // Fetch all feeds concurrently
  const results = await Promise.allSettled(feedsToFetch.map(f => fetchFeed(f)));
  let allItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Filter by keyword
  allItems = allItems.filter(item => matchesKeyword(item, q));

  // Filter by date
  allItems = allItems.filter(item => matchesDateFilter(item, date));

  // Sort by date descending
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Deduplicate by title similarity
  const seen = new Set();
  allItems = allItems.filter(item => {
    const key = item.title.slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Section into types
  const papers   = allItems.filter(i => i.type === 'paper');
  const news     = allItems.filter(i => i.type === 'news');
  const articles = allItems.filter(i => i.type === 'article');

  // Paginate each section independently
  const paginate = (arr) => ({
    total: arr.length,
    items: arr.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    pages: Math.ceil(arr.length / limitNum),
  });

  res.json({
    query: q,
    date,
    type,
    page: pageNum,
    sections: {
      papers: paginate(papers),
      news: paginate(news),
      articles: paginate(articles),
    },
    totalResults: allItems.length,
    fetchedAt: new Date().toISOString(),
  });
});

// List available sources
app.get('/api/sources', (_, res) => {
  const sources = FEEDS.map(f => ({ source: f.source, type: f.type, tags: f.tags }));
  res.json(sources);
});

// Clear cache endpoint (for dev/admin)
app.post('/api/cache/clear', (_, res) => {
  cache.flushAll();
  res.json({ cleared: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Research Pulse backend running on port ${PORT}`));
