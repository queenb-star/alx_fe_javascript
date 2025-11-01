/* script.js
   Advanced DOM manipulation for Dynamic Quote Generator
   - Exposes showRandomQuote and createAddQuoteForm (per spec)
   - Allows adding/editing/deleting quotes and categories
   - Updates DOM and internal quotes array dynamically
*/

// Initial quotes array (each item has text and category)
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspirational" },
  { text: "Simplicity is the soul of efficiency.", category: "productivity" },
  { text: "If you are going through hell, keep going.", category: "resilience" },
  { text: "Learning never exhausts the mind.", category: "learning" },
  { text: "Small steps every day.", category: "productivity" }
];

// DOM references
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const showAddFormBtn = document.getElementById("showAddFormBtn");
const addQuoteContainer = document.getElementById("addQuoteContainer");
const quotesListContainer = document.getElementById("quotesListContainer");
const toggleListBtn = document.getElementById("toggleListBtn");

// UTILITIES
function uniqueCategories() {
  const set = new Set(quotes.map(q => q.category).filter(Boolean));
  return Array.from(set).sort();
}

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

// Populate category <select>
function updateCategoryList() {
  // remember current selection
  const current = categorySelect.value || "all";
  // clear except 'all'
  categorySelect.innerHTML = "";
  const allOpt = createElement("option", { attrs: { value: "all" }, text: "All" });
  categorySelect.appendChild(allOpt);
  for (const cat of uniqueCategories()) {
    const opt = createElement("option", { attrs: { value: cat }, text: cat });
    categorySelect.appendChild(opt);
  }
  // restore selection if still exists
  const optExists = Array.from(categorySelect.options).some(o => o.value === current);
  categorySelect.value = optExists ? current : "all";
}

// Display a quote object (DOM update)
function renderQuoteText(q) {
  if (!q) {
    quoteDisplay.textContent = "No quote available for the selected category.";
    return;
  }
  // build content with category meta
  quoteDisplay.innerHTML = "";
  const block = createElement("blockquote", { text: q.text, className: "quote-block" });
  block.style.margin = 0;
  const meta = createElement("div", { className: "meta", html: `<em>— ${q.category}</em>` });
  quoteDisplay.appendChild(block);
  quoteDisplay.appendChild(meta);

  // subtle fade animation
  quoteDisplay.style.opacity = 0;
  setTimeout(() => quoteDisplay.style.transition = "opacity 250ms", 10);
  setTimeout(() => quoteDisplay.style.opacity = 1, 20);
}

// showRandomQuote as required by the task
function showRandomQuote() {
  // Filter by selected category
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

// Adds a new quote object to the array and updates UI
function addQuote(text, category) {
  // sanitize
  const t = (text || "").trim();
  const c = (category || "uncategorized").trim().toLowerCase() || "uncategorized";
  if (!t) {
    alert("Quote text cannot be empty.");
    return false;
  }
  const newQuote = { text: t, category: c };
  quotes.push(newQuote);
  updateCategoryList();
  renderQuotesList();
  // show the newly-added quote immediately
  renderQuoteText(newQuote);
  return true;
}

// Expose addQuote to window for backward compatibility if needed
window.addQuote = addQuote;

// Build and attach Add Quote form dynamically (per spec)
function createAddQuoteForm(container = addQuoteContainer) {
  container.innerHTML = ""; // clear existing
  container.setAttribute("aria-hidden", "false");

  const title = createElement("h3", { text: "Add a New Quote" });
  const form = createElement("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = form.querySelector("#newQuoteText").value;
    const category = form.querySelector("#newQuoteCategory").value;
    const success = addQuote(text, category);
    if (success) {
      form.reset();
    }
  });

  // text input
  const textInput = createElement("textarea", { attrs: { id: "newQuoteText", placeholder: "Enter a new quote", rows: 3 } });
  textInput.style.width = "100%";

  // category input (with datalist for suggestion)
  const categoryInput = createElement("input", { attrs: { id: "newQuoteCategory", placeholder: "Enter quote category (e.g. inspirational)" } });
  categoryInput.style.width = "50%";

  // datalist for existing categories
  const dataListId = "existingCategories";
  const datalist = createElement("datalist", { attrs: { id: dataListId } });
  for (const c of uniqueCategories()) {
    datalist.appendChild(createElement("option", { attrs: { value: c } }));
  }
  categoryInput.setAttribute("list", dataListId);

  // submit button
  const submitBtn = createElement("button", { text: "Add Quote", attrs: { type: "submit" } });

  // append controls
  form.appendChild(title);
  form.appendChild(textInput);
  form.appendChild(createElement("div", { html: "<br/>" }));
  form.appendChild(categoryInput);
  form.appendChild(datalist);
  form.appendChild(createElement("div", { html: "<br/>" }));
  form.appendChild(submitBtn);

  // optional quick-add example buttons
  const examples = createElement("div", { className: "small", html: "<em>Examples:</em> " });
  const sampleBtn = createElement("button", { text: "Add sample quote" });
  sampleBtn.type = "button";
  sampleBtn.addEventListener("click", () => {
    addQuote("This is a sample quote added quickly.", "example");
  });
  examples.appendChild(sampleBtn);
  form.appendChild(createElement("div", { html: "<br/>" }));
  form.appendChild(examples);

  container.appendChild(form);
}

// Render full quotes list with edit/delete (advanced DOM manipulation)
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

    // Edit button
    const editBtn = createElement("button", { text: "Edit" });
    editBtn.addEventListener("click", () => {
      // simple inline edit using prompt (kept short for demonstration)
      const newText = prompt("Edit quote text:", q.text);
      if (newText === null) return; // cancelled
      const newCat = prompt("Edit category:", q.category) || "uncategorized";
      if (newText.trim() === "") { alert("Quote can't be empty."); return; }
      quotes[index].text = newText.trim();
      quotes[index].category = newCat.trim().toLowerCase();
      updateCategoryList();
      renderQuotesList();
    });

    // Delete button
    const delBtn = createElement("button", { text: "Delete" });
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete this quote?")) return;
      quotes.splice(index, 1);
      updateCategoryList();
      renderQuotesList();
    });

    right.appendChild(editBtn);
    right.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  });

  quotesListContainer.appendChild(list);
}

// wire up controls
function wireUp() {
  updateCategoryList();
  renderQuotesList();
  createAddQuoteForm();

  // buttons/events
  newQuoteBtn.addEventListener("click", showRandomQuote);
  categorySelect.addEventListener("change", () => {
    // auto-show a quote for the selected category
    showRandomQuote();
  });

  showAddFormBtn.addEventListener("click", () => {
    const hidden = addQuoteContainer.getAttribute("aria-hidden") === "true";
    addQuoteContainer.setAttribute("aria-hidden", !hidden);
    if (!hidden) {
      addQuoteContainer.style.display = "block";
      createAddQuoteForm(); // recreate to refresh datalist
    } else {
      addQuoteContainer.style.display = "none";
    }
  });

  // initial visibility: hidden
  addQuoteContainer.style.display = "none";
  addQuoteContainer.setAttribute("aria-hidden", "true");

  toggleListBtn.addEventListener("click", () => {
    quotesListContainer.style.display = quotesListContainer.style.display === "none" ? "block" : "none";
  });
}

// call initial wire up
wireUp();

// Export required function names (ensure they are global if user expects)
window.showRandomQuote = showRandomQuote;
window.createAddQuoteForm = createAddQuoteForm;

