
let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don't let yesterday take up too much of today.", category: "Motivation" },
    { text: "JavaScript is the language of the web.", category: "Programming" },
    { text: "First, solve the problem. Then, write the code.", category: "Programming" }
];


const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");


function populateCategories() {
 
    const categories = ["All", ...new Set(quotes.map(q => q.category))];

    
    categorySelect.innerHTML = "";

   
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}


function showRandomQuote() {
    const selectedCategory = categorySelect.value;

 
    let filteredQuotes = selectedCategory === "All"
        ? quotes
        : quotes.filter(q => q.category === selectedCategory);

    if (filteredQuotes.length === 0) {
        quoteDisplay.textContent = `No quotes found in "${selectedCategory}" category. Add one below!`;
        return;
    }

  
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];

   
    quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
}


function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();

    if (!text || !category) {
        alert("Please fill in both fields!");
        return;
    }

    
    quotes.push({ text, category });

   
    populateCategories();

   
    newQuoteText.value = "";
    newQuoteCategory.value = "";

    alert("Quote added successfully!");
}


newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);


populateCategories();
