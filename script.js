// ---------------- VARIABLES ----------------
var quotes = [];
var quoteText = document.getElementById("quoteText");
var quoteCategory = document.getElementById("quoteCategory");
var categoryFilter = document.getElementById("categoryFilter");
var notification = document.getElementById("notification");
var newQuoteBtn = document.getElementById("newQuoteBtn");

newQuoteBtn.addEventListener("click", displayRandomQuote);

// ---------------- LOCAL STORAGE ----------------
function loadQuotes() {
    var stored = localStorage.getItem("quotes");
    if (stored) {
        quotes = JSON.parse(stored);
    } else {
        quotes = [
            { text: "The best way to predict the future is to create it.", category: "Motivation" },
            { text: "Dream big and dare to fail.", category: "Inspiration" }
        ];
    }
    populateCategories();
    displayRandomQuote();
}

function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------------- DISPLAY QUOTES ----------------
function displayRandomQuote() {
    var filtered = getFilteredQuotes();
    if (filtered.length === 0) {
        quoteText.textContent = "No quotes for this category.";
        quoteCategory.textContent = "";
        return;
    }
    var random = filtered[Math.floor(Math.random() * filtered.length)];
    quoteText.textContent = random.text;
    quoteCategory.textContent = "— " + random.category;
    sessionStorage.setItem("lastQuote", JSON.stringify(random));
}

// ---------------- ADD NEW QUOTE ----------------
function addQuote() {
    var text = document.getElementById("newQuoteText").value.trim();
    var category = document.getElementById("newQuoteCategory").value.trim();
    if (!text || !category) {
        alert("Please enter both quote and category.");
        return;
    }
    quotes.push({ text: text, category: category });
    saveQuotes();
    populateCategories();
    alert("Quote added!");
}

// ---------------- CATEGORY FILTER ----------------
function populateCategories() {
    var uniqueCategories = [];
    for (var i = 0; i < quotes.length; i++) {
        if (uniqueCategories.indexOf(quotes[i].category) === -1) {
            uniqueCategories.push(quotes[i].category);
        }
    }
    uniqueCategories.unshift("all");
    categoryFilter.innerHTML = "";
    for (var j = 0; j < uniqueCategories.length; j++) {
        var option = document.createElement("option");
        option.value = uniqueCategories[j];
        option.textContent = uniqueCategories[j];
        categoryFilter.appendChild(option);
    }
    var last = localStorage.getItem("lastCategory");
    if (last) categoryFilter.value = last;
}

function getFilteredQuotes() {
    var selected = categoryFilter.value;
    localStorage.setItem("lastCategory", selected);
    if (selected === "all") return quotes;
    return quotes.filter(q => q.category === selected);
}

function filterQuotes() {
    displayRandomQuote();
}

// ---------------- JSON IMPORT/EXPORT ----------------
function exportQuotes() {
    var blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "quotes.json";
    link.click();
}

function importFromJsonFile(event) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var imported = JSON.parse(e.target.result);
        for (var i = 0; i < imported.length; i++) quotes.push(imported[i]);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
    };
    reader.readAsText(event.target.files[0]);
}

// ---------------- SERVER INTERACTION ----------------
async function fetchQuotesFromServer() {
    try {
        const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
        const data = await res.json();
        const serverQuotes = data.map(item => ({ text: item.title, category: "ServerSync" }));
        return serverQuotes;
    } catch (err) {
        console.error("Error fetching from server:", err);
        return [];
    }
}

async function postQuotesToServer(localQuotes) {
    try {
        const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            body: JSON.stringify(localQuotes),
            headers: { "Content-Type": "application/json; charset=UTF-8" }
        });
        const result = await res.json();
        console.log("Posted:", result);
    } catch (err) {
        console.error("Error posting to server:", err);
    }
}

// ---------------- SYNC & CONFLICT RESOLUTION ----------------
async function syncQuotes() {
    const serverQuotes = await fetchQuotesFromServer();
    const localTexts = quotes.map(q => q.text);

    for (let i = 0; i < serverQuotes.length; i++) {
        const index = localTexts.indexOf(serverQuotes[i].text);
        if (index >= 0) {
            quotes[index] = serverQuotes[i]; // server overwrites local
        } else {
            quotes.push(serverQuotes[i]);
        }
    }

    saveQuotes();
    showNotification(serverQuotes.length + " quotes synced from server.");
    displayRandomQuote();
}

// ---------------- UI NOTIFICATIONS ----------------
function showNotification(msg) {
    if (!notification) return;
    notification.textContent = msg;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 4000);
}

// ---------------- INITIALIZE ----------------
loadQuotes();
setInterval(syncQuotes, 20000);

