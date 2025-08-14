
const STORAGE_KEY = 'dqg-quotes-v3';
const SELECTED_KEY = 'dqg-selected-category';
const SESSION_LAST = 'dqg-last-quote';


const defaultQuotes = [
  { id: genLocalId(), text: "The best way to get started is to quit talking and begin doing.", category: "Motivation", source:"local", updatedAt: Date.now() },
  { id: genLocalId(), text: "JavaScript is the language of the web.", category: "Programming", source:"local", updatedAt: Date.now() - 10000 },
  { id: genLocalId(), text: "First, solve the problem. Then, write the code.", category: "Programming", source:"local", updatedAt: Date.now() - 5000 },
  { id: genLocalId(), text: "What we think, we become.", category: "Mindset", source:"local", updatedAt: Date.now() - 7000 }
];


let quotes = loadQuotes();
let syncing = false;
let syncTimer = null;


const quoteDisplay   = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const newQuoteBtn    = document.getElementById('newQuote');
const clearBtn       = document.getElementById('clearStorageBtn');
const syncBtn        = document.getElementById('syncNowBtn');
const syncStatusEl   = document.getElementById('syncStatus');
const formMount      = document.getElementById('formMount');


document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  createAddQuoteForm();
  wireEvents();
  restoreLastCategory();
  restoreLastQuoteOrShowRandom();

 
  syncTimer = setInterval(() => syncWithServer(), 30000);
});


function wireEvents() {
  newQuoteBtn.addEventListener('click', showRandomQuote);
  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    quotes = defaultQuotes.slice();
    saveQuotes();
    populateCategories();
    filterQuote();
    toast('Local storage cleared; defaults restored.');
  });
  syncBtn.addEventListener('click', syncWithServer);
}


function populateCategories() {
  const set = new Set(quotes.map(q => q.category));
  const categories = ['all', ...Array.from(set).sort((a,b)=>a.localeCompare(b))];


  const saved = localStorage.getItem(SELECTED_KEY) || 'all';
  categoryFilter.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat === 'all' ? 'All Categories' : cat;
    categoryFilter.appendChild(opt);
  });

  
  if ([...categoryFilter.options].some(o => o.value === saved)) {
    categoryFilter.value = saved;
  } else {
    categoryFilter.value = 'all';
  }
}

function filterQuote() {
  const selected = categoryFilter.value;
  localStorage.setItem(SELECTED_KEY, selected);

  const list = (selected === 'all') ? quotes : quotes.filter(q => q.category === selected);
  displayQuotes(list);
}

function displayQuotes(list) {
  if (!list.length) {
    quoteDisplay.textContent = 'No quotes found in this category.';
    sessionStorage.removeItem(SESSION_LAST);
    return;
  }

  const q = list[list.length - 1];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
  try { sessionStorage.setItem(SESSION_LAST, JSON.stringify(q)); } catch {}
}


function createAddQuoteForm() {
  const wrap = document.createElement('div');
  wrap.className = 'row';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.id = 'newQuoteText';
  textInput.placeholder = 'Enter a new quote';
  textInput.maxLength = 280;

  const catInput = document.createElement('input');
  catInput.type = 'text';
  catInput.id = 'newQuoteCategory';
  catInput.placeholder = 'Enter quote category';
  catInput.maxLength = 60;

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', () => addQuote(textInput.value, catInput.value));

  wrap.append(textInput, catInput, addBtn);
  (formMount || document.body).appendChild(wrap);
}

function addQuote(text, category) {
  text = (text || '').trim();
  category = normalizeCategory(category || '');
  if (!text || !category) {
    toast('Please provide both a quote and a category.');
    return;
  }

  const newQ = { id: genLocalId(), text, category, source: 'local', updatedAt: Date.now(), pending: true };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  categoryFilter.value = category;
  filterQuote();
  toast('Quote added locally (will sync).');

 
  const t = document.getElementById('newQuoteText');
  const c = document.getElementById('newQuoteCategory');
  if (t) t.value = '';
  if (c) c.value = '';
}


