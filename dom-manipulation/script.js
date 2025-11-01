/* script.js
   Dynamic Quote Generator with localStorage, sessionStorage, and JSON import/export
*/

// localStorage key
const STORAGE_KEY = "dqg_quotes_v1"; // change if structure changes in future
const LAST_QUOTE_KEY = "dqg_last_quote"; // sessionStorage key for last shown quote

// Default initial quotes (used only if no localStorage data)
const defaultQuotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspirational" },
  { text: "Simplicity is the soul of efficiency.", category: "productivity" },
  { text: "If you are going through hell, keep going.", category: "resilience" },
  { text: "Learning never exhausts the mind.", category: "learning" },
  { text: "Small steps every day.", category: "productivity" }
];

// DOM refs
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const showAddFormBtn = document.getElementById("showAddFormBtn");
const addQuoteContainer = document.getElementById("addQuoteContainer");
const quotesListContainer = document.getElementById("quotesListContainer");
const toggleListBtn = document.getElementById("toggleListBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFile");

// In-memory quotes array (will be loaded from localStorage)
let quotes = [];

// ---------- Utilities ----------
function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text) el.textContent = options.text;
  if (options.html) el.innerHTML = options.html;
  if (options.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) el.setAttribute(k, v);
  }
  return el;
}

function uniqueCategories() {
  const set = new Set(quotes.map(q => q.category).filter(Boolean));
  return Array.from(set).sort();
}

// ---------- localStorage / sessionStorage ----------
function saveQuotesToLocalStorage() {
  try {
    const json = JSON.stringify(quotes);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
  }
}

function loadQuotesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      quotes = defaultQuotes.slice();
      saveQuotesToLocalStorage();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Stored quotes is not an array");
    // validate items loosely: must have text
    quotes = parsed.filter(q => q && typeof q.text === "string").map(q => ({
      text: (q.text || "").trim(),
      category: (q.category || "uncategorized").trim().toLowerCase()
    }));
  } catch (err) {
    console.warn("Could not load quotes from localStorage (resetting):", err);
    quotes = defaultQuotes.slice();
    saveQuotesToLocalStorage();
  }
}

function saveLastShownToSession(quoteObj) {
  try {
    if (!quoteObj) return;
    sessionStorage.setItem(LAST_QUOTE_KEY, JSON.stringify({ text: quoteObj.text, category: quoteObj.category, timestamp: Date.now() }));
  } catch (err) {
    console.error("Failed to save last quote to sessionStorage:", err);
  }
}

function loadLastShownFromSession() {
  try {
    const raw = sessionStorage.getItem(LAST_QUOTE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------- Rendering ----------
function updateCategoryList() {
  const current = categorySelect.value || "all";
  categorySelect.innerHTML = "";
  const allOpt = createElement("option", { attrs: { value: "all" }, text: "All" });
  categorySelect.appendChild(allOpt);
  for (const cat of uniqueCategories()) {
    const opt = createElement("option", { attrs: { value: cat }, text: cat });
    categorySelect.appendChild(opt);
  }
  const exists = Array.from(categorySelect.options).some(o => o.value === current);
  categorySelect.value = exists ? current : "all";
}

function renderQuoteText(q) {
  if (!q) {
    quoteDisplay.textContent = "No quote available for the selected category.";
    return;
  }
  quoteDisplay.innerHTML = "";
  const block = createElement("blockquote", { text: q.text, className: "quote-block" });
  block.style.margin = 0;
  const meta = createElement("div", { className: "meta", html: `<em>— ${q.category}</em>` });
  quoteDisplay.appendChild(block);
  quoteDisplay.appendChild(meta);
  // fade effect
  quoteDisplay.style.opacity = 0;
  setTimeout(() => { quoteDisplay.style.transition = "opacity 200ms"; quoteDisplay.style.opacity = 1; }, 10);
  // save last shown in sessionStorage
  saveLastShownToSession(q);
}

// ---------- Core features ----------
function showRandomQuote() {
  const selected = categorySelect.value;
  const pool = (selected && selected !== "all") ? quotes.filter(q => q.category === selected) : quotes.slice();
  if (pool.length === 0) {
    renderQuoteText(null);
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx];
  renderQuoteText(chosen);
}

function addQuote(text, category) {
  const t = (text || "").trim();
  const c = (category || "uncategorized").trim().toLowerCase() || "uncategorized";
  if (!t) {
    alert("Quote text cannot be empty.");
    return false;
  }
  // prevent exact duplicate (text + category)
  const exists = quotes.some(q => q.text === t && q.category === c);
  if (exists) {
    alert("This quote already exists (same text and category).");
    return false;
  }
  const newQuote = { text: t, category: c };
  quotes.push(newQuote);
  saveQuotesToLocalStorage();
  updateCategoryList();
  renderQuotesList();
  renderQuoteText(newQuote);
  return true;
}

window.addQuote = addQuote; // compatibility

function editQuote(index, newText, newCategory) {
  if (!quotes[index]) return;
  const t = (newText || "").trim();
  const c = (newCategory || "uncategorized").trim().toLowerCase();
  if (!t) { alert("Quote cannot be empty."); return false; }
  quotes[index].text = t;
  quotes[index].category = c;
  saveQuotesToLocalStorage();
  updateCategoryList();
  renderQuotesList();
  return true;
}

function deleteQuote(index) {
  if (!quotes[index]) return false;
  quotes.splice(index, 1);
  saveQuotesToLocalStorage();
  updateCategoryList();
  renderQuotesList();
  return true;
}

// ---------- List rendering with edit/delete ----------
function renderQuotesList() {
  quotesListContainer.innerHTML = "";
  const header = createElement("h3", { text: `All Quotes (${quotes.length})` });
  quotesListContainer.appendChild(header);
  if (quotes.length === 0) {
    quotesListContainer.appendChild(createElement("div", { text: "No quotes available." }));
    return;
  }
  const list = createElement("div");
  quotes.forEach((q, index) => {
    const item = createElement("div", { className: "quote-item" });
    const left = createElement("div");
    left.appendChild(createElement("div", { text: q.text }));
    left.appendChild(createElement("div", { className: "meta", html: `<strong>Category:</strong> ${q.category}` }));

    const right = createElement("div");
    const editBtn = createElement("button", { text: "Edit" });
    editBtn.addEventListener("click", () => {
      const newText = prompt("Edit quote text:", q.text);
      if (newText === null) return; // cancelled
      const newCat = prompt("Edit category:", q.category) || "uncategorized";
      editQuote(index, newText, newCat);
    });

    const delBtn = createElement("button", { text: "Delete" });
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete this quote?")) return;
      deleteQuote(index);
    });

    right.appendChild(editBtn);
    right.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  });
  quotesListContainer.appendChild(list);
}

// ---------- Add form builder ----------
function createAddQuoteForm(container = addQuoteContainer) {
  container.innerHTML = "";
  container.setAttribute("aria-hidden", "false");

  const title = createElement("h3", { text: "Add a New Quote" });
  const form = createElement("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = form.querySelector("#newQuoteText").value;
    const category = form.querySelector("#newQuoteCategory").value;
    const success = addQuote(text, category);
    if (success) form.reset();
  });

  const textInput = createElement("textarea", { attrs: { id: "newQuoteText", placeholder: "Enter a new quote", rows: 3 } });
  textInput.style.width = "100%";
  const categoryInput = createElement("input", { attrs: { id: "newQuoteCategory", placeholder: "Enter quote category (e.g. inspirational)" } });
  categoryInput.style.width = "50%";

  const dataListId = "existingCategories";
  const datalist = createElement("datalist", { attrs: { id: dataListId } });
  for (const c of uniqueCategories()) datalist.appendChild(createElement("option", { attrs: { value: c } }));

  categoryInput.setAttribute("list", dataListId);

  const submitBtn = createElement("button", { text: "Add Quote", attrs: { type: "submit" } });

  form.appendChild(title);
  form.appendChild(textInput);
  form.appendChild(createElement("div", { html: "<br/>" }));
  form.appendChild(categoryInput);
  form.appendChild(datalist);
  form.appendChild(createElement("div", { html: "<br/>" }));
  form.appendChild(submitBtn);

  const sampleBtn = createElement("button", { text: "Add sample quote" });
  sampleBtn.type = "button";
  sampleBtn.addEventListener("click", () => addQuote("This is a sample quote added quickly.", "example"));

  form.appendChild(createElement("div", { html: "<br/>" }));
  form.appendChild(sampleBtn);

  container.appendChild(form);
}

