import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── CSS-in-JS via injected style tag ──────────────────────────────────────── */
const CSS = `
  :root {
    --bg: #0a0b0f;
    --surface: #111318;
    --surface2: #181b22;
    --surface3: #1e2230;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --text: #e8eaf0;
    --text2: #8b90a4;
    --text3: #555a6e;
    --accent: #6c63ff;
    --accent2: #8b85ff;
    --paper: #22c55e;
    --news: #f59e0b;
    --article: #38bdf8;
    --danger: #ef4444;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; } 50% { opacity:.4; }
  }

  .fade-up { animation: fadeUp 0.4s ease forwards; }

  .skeleton {
    background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .card:hover {
    border-color: var(--border2);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .btn {
    font-family: var(--font-body);
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn:active { transform: scale(0.97); }

  .tag-paper   { background: rgba(34,197,94,0.12);  color: var(--paper);   border: 1px solid rgba(34,197,94,0.2);  }
  .tag-news    { background: rgba(245,158,11,0.12); color: var(--news);    border: 1px solid rgba(245,158,11,0.2); }
  .tag-article { background: rgba(56,189,248,0.12); color: var(--article); border: 1px solid rgba(56,189,248,0.2); }

  input, select {
    font-family: var(--font-body);
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(108,99,255,0.15);
  }
  input::placeholder { color: var(--text3); }

  select option { background: #1e2230; }

  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--accent2); }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .section-dot {
    width: 10px; height: 10px; border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .chip {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500;
    border: 1px solid;
    white-space: nowrap;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text3);
  }
  .empty-state svg { opacity: 0.3; margin-bottom: 12px; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .stack-mobile { flex-direction: column !important; }
  }
`;

function injectStyles() {
  if (document.getElementById('rp-styles')) return;
  const el = document.createElement('style');
  el.id = 'rp-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const DATE_OPTIONS = [
  { value: 'all',   label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year' },
  { value: '2024',  label: 'Year 2024' },
  { value: '2023',  label: 'Year 2023' },
  { value: '2022',  label: 'Year 2022' },
];

const TYPE_OPTIONS = [
  { value: 'all',     label: 'All Types' },
  { value: 'paper',   label: 'Research Papers' },
  { value: 'news',    label: 'News' },
  { value: 'article', label: 'Articles' },
];

const POPULAR = [
  'machine learning', 'transformer', 'polymer', 'quantum computing',
  'CRISPR', 'neural network', 'climate change', 'protein folding',
  'large language model', 'robotics', 'drug discovery', 'semiconductor',
];

const SECTION_META = {
  papers:   { label: 'Research Papers', color: 'var(--paper)',   dotClass: 'section-dot', dotColor: '#22c55e', tagClass: 'tag-paper',   icon: '📄' },
  news:     { label: 'News',             color: 'var(--news)',    dotClass: 'section-dot', dotColor: '#f59e0b', tagClass: 'tag-news',    icon: '📰' },
  articles: { label: 'Articles & Blogs', color: 'var(--article)', dotClass: 'section-dot', dotColor: '#38bdf8', tagClass: 'tag-article', icon: '✍️' },
};

/* ─── API ───────────────────────────────────────────────────────────────────── */
async function fetchResults({ q, date, type, page = 1 }) {
  const params = new URLSearchParams({ q, date, type, page, limit: 15 });
  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{
        width:36, height:36, borderRadius:10,
        background:'linear-gradient(135deg,#6c63ff,#38bdf8)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18,
      }}>⚡</div>
      <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, letterSpacing:'-0.5px', color:'var(--text)' }}>
        Research<span style={{ color:'var(--accent2)' }}>Pulse</span>
      </span>
    </div>
  );
}

