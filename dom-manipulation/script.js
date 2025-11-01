// -------------------------------
// Local Storage Helpers
// -------------------------------
function getLocalQuotes() {
    return JSON.parse(localStorage.getItem("quotes") || "[]");
}

function setLocalQuotes(quotes) {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// -------------------------------
// UI Helpers
// -------------------------------
function displayQuotes(quotes) {
    const container = document.getElementById("quotes");
    container.innerHTML = "";
    quotes.forEach(q => {
        const div = document.createElement("div");
        div.className = "quote";
        div.textContent = q.text;
        container.appendChild(div);
    });
}

function notifyUser(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.prepend(notification);
    setTimeout(() => notification.remove(), 3000);
}

// -------------------------------
// Server Interaction (Mock)
// -------------------------------
const serverURL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(serverURL);
        const data = await response.json();
        // Take first 5 posts as quotes
        return data.slice(0, 5).map(item => ({ id: item.id, text: item.title }));
    } catch (error) {
        console.error("Error fetching server quotes:", error);
        return [];
    }
}

// Post new quote to server
async function postQuoteToServer(quote) {
    try {
        const response = await fetch(serverURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(quote)
        });
        return await response.json();
    } catch (error) {
        console.error("Error posting quote to server:", error);
        return null;
    }
}

// -------------------------------
// Sync and Conflict Resolution
// -------------------------------
function syncQuotes(serverQuotes) {
    const localQuotes = getLocalQuotes();
    const mergedQuotes = [...serverQuotes];

    let conflictResolved = false;

    // Keep local-only quotes
    localQuotes.forEach(lq => {
        if (!serverQuotes.find(sq => sq.id === lq.id)) {
            mergedQuotes.push(lq);
            conflictResolved = true;
        }
    });

    setLocalQuotes(mergedQuotes);
    displayQuotes(mergedQuotes);

    if (conflictResolved) {
        notifyUser("Local changes merged with server updates.");
    }
}

// -------------------------------
// Add New Quote
// -------------------------------
async function addQuote(text) {
    if (!text.trim()) return;

    const quotes = getLocalQuotes();
    const newQuote = { id: Date.now(), text };
    quotes.push(newQuote);

    setLocalQuotes(quotes);
    displayQuotes(quotes);

    await postQuoteToServer(newQuote); // Sync to server
}

// -------------------------------
// Event Listeners
// -------------------------------
document.getElementById("addQuoteBtn").addEventListener("click", () => {
    const input = document.getElementById("newQuote");
    addQuote(input.value);
    input.value = "";
});

// -------------------------------
// Initial Load & Periodic Sync
// -------------------------------
displayQuotes(getLocalQuotes());

setInterval(async () => {
    const serverQuotes = await fetchQuotesFromServer();
    syncQuotes(serverQuotes);
}, 10000); // every 10 seconds