// ---------- JSON Export / Import ----------
function exportQuotesAsJson() {
  try {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    a.download = `dynamic-quotes-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Export failed. See console for details.");
  }
}

// Validate imported data: must be an array of objects with `text` string property
function normalizeImportedQuotes(rawArray) {
  if (!Array.isArray(rawArray)) throw new Error("Imported JSON is not an array");
  const normalized = [];
  for (const item of rawArray) {
    if (!item || typeof item.text !== "string") continue; // skip invalid
    normalized.push({
      text: item.text.trim(),
      category: (item.category || "uncategorized").trim().toLowerCase()
    });
  }
  return normalized;
}

function importFromJsonFile(file) {
  if (!file) return;
  const fileReader = new FileReader();
  fileReader.onload = function (evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      const imported = normalizeImportedQuotes(parsed);
      if (imported.length === 0) {
        alert("No valid quotes found in file.");
        return;
      }
      // Merge imported quotes, avoiding duplicates (text+category)
      let added = 0;
      for (const q of imported) {
        const exists = quotes.some(existing => existing.text === q.text && existing.category === q.category);
        if (!exists) {
          quotes.push(q);
          added++;
        }
      }
      if (added > 0) {
        saveQuotesToLocalStorage();
        updateCategoryList();
        renderQuotesList();
        alert(`Imported ${added} new quote(s).`);
      } else {
        alert("No new quotes were imported (duplicates skipped).");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import JSON. Make sure the file contains a valid JSON array of quotes.");
    }
  };
  fileReader.onerror = function () {
    alert("Failed to read file.");
  };
  fileReader.readAsText(file);
}

// Make available to input onchange attribute if needed
window.importFromJsonFile = (event) => {
  const file = event?.target?.files?.[0];
  importFromJsonFile(file);
};

// ---------- Wiring ----------
function wireUp() {
  loadQuotesFromLocalStorage();
  updateCategoryList();
  renderQuotesList();
  createAddQuoteForm();

  // Restore last shown from session if exists
  const last = loadLastShownFromSession();
  if (last && last.text) {
    // display last session quote (but do not overwrite session)
    renderQuoteText({ text: last.text, category: last.category || "uncategorized" });
  }

  // events
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
    quotesListContainer.style.display = quotesListContainer.style.display === "none" ? "block" : "none";
  });

  exportBtn.addEventListener("click", exportQuotesAsJson);

  importBtn.addEventListener("click", () => {
    importFileInput.click(); // forward to hidden input
  });

  importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    importFromJsonFile(file);
    importFileInput.value = ""; // reset input so same file can be selected again later
  });
}

// Expose required functions globally
window.showRandomQuote = showRandomQuote;
window.createAddQuoteForm = createAddQuoteForm;

wireUp();