function SearchBar({ value, onChange, onSearch, loading }) {
  const ref = useRef();
  function handleKey(e) { if (e.key === 'Enter') onSearch(); }
  return (
    <div style={{ position:'relative', width:'100%' }}>
      <span style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', fontSize:18, opacity:0.4, pointerEvents:'none' }}>🔍</span>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search any keyword — polymer, transformer, CRISPR, quantum..."
        style={{
          width:'100%', padding:'16px 56px 16px 52px',
          fontSize:16, borderRadius:14,
          border:'1.5px solid var(--border2)',
          background:'var(--surface2)',
        }}
      />
      <button
        className="btn"
        onClick={onSearch}
        disabled={loading}
        style={{
          position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
          background:'var(--accent)', color:'#fff',
          padding:'9px 20px', borderRadius:9,
          fontSize:14, fontWeight:600,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? <span style={{ display:'inline-block', width:14, height:14, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }}/> : null}
        Search
      </button>
    </div>
  );
}

function Filters({ date, type, onDate, onType }) {
  const selStyle = {
    padding:'9px 14px', fontSize:13, borderRadius:10,
    border:'1px solid var(--border)', cursor:'pointer', width:'100%',
  };
  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
      <div style={{ flex:1, minWidth:140 }}>
        <label style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:6 }}>Date Range</label>
        <select value={date} onChange={e => onDate(e.target.value)} style={selStyle}>
          {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ flex:1, minWidth:140 }}>
        <label style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:6 }}>Content Type</label>
        <select value={type} onChange={e => onType(e.target.value)} style={selStyle}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function PopularChips({ onSelect }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      <span style={{ fontSize:12, color:'var(--text3)', alignSelf:'center', marginRight:4 }}>Trending:</span>
      {POPULAR.map(k => (
        <button
          key={k}
          className="btn"
          onClick={() => onSelect(k)}
          style={{
            padding:'5px 12px', borderRadius:20,
            background:'var(--surface3)', color:'var(--text2)',
            border:'1px solid var(--border)', fontSize:12,
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <div className="skeleton" style={{ width:80, height:22 }}/>
        <div className="skeleton" style={{ width:60, height:22 }}/>
      </div>
      <div className="skeleton" style={{ width:'90%', height:18, marginBottom:8 }}/>
      <div className="skeleton" style={{ width:'70%', height:18, marginBottom:14 }}/>
      <div className="skeleton" style={{ width:'100%', height:14, marginBottom:6 }}/>
      <div className="skeleton" style={{ width:'85%', height:14, marginBottom:6 }}/>
      <div className="skeleton" style={{ width:'60%', height:14 }}/>
    </div>
  );
}

function ResultCard({ item, sectionKey, animDelay = 0 }) {
  const meta = SECTION_META[sectionKey];
  const domain = (() => { try { return new URL(item.url).hostname.replace('www.', ''); } catch { return item.source; } })();

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display:'block' }}>
      <div
        className="card fade-up"
        style={{ padding:20, animationDelay:`${animDelay}ms`, cursor:'pointer' }}
      >
        {/* Top row */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
          <span className={`chip ${meta.tagClass}`}>{meta.icon} {meta.label.replace(' & Blogs','')}</span>
          <span style={{ fontSize:12, color:'var(--text3)', background:'var(--surface2)', padding:'3px 9px', borderRadius:20, border:'1px solid var(--border)' }}>
            {item.source}
          </span>
          <span style={{ fontSize:12, color:'var(--text3)', marginLeft:'auto' }}>{item.dateLabel}</span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily:'var(--font-display)', fontSize:16, fontWeight:700,
          lineHeight:1.4, color:'var(--text)', marginBottom:8,
          letterSpacing:'-0.2px',
        }}>
          {item.title}
        </h3>

        {/* Summary */}
        {item.summary && (
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6, marginBottom:12 }}>
            {item.summary.length > 260 ? item.summary.slice(0, 260) + '…' : item.summary}
          </p>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {item.author && item.author !== item.source && (
            <span style={{ fontSize:12, color:'var(--text3)' }}>by {item.author.slice(0, 40)}</span>
          )}
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--accent2)', display:'flex', alignItems:'center', gap:4 }}>
            {domain} →
          </span>
        </div>
      </div>
    </a>
  );
}

