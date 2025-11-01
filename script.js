// ------------------- DYNAMIC QUOTE GENERATOR -------------------
let quotes = [];
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");

// ------------------- LOCAL STORAGE -------------------
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "The best way to predict the future is to create it.", category: "Motivation" },
    { text: "Dream big and dare to fail.", category: "Inspiration" }
  ];
  populateCategories();
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ------------------- QUOTE DISPLAY -------------------
function displayRandomQuote() {
  const filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    quoteText.textContent = "No quotes found for this category.";
    quoteCategory.textContent = "";
    return;
  }
  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteText.textContent = randomQuote.text;
  quoteCategory.textContent = `— ${randomQuote.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
}

// ------------------- ADD NEW QUOTE -------------------
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please enter both text and category!");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert("Quote added!");
}

// ------------------- CATEGORY FILTER -------------------
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
  const lastSelected = localStorage.getItem("lastCategory");
  if (lastSelected) categoryFilter.value = lastSelected;
}

function getFilteredQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("lastCategory", selected);
  return selected === "all" ? quotes : quotes.filter(q => q.category === selected);
}

function filterQuotes() {
  displayRandomQuote();
}

// ------------------- JSON IMPORT/EXPORT -------------------
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

// ------------------- SERVER SYNC -------------------
// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await response.json();
  return data.map(post => ({ text: post.title, category: "ServerSync" }));
}

// Merge local and server quotes
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localTexts = new Set(quotes.map(q => q.text));
  const newQuotes = serverQuotes.filter(q => !localTexts.has(q.text));

  if (newQuotes.length > 0) {
    quotes = [...quotes, ...newQuotes];
    saveQuotes();
    showNotification(`${newQuotes.length} new quotes synced from server.`);
    populateCategories();
  }
}

// ------------------- UI NOTIFICATION -------------------
function showNotification(msg) {
  notification.textContent = msg;
  notification.style.display = "block";
  setTimeout(() => notification.style.display = "none", 4000);
}

// ------------------- INITIALIZE -------------------
loadQuotes();
displayRandomQuote();
setInterval(syncQuotes, 20000);

