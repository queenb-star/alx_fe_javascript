// ======= Quotes Array and Storage =======
let quotes = [];
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const notification = document.getElementById('notification');

// Load quotes from localStorage
function loadQuotes() {
  const stored = localStorage.getItem('quotes');
  quotes = stored ? JSON.parse(stored) : [];
  populateCategories();
  showRandomQuote();
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// ======= Display Quotes =======
function showRandomQuote(filteredQuotes = quotes) {
  if (!filteredQuotes.length) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = filteredQuotes[randomIndex].text;
}

// ======= Add Quote =======
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');

  const newQuote = {
    text: textInput.value.trim(),
    category: categoryInput.value.trim() || 'General',
  };

  if (!newQuote.text) {
    alert("Quote text cannot be empty!");
    return;
  }

  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  textInput.value = '';
  categoryInput.value = '';
  showRandomQuote();
}

// ======= Categories =======
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// ======= Filtering =======
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem('lastFilter', selected);

  if (selected === 'all') {
    showRandomQuote(quotes);
  } else {
    showRandomQuote(quotes.filter(q => q.category === selected));
  }
}

// ======= JSON Export/Import =======
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const imported = JSON.parse(e.target.result);
    quotes.push(...imported);
    saveQuotes();
    populateCategories();
    showRandomQuote();
    notify('Quotes imported successfully!');
  };
  reader.readAsText(file);
}

// ======= Notifications =======
function notify(msg) {
  notification.textContent = msg;
  setTimeout(() => notification.textContent = '', 3000);
}

// ======= Server Sync (Mock API using JSONPlaceholder) =======
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

async function fetchQuotesFromServer() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    // Map server data to quotes
    data.slice(0, 5).forEach(d => {
      quotes.push({ text: d.title, category: 'Server' });
    });
    saveQuotes();
    populateCategories();
    notify('Quotes synced from server!');
  } catch (err) {
    console.error(err);
    notify('Failed to fetch quotes from server.');
  }
}

async function postQuotesToServer() {
  try {
    for (const q of quotes) {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ title: q.text }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
    notify('Quotes posted to server!');
  } catch (err) {
    console.error(err);
    notify('Failed to post quotes to server.');
  }
}

async function syncQuotes() {
  await fetchQuotesFromServer();
  await postQuotesToServer();
}

// Periodically sync every 20 seconds
setInterval(syncQuotes, 20000);

// ======= Event Listeners =======
document.getElementById('newQuote').addEventListener('click', () => showRandomQuote());
document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
categoryFilter.addEventListener('change', filterQuotes);
document.getElementById('exportJsonBtn').addEventListener('click', exportToJson);
document.getElementById('importFile').addEventListener('change', importFromJsonFile);

// ======= Initialize App =======
loadQuotes();
const lastFilter = localStorage.getItem('lastFilter') || 'all';
categoryFilter.value = lastFilter;
filterQuotes();

