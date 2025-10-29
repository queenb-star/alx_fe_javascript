// script.js

// ------- Persistent storage helpers -------
const STORAGE_KEY = 'dynamic_quote_generator_v1';

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored data', e);
    return null;
  }
}

// ------- Initial quotes (fallback) -------
let quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspiration" },
  { text: "Simplicity is the ultimate sophistication.", category: "design" },
  { text: "Practice like you've never won. Perform like you've never lost.", category: "motivation" },
  { text: "Good design is obvious. Great design is transparent.", category: "design" },
  { text: "Be the change that you wish to see in the world.", category: "inspiration" }
];

const ui = {
  quoteDisplay: document.getElementById('quoteDisplay'),
  categoryContainer: document.getElementById('categoryContainer'),
  categorySelect: document.getElementById('categorySelect'),
  newQuoteBtn: document.getElementById('newQuote'),
  toggleAddFormBtn: document.getElementById('toggleAddForm'),
  addQuoteArea: document.getElementById('addQuoteArea'),
  clearStorageBtn: document.getElementById('clearStorage')
};

// Load persisted state if exists
(function initState() {
  const state = loadState();
  if (state && Array.isArray(state.quotes) && state.quotes.length) {
    quotes = state.quotes;
  } else {
    // save initial to storage for first-run
    saveState({ quotes });
  }
})();

// Utility: collect unique categories
function getCategories() {
  const set = new Set();
  quotes.forEach(q => set.add(q.category || 'uncategorized'));
  return Array.from(set).sort();
}

// Render category buttons and select options
function renderCategories(selectedCategory = 'all') {
  const categories = getCategories();
  // Clear container and select, keep 'all' in select
  ui.categoryContainer.innerHTML = '';
  ui.categorySelect.innerHTML = '<option value="all">All categories</option>';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-btn';
    btn.textContent = cat;
    btn.dataset.category = cat;
    if (cat === selectedCategory) btn.classList.add('active');
    ui.categoryContainer.appendChild(btn);

    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedCategory) opt.selected = true;
    ui.categorySelect.appendChild(opt);
  });

  // If no categories, show placeholder
  if (categories.length === 0) {
    ui.categoryContainer.textContent = '(no categories yet)';
  }
}

// Show a random quote (optionally filtered by category)
function showRandomQuote(category = ui.categorySelect.value || 'all') {
  let pool = quotes.slice();
  if (category && category !== 'all') {
    pool = pool.filter(q => (q.category || 'uncategorized') === category);
  }

  if (pool.length === 0) {
    ui.quoteDisplay.innerHTML = '<div class="small">No quotes found for that category — add one below!</div>';
    return;
  }

  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx];

  ui.quoteDisplay.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = chosen.text;
  p.style.margin = 0;
  p.style.fontWeight = '600';
  ui.quoteDisplay.appendChild(p);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `Category: ${chosen.category || 'uncategorized'} — (${idx + 1}/${pool.length})`;
  ui.quoteDisplay.appendChild(meta);
}

// Dynamically create the add-quote form and attach handlers
function createAddQuoteForm() {
  ui.addQuoteArea.innerHTML = ''; // clear
  const form = document.createElement('form');
  form.id = 'addQuoteForm';
  form.innerHTML = `
    <input type="text" id="newQuoteText" placeholder="Enter a new quote" required />
    <input type="text" id="newQuoteCategory" placeholder="Enter quote category (e.g. inspiration)" />
    <button type="submit">Add Quote</button>
    <button type="button" id="addSample" title="Adds a sample quote">Sample</button>
    <div id="formMessage" class="small" aria-live="polite" style="margin-left:8px;"></div>
  `;

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = form.querySelector('#newQuoteText').value.trim();
    let category = form.querySelector('#newQuoteCategory').value.trim();
    if (!category) category = 'uncategorized';

    const ok = addQuote(text, category);
    const msg = form.querySelector('#formMessage');
    if (ok) {
      msg.textContent = 'Quote added!';
      form.reset();
      setTimeout(() => msg.textContent = '', 1700);
    } else {
      msg.textContent = 'Please enter a non-empty quote.';
    }
  });

  // sample quick-add button
  form.querySelector('#addSample').addEventListener('click', () => {
    const sample = {
      text: "Small steps every day lead to big results.",
      category: "habit"
    };
    addQuote(sample.text, sample.category);
  });

  ui.addQuoteArea.appendChild(form);
}

// Add a quote to array + update UI + persist
function addQuote(text, category) {
  if (!text || !text.trim()) return false;
  const quote = { text: text.trim(), category: (category || 'uncategorized').trim().toLowerCase() };
  quotes.push(quote);
  saveState({ quotes });
  renderCategories(ui.categorySelect.value || 'all');
  showRandomQuote(ui.categorySelect.value || 'all');
  return true;
}

// Reset stored quotes (dangerous: resets to initial default list)
function resetStorage() {
  if (!confirm('Reset stored quotes to the initial sample set?')) return;
  quotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspiration" },
    { text: "Simplicity is the ultimate sophistication.", category: "design" },
    { text: "Practice like you've never won. Perform like you've never lost.", category: "motivation" },
    { text: "Good design is obvious. Great design is transparent.", category: "design" },
    { text: "Be the change that you wish to see in the world.", category: "inspiration" }
  ];
  saveState({ quotes });
  renderCategories('all');
  showRandomQuote('all');
}

// UI wiring
function setupEventListeners() {
  // category button clicks (event delegation)
  ui.categoryContainer.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button.category-btn');
    if (!btn) return;
    const cat = btn.dataset.category;
    // toggle active styling
    [...ui.categoryContainer.querySelectorAll('.category-btn')].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // update select to match and show quote
    ui.categorySelect.value = cat;
    showRandomQuote(cat);
  });

  // select change
  ui.categorySelect.addEventListener('change', () => {
    const val = ui.categorySelect.value;
    // update active button look
    [...ui.categoryContainer.querySelectorAll('.category-btn')].forEach(b => b.classList.toggle('active', b.dataset.category === val));
    showRandomQuote(val);
  });

  // new quote button
  ui.newQuoteBtn.addEventListener('click', () => {
    showRandomQuote(ui.categorySelect.value || 'all');
  });

  // toggle add form
  ui.toggleAddFormBtn.addEventListener('click', () => {
    const area = ui.addQuoteArea;
    if (area.innerHTML.trim() === '') {
      createAddQuoteForm();
      ui.toggleAddFormBtn.textContent = 'Hide Add Form';
    } else {
      area.innerHTML = '';
      ui.toggleAddFormBtn.textContent = 'Add Quote';
    }
  });

  ui.clearStorageBtn.addEventListener('click', resetStorage);
}

// Init app
(function bootstrap() {
  renderCategories('all');
  setupEventListeners();
  createAddQuoteForm();

  // show an initial quote
  showRandomQuote('all');
})();
