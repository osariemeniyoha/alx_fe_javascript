
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Life" },
  { text: "If you can dream it, you can do it.", category: "Motivation" }
];


const categorySelect = document.getElementById("categorySelect");
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearBtn = document.getElementById("clearStorageBtn");


function populateCategories() {
  const categories = ["All", ...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = categories.map(cat => 
    `<option value="${cat}">${cat}</option>`
  ).join("");

 
  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory && categories.includes(savedCategory)) {
    categorySelect.value = savedCategory;
  }
}


function getFilteredQuotes() {
  const selectedCategory = categorySelect.value;
  if (selectedCategory === "All") return quotes;
  return quotes.filter(q => q.category === selectedCategory);
}


function showQuote() {
  const filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }
  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = randomQuote.text;
}


categorySelect.addEventListener("change", () => {
  localStorage.setItem("selectedCategory", categorySelect.value);
  showQuote();
});


newQuoteBtn.addEventListener("click", showQuote);


exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
});


importFile.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes = importedQuotes;
        localStorage.setItem("quotes", JSON.stringify(quotes));
        populateCategories();
        showQuote();
      }
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});


clearBtn.addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});


populateCategories();
showQuote();