function showRandomQuote() {
  const selected = categoryFilter.value || 'all';
  const pool = (selected === 'all') ? quotes : quotes.filter(q => q.category === selected);
  if (!pool.length) {
    quoteDisplay.textContent = `No quotes in “${selected}” yet. Add one below!`;
    sessionStorage.removeItem(SESSION_LAST);
    return;
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
  try { sessionStorage.setItem(SESSION_LAST, JSON.stringify(q)); } catch {}
}


function exportToJsonFile() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes-export.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const incoming = JSON.parse(e.target.result);
      if (!Array.isArray(incoming)) throw new Error('JSON is not an array.');
     
      const cleaned = incoming
        .filter(q => q && typeof q.text === 'string' && typeof q.category === 'string')
        .map(q => ({
          id: q.id || genLocalId(),
          text: q.text.trim(),
          category: normalizeCategory(q.category),
          source: q.source || 'local',
          updatedAt: q.updatedAt || Date.now()
        }))
        .filter(q => q.text && q.category);

     
      const seen = new Set(quotes.map(q => `${q.text}||${q.category}`));
      let merged = 0;
      for (const q of cleaned) {
        const key = `${q.text}||${q.category}`;
        if (!seen.has(key)) {
          quotes.push(q);
          seen.add(key);
          merged++;
        }
      }
      saveQuotes();
      populateCategories();
      filterQuote();
      toast(`Imported ${merged} quotes.`);
      event.target.value = '';
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
}


function saveQuotes() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes)); } catch {}
}
function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultQuotes.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(q => q && q.text && q.category);
  } catch {}
  return defaultQuotes.slice();
}
function restoreLastCategory() {
  const saved = localStorage.getItem(SELECTED_KEY);
  if (saved && [...categoryFilter.options].some(o => o.value === saved)) {
    categoryFilter.value = saved;
  }
}
function restoreLastQuoteOrShowRandom() {
  try {
    const last = sessionStorage.getItem(SESSION_LAST);
    if (last) {
      const q = JSON.parse(last);
      quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
      if ([...categoryFilter.options].some(o => o.value === q.category)) {
        categoryFilter.value = q.category;
      }
      return;
    }
  } catch {}
  filterQuote();
}


async function syncWithServer() {
  if (syncing) return;
  syncing = true;
  setSyncStatus('Syncing…');

  try {
   
    const pending = quotes.filter(q => q.pending);
    for (const q of pending) {
    
      const payload = { title: q.text, body: q.category, userId: 1 };
      const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
     
      q.source = 'server';
      q.pending = false;
      q.updatedAt = Date.now();
      q.serverId = json.id; 
    }

    
    const serverRes = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10');
    const serverPosts = await serverRes.json();
    const serverQuotes = serverPosts.map(p => ({
      id: `srv-${p.id}`,
      text: p.title,
      category: guessCategoryFromBody(p.body),
      source: 'server',
      updatedAt: Date.now() 
    }));

   
    const key = (q) => `${q.text}||${q.category}`;
    const localMap = new Map(quotes.map(q => [key(q), q]));
    let conflicts = 0, additions = 0, replacements = 0;

    for (const s of serverQuotes) {
      const k = key(s);
      if (!localMap.has(k)) {
        quotes.push(s); 
        localMap.set(k, s);
        additions++;
      } else {
        const local = localMap.get(k);
        if (local.source !== 'server' || (s.updatedAt >= local.updatedAt)) {
         
          const idx = quotes.indexOf(local);
          quotes[idx] = s;
          localMap.set(k, s);
          replacements++;
          if (local.source !== 'server') conflicts++;
        }
      }
    }

    saveQuotes();
    populateCategories();
    
    filterQuote();

    if (pending.length || additions || replacements) {
      toast(`Sync complete: uploaded ${pending.length}, added ${additions}, replaced ${replacements}${conflicts?`, conflicts ${conflicts}`:''}.`);
    } else {
      setSyncStatus('Up to date');
    }
  } catch (err) {
    setSyncStatus('Sync error');
    toast('Sync failed (network or CORS). Try again.');
  } finally {
    syncing = false;
    setTimeout(() => setSyncStatus('Idle'), 1500);
  }
}


function genLocalId() { return 'loc-' + Math.random().toString(36).slice(2, 9); }
function normalizeCategory(cat) {
  return cat.trim().replace(/\s+/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function guessCategoryFromBody(body) {
 
  const b = (body || '').toLowerCase();
  if (b.includes('code') || b.includes('js')) return 'Programming';
  if (b.includes('team') || b.includes('work')) return 'Teamwork';
  if (b.includes('life')) return 'Life';
  return 'General';
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
function setSyncStatus(msg) { syncStatusEl.textContent = msg; }
