// ------------------- DYNAMIC QUOTE GENERATOR -------------------

// Initialize the quotes array (loaded from localStorage)
let quotes = [];

// Storage keys
const QUOTES_KEY = "dqg_quotes";
const LAST_QUOTE_KEY = "dqg_last_quote";
const LAST_FILTER_KEY = "dqg_last_filter";

// Get DOM elements
const newQuoteBtn = document.getElementById("newQuoteBtn");
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");
const addQuoteContainer = document.getElementById("addQuoteContainer");
const showAddFormBtn = document.getElementById("showAddFormBtn");
const quotesListContainer = document.getElementById("quotesListContainer");
const toggleListBtn = document.getElementById("toggleListBtn");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");

// ------------------- LOCAL STORAGE HANDLING -------------------

// Load quotes from localStorage
function loadQuotesFromLocalStorage() {
  const stored = localStorage.getItem(QUOTES_KEY);
  if (stored) {
    quotes = JSON.parse(stored);
  } else {
    // Default starter quotes
    quotes = [
      { text: "Believe in yourself and all that you are.", category: "Motivation" },
      { text: "Creativity takes courage.", category: "Inspiration" },
      { text: "The best way to predict the future is to create it.", category: "Success" },
    ];
    saveQuotes();
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

// Save last shown quote in sessionStorage
function saveLastShownToSession(quote) {
  sessionStorage.setItem(LAST_QUOTE_KEY, JSON.stringify(quote));
}

// Load last shown quote from sessionStorage
function loadLastShownFromSession() {
  const stored = sessionStorage.getItem(LAST_QUOTE_KEY);
  return stored ? JSON.parse(stored) : null;
}

// ------------------- QUOTE GENERATION -------------------

// Display a random quote
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  renderQuoteText(quote);
  saveLastShownToSession(quote);
}

// Render a quote in the display area
function renderQuoteText(quote) {
  quoteDisplay.innerHTML = `
    <p class="quote-text">"${quote.text}"</p>
    <p class="quote-category">— ${quote.category}</p>
  `;
}

// ------------------- CATEGORY MANAGEMENT -------------------

// Get unique categories
function uniqueCategories() {
  return [...new Set(quotes.map(q => q.category))];
}

// Populate main category dropdown
function updateCategoryList() {
  categorySelect.innerHTML = '<option value="all">All Categories</option>';
  const categories = uniqueCategories();
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// ------------------- ADD NEW QUOTES -------------------

function createAddQuoteForm() {
  addQuoteContainer.innerHTML = `
    <h3>Add a New Quote</h3>
    <input type="text" id="newQuoteText" placeholder="Enter quote text" />
    <input type="text" id="newQuoteCategory" placeholder="Enter category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;

  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  updateCategoryList();
  populateCategories(); // Update the filter list dynamically
  renderQuotesList();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");
}

// ------------------- LIST VIEW -------------------

function renderQuotesList() {
  quotesListContainer.innerHTML = "";

  const list = document.createElement("div");
  list.className = "quote-list";

  quotes.forEach(q => {
    const item = document.createElement("div");
    item.className = "quote-item";
    item.innerHTML = `
      <p>${q.text}</p>
      <span class="category">[${q.category}]</span>
    `;
    list.appendChild(item);
  });

  quotesListContainer.appendChild(list);
}

// ------------------- JSON IMPORT / EXPORT -------------------

// Export quotes as JSON
function exportQuotesAsJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

// Import from JSON file
function importFromJsonFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      updateCategoryList();
      populateCategories();
      renderQuotesList();
      alert("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

// ------------------- CATEGORY FILTERING -------------------

// Populate filter dropdown dynamically
function populateCategories() {
  const filterDropdown = document.getElementById("categoryFilter");
  if (!filterDropdown) return;

  filterDropdown.innerHTML = '<option value="all">All Categories</option>';
  const categories = uniqueCategories();

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filterDropdown.appendChild(option);
  });

  // Restore last selected filter if saved
  const lastFilter = localStorage.getItem(LAST_FILTER_KEY);
  if (lastFilter && categories.includes(lastFilter)) {
    filterDropdown.value = lastFilter;
    filterQuotes();
  }
}

// Filter quotes by category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem(LAST_FILTER_KEY, selectedCategory);

  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  renderFilteredQuotes(filteredQuotes);
}

// Render filtered quotes
function renderFilteredQuotes(filteredQuotes) {
  quotesListContainer.innerHTML = "";

  const header = document.createElement("h3");
  header.textContent = `Quotes (${filteredQuotes.length})`;
  quotesListContainer.appendChild(header);

  if (filteredQuotes.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No quotes found for this category.";
    quotesListContainer.appendChild(msg);
    return;
  }

  const list = document.createElement("div");
  filteredQuotes.forEach(q => {
    const item = document.createElement("div");
    item.className = "quote-item";
    item.innerHTML = `
      <p>"${q.text}"</p>
      <span class="category">— ${q.category}</span>
    `;
    list.appendChild(item);
  });
  quotesListContainer.appendChild(list);
}

// ------------------- INITIALIZATION -------------------

function wireUp() {
  loadQuotesFromLocalStorage();
  updateCategoryList();
  populateCategories();
  renderQuotesList();
  createAddQuoteForm();

  const last = loadLastShownFromSession();
  if (last && last.text) renderQuoteText(last);

  newQuoteBtn.addEventListener("click", showRandomQuote);
  categorySelect.addEventListener("change", showRandomQuote);
  showAddFormBtn.addEventListener("click", () => {
    const isHidden = addQuoteContainer.getAttribute("aria-hidden") === "true";
    addQuoteContainer.setAttribute("aria-hidden", !isHidden);
    addQuoteContainer.style.display = isHidden ? "block" : "none";
    if (isHidden) createAddQuoteForm();
  });

  addQuoteContainer.style.display = "none";
  addQuoteContainer.setAttribute("aria-hidden", "true");

  toggleListBtn.addEventListener("click", () => {
    quotesListContainer.style.display =
      quotesListContainer.style.display === "none" ? "block" : "none";
  });

  exportBtn.addEventListener("click", exportQuotesAsJson);
  importFileInput.addEventListener("change", (e) => {
    importFromJsonFile(e.target.files[0]);
    importFileInput.value = "";
  });
}

// ------------------- RUN -------------------
document.addEventListener("DOMContentLoaded", wireUp);

