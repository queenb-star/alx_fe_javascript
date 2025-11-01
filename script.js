// ---------------- VARIABLES ----------------
var quotes = [];
var quoteText = document.getElementById("quoteText");
var quoteCategory = document.getElementById("quoteCategory");
var categoryFilter = document.getElementById("categoryFilter");
var notification = document.getElementById("notification");

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
    quoteText.textContent = "No quotes found for this category.";
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
  if (last) {
    categoryFilter.value = last;
  }
}

function getFilteredQuotes() {
  var selected = categoryFilter.value;
  localStorage.setItem("lastCategory", selected);
  if (selected === "all") {
    return quotes;
  } else {
    var result = [];
    for (var i = 0; i < quotes.length; i++) {
      if (quotes[i].category === selected) {
        result.push(quotes[i]);
      }
    }
    return result;
  }
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
    for (var i = 0; i < imported.length; i++) {
      quotes.push(imported[i]);
    }
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  reader.readAsText(event.target.files[0]);
}

// ---------------- SERVER INTERACTION ----------------
function fetchQuotesFromServer() {
  return fetch("https://jsonplaceholder.typicode.com/posts?_limit=5")
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var serverQuotes = [];
      for (var i = 0; i < data.length; i++) {
        serverQuotes.push({ text: data[i].title, category: "ServerSync" });
      }
      return serverQuotes;
    })
    .catch(function(err) {
      console.error("Error fetching from server:", err);
      return [];
    });
}

function postQuotesToServer(localQuotes) {
  return fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify(localQuotes),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) { console.log("Posted to server:", data); })
  .catch(function(err) { console.error("Error posting to server:", err); });
}

// ---------------- SYNC & CONFLICT RESOLUTION ----------------
function syncQuotes() {
  fetchQuotesFromServer().then(function(serverQuotes) {
    var localTexts = [];
    for (var i = 0; i < quotes.length; i++) {
      localTexts.push(quotes[i].text);
    }

    for (var j = 0; j < serverQuotes.length; j++) {
      var index = localTexts.indexOf(serverQuotes[j].text);
      if (index >= 0) {
        quotes[index] = serverQuotes[j]; // overwrite local with server
      } else {
        quotes.push(serverQuotes[j]);
      }
    }
    saveQuotes();
    showNotification(serverQuotes.length + " quotes synced from server.");
    displayRandomQuote();
  });
}

// ---------------- UI NOTIFICATIONS ----------------
function showNotification(msg) {
  notification.textContent = msg;
  notification.style.display = "block";
  setTimeout(function() {
    notification.style.display = "none";
  }, 4000);
}

// ---------------- INITIALIZE ----------------
loadQuotes();
setInterval(syncQuotes, 20000);