function SectionBlock({ sectionKey, data, loading, onLoadMore, currentPage, query }) {
  const meta = SECTION_META[sectionKey];
  if (!loading && data && data.total === 0) return null;

  return (
    <div style={{ marginBottom:48 }}>
      {/* Section header */}
      <div className="section-header">
        <div className="section-dot" style={{ background: meta.dotColor }}/>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.3px' }}>
          {meta.icon} {meta.label}
        </h2>
        {data && (
          <span style={{ marginLeft:8, fontSize:13, color:'var(--text3)', background:'var(--surface3)', padding:'2px 10px', borderRadius:20, border:'1px solid var(--border)' }}>
            {data.total} {data.total === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      {/* Cards grid */}
      <div style={{ display:'grid', gap:14 }}>
        {loading
          ? [1,2,3].map(i => <SkeletonCard key={i}/>)
          : data?.items.map((item, i) => (
              <ResultCard key={item.id} item={item} sectionKey={sectionKey} animDelay={i * 60}/>
            ))
        }
      </div>

      {/* Load more */}
      {!loading && data && currentPage < data.pages && (
        <div style={{ textAlign:'center', marginTop:20 }}>
          <button
            className="btn"
            onClick={() => onLoadMore(sectionKey)}
            style={{
              background:'var(--surface2)', color:'var(--text2)',
              border:'1px solid var(--border2)', borderRadius:10,
              padding:'10px 24px', fontSize:14,
            }}
          >
            Load more {meta.label.toLowerCase()} ↓
          </button>
        </div>
      )}
    </div>
  );
}

function StatsBar({ data, loading }) {
  if (loading || !data) return null;
  const { sections } = data;
  const counts = [
    { label: 'Research Papers', count: sections.papers.total,   color: 'var(--paper)' },
    { label: 'News Articles',   count: sections.news.total,     color: 'var(--news)' },
    { label: 'Blog Articles',   count: sections.articles.total, color: 'var(--article)' },
  ];
  const total = counts.reduce((s, c) => s + c.count, 0);
  if (total === 0) return null;

  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:14, padding:'16px 20px',
      display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
      marginBottom:32,
    }}>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--accent2)' }}>{total}</div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>total results</div>
      </div>
      <div style={{ width:1, height:40, background:'var(--border)' }}/>
      {counts.map(c => (
        <div key={c.label}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color: c.color }}>{c.count}</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{c.label}</div>
        </div>
      ))}
      <div style={{ marginLeft:'auto', fontSize:13, color:'var(--text3)' }}>
        Fetched {new Date(data.fetchedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize:48, marginBottom:12 }}>🔭</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>
        No results found
      </div>
      <div style={{ fontSize:14, color:'var(--text3)', maxWidth:340, margin:'0 auto' }}>
        {query ? `No results for "${query}" in this date range. Try broader terms or a wider date filter.` : 'Enter a keyword above to start searching across papers, news, and articles.'}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
      borderRadius:12, padding:'16px 20px',
      display:'flex', alignItems:'center', gap:12, marginBottom:24,
    }}>
      <span style={{ fontSize:20 }}>⚠️</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--danger)', marginBottom:2 }}>Backend connection failed</div>
        <div style={{ fontSize:13, color:'var(--text3)' }}>{message} — Make sure the backend server is running on port 3001.</div>
      </div>
      <button className="btn" onClick={onRetry} style={{ background:'var(--danger)', color:'#fff', padding:'8px 16px', borderRadius:8, fontSize:13 }}>Retry</button>
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────────────────────── */
export default function App() {
  injectStyles();

  const [query, setQuery]         = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [data, setData]           = useState(null);
  const [searched, setSearched]   = useState(false);

  // Per-section pagination pages
  const [pages, setPages] = useState({ papers: 1, news: 1, articles: 1 });
  // Per-section accumulated items
  const [sectionItems, setSectionItems] = useState({ papers: [], news: [], articles: [] });

  const doSearch = useCallback(async (q = query, date = dateFilter, type = typeFilter, resetPages = true) => {
    if (!q.trim() && !searched) return;
    setLoading(true);
    setError(null);
    if (resetPages) {
      setPages({ papers: 1, news: 1, articles: 1 });
      setSectionItems({ papers: [], news: [], articles: [] });
    }
    try {
      const result = await fetchResults({ q, date, type, page: 1 });
      setData(result);
      setSectionItems({
        papers:   result.sections.papers.items,
        news:     result.sections.news.items,
        articles: result.sections.articles.items,
      });
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, dateFilter, typeFilter, searched]);

  // Re-search when filters change (only if already searched)
  useEffect(() => {
    if (searched) doSearch(query, dateFilter, typeFilter);
  }, [dateFilter, typeFilter]);

  const handleLoadMore = useCallback(async (section) => {
    const nextPage = pages[section] + 1;
    setPages(p => ({ ...p, [section]: nextPage }));
    try {
      const result = await fetchResults({
        q: query, date: dateFilter,
        type: section === 'papers' ? 'paper' : section === 'news' ? 'news' : 'article',
        page: nextPage,
      });
      const key = section;
      const newItems = result.sections[key]?.items || [];
      setSectionItems(prev => ({ ...prev, [key]: [...prev[key], ...newItems] }));
    } catch (e) {
      console.error('Load more failed:', e);
    }
  }, [query, dateFilter, pages]);

  const handlePopularSelect = (k) => {
    setQuery(k);
    doSearch(k, dateFilter, typeFilter);
  };

  const totalResults = data ? data.totalResults : 0;
  const hasResults = searched && !loading && totalResults > 0;
  const hasNoResults = searched && !loading && totalResults === 0 && !error;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom:'1px solid var(--border)',
        background:'rgba(10,11,15,0.9)',
        backdropFilter:'blur(12px)',
        position:'sticky', top:0, zIndex:100,
        padding:'14px 24px',
        display:'flex', alignItems:'center', gap:16,
      }}>
        <Logo />
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <div style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 2s infinite' }}/>
            Live RSS feeds
          </div>
        </div>
      </div>

      {/* ── Hero / Search ── */}
      <div style={{ padding:'48px 24px 32px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h1 style={{
            fontFamily:'var(--font-display)', fontSize:'clamp(32px,5vw,52px)',
            fontWeight:800, lineHeight:1.15, letterSpacing:'-1.5px',
            color:'var(--text)', marginBottom:12,
          }}>
            Search across<br/>
            <span style={{ color:'var(--accent2)' }}>papers, news & articles</span>
          </h1>
          <p style={{ fontSize:16, color:'var(--text2)', maxWidth:520, margin:'0 auto' }}>
            Real-time results from arXiv, Nature, TechCrunch, MIT Tech Review and 30+ live sources.
          </p>
        </div>

        <SearchBar value={query} onChange={setQuery} onSearch={() => doSearch()} loading={loading} />

        <div style={{ marginTop:16 }}>
          <Filters date={dateFilter} type={typeFilter} onDate={setDateFilter} onType={setTypeFilter} />
        </div>

        <div style={{ marginTop:16 }}>
          <PopularChips onSelect={handlePopularSelect} />
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 60px' }}>

        {error && <ErrorBanner message={error} onRetry={() => doSearch()} />}

        {/* Stats bar */}
        {hasResults && (
          <StatsBar data={data} loading={loading} />
        )}

        {/* Query label */}
        {searched && !loading && query && (
          <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, color:'var(--text3)' }}>Results for</span>
            <span style={{
              fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--accent2)',
              background:'rgba(108,99,255,0.1)', padding:'3px 12px', borderRadius:20,
              border:'1px solid rgba(108,99,255,0.2)',
            }}>"{query}"</span>
            <span style={{ fontSize:14, color:'var(--text3)' }}>·</span>
            <span style={{ fontSize:14, color:'var(--text3)' }}>
              {DATE_OPTIONS.find(d => d.value === dateFilter)?.label}
            </span>
            {typeFilter !== 'all' && (
              <>
                <span style={{ fontSize:14, color:'var(--text3)' }}>·</span>
                <span style={{ fontSize:14, color:'var(--text3)' }}>
                  {TYPE_OPTIONS.find(t => t.value === typeFilter)?.label}
                </span>
              </>
            )}
          </div>
        )}

        {/* Loading skeletons when no previous data */}
        {loading && !data && (
          <div style={{ display:'flex', flexDirection:'column', gap:48 }}>
            {['Research Papers','News','Articles & Blogs'].map(s => (
              <div key={s}>
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <div className="skeleton" style={{ width:10, height:10, borderRadius:'50%', marginTop:4 }}/>
                  <div className="skeleton" style={{ width:160, height:24 }}/>
                  <div className="skeleton" style={{ width:60, height:24, borderRadius:20 }}/>
                </div>
                {[1,2,3].map(i => <div style={{ marginBottom:14 }}><SkeletonCard key={i}/></div>)}
              </div>
            ))}
          </div>
        )}

        {/* Sections */}
        {(hasResults || (loading && data)) && (
          <>
            {(typeFilter === 'all' || typeFilter === 'paper') && (
              <SectionBlock
                sectionKey="papers"
                data={hasResults ? { ...data.sections.papers, items: sectionItems.papers } : null}
                loading={loading && !data}
                onLoadMore={handleLoadMore}
                currentPage={pages.papers}
                query={query}
              />
            )}
            {(typeFilter === 'all' || typeFilter === 'news') && (
              <SectionBlock
                sectionKey="news"
                data={hasResults ? { ...data.sections.news, items: sectionItems.news } : null}
                loading={loading && !data}
                onLoadMore={handleLoadMore}
                currentPage={pages.news}
                query={query}
              />
            )}
            {(typeFilter === 'all' || typeFilter === 'article') && (
              <SectionBlock
                sectionKey="articles"
                data={hasResults ? { ...data.sections.articles, items: sectionItems.articles } : null}
                loading={loading && !data}
                onLoadMore={handleLoadMore}
                currentPage={pages.articles}
                query={query}
              />
            )}
          </>
        )}

        {/* Empty state */}
        {hasNoResults && <EmptyState query={query} />}

        {/* Landing prompt (before any search) */}
        {!searched && !loading && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔬</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>
              Ready to explore
            </div>
            <div style={{ fontSize:14 }}>
              Type any keyword above — polymer, AI, quantum, climate, CRISPR — and see live results from 30+ sources, split into papers, news, and articles.
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop:'1px solid var(--border)',
        padding:'20px 24px', textAlign:'center',
        fontSize:12, color:'var(--text3)',
      }}>
        ResearchPulse · Powered by 30+ live RSS feeds · arXiv · Nature · TechCrunch · MIT Tech Review · and more
      </div>
    </div>
  );
}
