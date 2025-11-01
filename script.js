// ---------------- VARIABLES ----------------
let quotes = [];
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");

// ---------------- LOCAL STORAGE ----------------
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "The best way to predict the future is to create it.", category: "Motivation" },
    { text: "Dream big and dare to fail.", category: "Inspiration" }
  ];
  populateCategories();
  displayRandomQuote();
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------------- DISPLAY ----------------
function displayRandomQuote() {
  const filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    quoteText.textContent = "No quotes found for this category.";
    quoteCategory.textContent = "";
    return;
  }
  const random = filtered[Math.floor(Math.random() * filtered.length)];
  quoteText.textContent = random.text;
  quoteCategory.textContent = `— ${random.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(random));
}

// ---------------- ADD QUOTES ----------------
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please enter both quote and category.");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert("Quote added!");
}

// ---------------- CATEGORY FILTER ----------------
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
  const last = localStorage.getItem("lastCategory");
  if (last) categoryFilter.value = last;
}

function getFilteredQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("lastCategory", selected);
  return selected === "all" ? quotes : quotes.filter(q => q.category === selected);
}

function filterQuotes() {
  displayRandomQuote();
}

// ---------------- JSON IMPORT/EXPORT ----------------
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "quotes.json";
  link.click();
}

function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    const imported = JSON.parse(e.target.result);
    quotes.push(...imported);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  reader.readAsText(event.target.files[0]);
}

// ---------------- SERVER INTERACTION ----------------
function fetchQuotesFromServer() {
  return fetch("https://jsonplaceholder.typicode.com/posts?_limit=5")
    .then(res => res.json())
    .then(data => data.map(post => ({ text: post.title, category: "ServerSync" })))
    .catch(err => { console.error(err); return []; });
}

function postQuotesToServer(localQuotes) {
  return fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify(localQuotes),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  })
  .then(res => res.json())
  .then(data => console.log("Posted to server:", data))
  .catch(err => console.error(err));
}

// ---------------- SYNC & CONFLICT RESOLUTION ----------------
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localTexts = new Set(quotes.map(q => q.text));

  // Server takes precedence
  serverQuotes.forEach(sq => {
    const index = quotes.findIndex(q => q.text === sq.text);
    if (index >= 0) quotes[index] = sq;
    else quotes.push(sq);
  });

  saveQuotes();
  showNotification(`${serverQuotes.length} quotes synced from server.`);
  displayRandomQuote();
}

// ---------------- UI NOTIFICATIONS ----------------
function showNotification(msg) {
  notification.textContent = msg;
  notification.style.display = "block";
  setTimeout(() => notification.style.display = "none", 4000);
}

// ---------------- INITIALIZE ----------------
loadQuotes();
setInterval(syncQuotes, 20000);

