
const STORAGE_KEY = 'dqg-quotes-v2';
const SESSION_KEY = 'dqg-last-quote';


const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today.", category: "Motivation" },
  { text: "JavaScript is the language of the web.", category: "Programming" },
  { text: "First, solve the problem. Then, write the code.", category: "Programming" },
  { text: "What we think, we become.", category: "Mindset" }
];


let quotes = loadQuotes(); 


const quoteDisplay   = document.getElementById('quoteDisplay');
const categorySelect = document.getElementById('categorySelect');
const newQuoteBtn    = document.getElementById('newQuote');
const exportBtn      = document.getElementById('exportBtn');
const clearBtn       = document.getElementById('clearStorageBtn');
const formMount      = document.getElementById('formMount');

populateCategories();
createAddQuoteForm();
wireEvents();
restoreLastQuoteOrShowRandom();


function wireEvents() {
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categorySelect.addEventListener('change', showRandomQuote);
  exportBtn.addEventListener('click', exportToJsonFile);
  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    quotes = defaultQuotes.slice();
    populateCategories();
    showRandomQuote();
    alert('Local Storage cleared. Restored default quotes.');
  });
}


function populateCategories() {
  const categories = ['All', ...Array.from(new Set(quotes.map(q => q.category)))].sort((a,b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return a.localeCompare(b);
  });
  const current = categorySelect.value || 'All';
  categorySelect.innerHTML = '';
  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  }
  
  const values = [...categorySelect.options].map(o => o.value);
  categorySelect.value = values.includes(current) ? current : 'All';
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


function showRandomQuote() {
  const selected = categorySelect.value || 'All';
  const pool = (selected === 'All') ? quotes : quotes.filter(q => q.category === selected);

  if (pool.length === 0) {
    quoteDisplay.textContent = `No quotes in “${selected}” yet. Add one below!`;
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }

  const random = pool[Math.floor(Math.random() * pool.length)];

  quoteDisplay.textContent = `"${random.text}" — ${random.category}`;
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(random));
  } catch {}
}

function addQuote(text, category) {
  text = (text || '').trim();
  category = normalizeCategory(category || '');

  if (!text || !category) {
    alert('Please provide both a quote and a category.');
    return;
  }

  quotes.push({ text, category });   
  saveQuotes();                     
  populateCategories();             
  categorySelect.value = category; 
  showRandomQuote();                
  alert('Quote added successfully!');

  
  const t = document.getElementById('newQuoteText');
  const c = document.getElementById('newQuoteCategory');
  if (t) t.value = '';
  if (c) c.value = '';
}


function saveQuotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch {}
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultQuotes.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      
      return parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
    }
  } catch {}
  return defaultQuotes.slice();
}

function restoreLastQuoteOrShowRandom() {
  try {
    const last = sessionStorage.getItem(SESSION_KEY);
    if (last) {
      const q = JSON.parse(last);
      quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
      
      const values = [...categorySelect.options].map(o => o.value);
      if (values.includes(q.category)) categorySelect.value = q.category;
      return;
    }
  } catch {}
  showRandomQuote();
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


window.importFromJsonFile = function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const incoming = JSON.parse(e.target.result);

      
      if (!Array.isArray(incoming)) throw new Error('JSON is not an array.');
      const cleaned = incoming
        .filter(q => q && typeof q.text === 'string' && typeof q.category === 'string')
        .map(q => ({ text: q.text.trim(), category: normalizeCategory(q.category) }))
        .filter(q => q.text && q.category);

      if (cleaned.length === 0) throw new Error('No valid quotes found.');

     
      const seen = new Set(quotes.map(q => `${q.text}||${q.category}`));
      for (const q of cleaned) {
        const key = `${q.text}||${q.category}`;
        if (!seen.has(key)) {
          quotes.push(q);
          seen.add(key);
        }
      }

      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert('Quotes imported successfully!');
      event.target.value = ''; 
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
};


function normalizeCategory(cat) {
  return cat
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function exportToJsonFile() {
    const jsonStr = JSON.stringify(quotes);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuotes)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                alert('Quotes imported successfully!');
            } else {
                alert('Invalid JSON format.');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

function populateCategories() {
    let categoryFilter = document.getElementById("categoryFilter");
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    let quotes = JSON.parse(localStorage.getItem("quotes")) || [];
    let categories = [...new Set(quotes.map(q => q.category))];

    categories.forEach(category => {
        let option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Restore last selected category
    let savedCategory = localStorage.getItem("selectedCategory");
    if (savedCategory) {
        categoryFilter.value = savedCategory;
        filterQuote();
    }
}

function filterQuote() {
    let selectedCategory = document.getElementById("categoryFilter").value;
    localStorage.setItem("selectedCategory", selectedCategory);

    let quotes = JSON.parse(localStorage.getItem("quotes")) || [];
    let filteredQuotes = selectedCategory === "all"
        ? quotes
        : quotes.filter(q => q.category === selectedCategory);

    displayQuotes(filteredQuotes);
}


window.onload = function() {
    populateCategories();
};

