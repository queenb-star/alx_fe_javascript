let quotes = [];
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");

// Load quotes from local storage
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  quotes = storedQuotes ? JSON.parse(storedQuotes) : [
    { text: "The best way to predict the future is to create it.", category: "Motivation" },
    { text: "Dream big and dare to fail.", category: "Inspiration" }
  ];
  populateCategories();
}

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Display a random quote
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

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please enter both text and category!");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert("Quote added!");
}

// Populate dropdown categories
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join("");
  const lastSelected = localStorage.getItem("lastCategory");
  if (lastSelected) categoryFilter.value = lastSelected;
}

// Get filtered quotes
function getFilteredQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("lastCategory", selected);
  return selected === "all" ? quotes : quotes.filter(q => q.category === selected);
}

// Filter quotes
function filterQuotes() {
  displayRandomQuote();
}

// Export quotes to JSON
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "quotes.json";
  link.click();
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  reader.readAsText(event.target.files[0]);
}

// --- Step 1: Simulate server fetch ---
async function fetchServerQuotes() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const serverData = await response.json();
    const serverQuotes = serverData.map(post => ({
      text: post.title,
      category: "ServerSync"
    }));
    handleSync(serverQuotes);
  } catch (error) {
    console.error("Error fetching server data:", error);
  }
}

// --- Step 2: Handle Data Sync and Conflicts ---
function handleSync(serverQuotes) {
  const localTexts = new Set(quotes.map(q => q.text));
  const newQuotes = serverQuotes.filter(q => !localTexts.has(q.text));

  if (newQuotes.length > 0) {
    quotes = [...quotes, ...newQuotes];
    saveQuotes();
    showNotification(`${newQuotes.length} new quotes synced from server.`);
  }
}

// --- Step 3: Notify User of Sync ---
function showNotification(message) {
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => (notification.style.display = "none"), 4000);
}

// Periodic sync every 20 seconds
setInterval(fetchServerQuotes, 20000);

// Initialize app
loadQuotes();
displayRandomQuote();

