# ⚡ ResearchPulse

Search across **research papers, news, and articles** in real-time.  
Powered by 30+ live RSS feeds — arXiv, Nature, TechCrunch, MIT Tech Review, Wired, and more.

---

## 🗂️ Project Structure

```
research-pulse/
├── backend/
│   ├── server.js        ← Express API + RSS fetching + caching
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx      ← Full React UI
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json         ← Root scripts (run both together)
├── vercel.json          ← Vercel deployment config
└── README.md
```

---

## 🖥️ Run Locally

### Step 1 — Install Node.js
Download from https://nodejs.org (v18 or higher)

### Step 2 — Install dependencies

Open a terminal in the `research-pulse/` folder and run:

```bash
# Install root tools
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 3 — Run the app

**Option A: Run both together (recommended)**
```bash
npm run dev
```
This starts both backend (port 3001) and frontend (port 5173) simultaneously.

**Option B: Run separately in two terminals**

Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

### Step 4 — Open in browser
Visit: **http://localhost:5173**

---

## 🌐 Deploy to Vercel (get a public link)

### Prerequisites
- GitHub account
- Vercel account (free) at https://vercel.com

### Step 1 — Push to GitHub

```bash
# In the research-pulse/ folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/research-pulse.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `research-pulse` repo
4. Vercel auto-detects the `vercel.json` — click **Deploy**
5. Wait ~2 minutes for build to complete
6. You get a URL like: `https://research-pulse-xyz.vercel.app` ✅

### Step 3 — Share the link
Send the URL to anyone — they open it in any browser, no setup needed.

---

## 🔍 How Search Works

| Feature | Details |
|---------|---------|
| **Keyword search** | Searches title + summary + tags across all feeds |
| **Multi-word** | "polymer nanoparticle" matches both words |
| **Date filters** | Today / This Week / Month / Year / Specific year (2023, 2024) |
| **Type filters** | Research Papers / News / Articles / All |
| **Sections** | Results split into Papers, News, Articles automatically |
| **Pagination** | "Load more" per section |
| **Caching** | Each feed cached 30 min to avoid rate limits |
| **Deduplication** | Duplicate titles removed automatically |

---

## 📡 Live RSS Sources (30+)

### Research Papers
| Source | Category |
|--------|----------|
| arXiv cs.AI | Artificial Intelligence |
| arXiv cs.LG | Machine Learning |
| arXiv cs.CL | Natural Language Processing |
| arXiv cs.CV | Computer Vision |
| arXiv cs.RO | Robotics |
| arXiv stat.ML | Statistical ML |
| arXiv q-bio | Biology / Bioinformatics |
| arXiv cond-mat | Materials / Polymers |
| arXiv physics | Physics / Quantum |
| arXiv chem.ph | Chemistry / Molecular |
| arXiv econ | Economics / Finance |
| arXiv astro-ph | Astronomy |

### News
| Source | Focus |
|--------|-------|
| TechCrunch | Tech / Startups |
| The Hacker News | Cybersecurity |
| Wired | Tech / Culture |
| MIT Tech Review | Research / Innovation |
| VentureBeat | AI / Business |
| The Verge | Consumer Tech |
| Ars Technica | Science / Computing |
| BBC Science | Science / Environment |
| Science Daily | Research News |
| Phys.org | Physics / Science |
| Nature | High-impact Research |

### Articles & Blogs
| Source | Focus |
|--------|-------|
| Towards Data Science | Data Science / ML |
| ML Mastery | ML Tutorials |
| Distill | ML Visualization |
| OpenAI Blog | AI Research |
| DeepMind Blog | AI / RL |
| Google AI Blog | AI Research |
| BAIR Blog | AI / Robotics |
| HuggingFace Blog | NLP / Open Source |
| NVIDIA Blog | GPU / AI Hardware |
| Meta Engineering | AI / Engineering |

---

## 🧠 Example Searches

- `polymer` → papers on polymer chemistry/materials + news + articles
- `transformer NLP` → language model papers + related blog posts
- `CRISPR` → gene editing papers + science news
- `quantum computing` → physics papers + tech news + tutorials
- `climate change` → environmental science papers + news coverage
- `drug discovery` → bio/chem papers + pharma news

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend not connecting | Make sure `cd backend && npm run dev` is running |
| "No results found" | Some feeds may be temporarily down — try another keyword |
| Slow first load | First fetch hits live RSS, subsequent loads use 30-min cache |
| Port already in use | Kill existing process: `npx kill-port 3001 5173` |

---

## 📄 License
MIT — free to use, modify, and deploy.
