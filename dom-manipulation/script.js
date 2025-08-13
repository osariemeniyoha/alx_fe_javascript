let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don't let yesterday take up too much of today.", category: "Motivation" },
    { text: "JavaScript is the language of the web.", category: "Programming" },
    { text: "First, solve the problem. Then, write the code.", category: "Programming" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuote");


function createAddQuoteForm() {
    const formContainer = document.createElement("div");

    const quoteInput = document.createElement("input");
    quoteInput.type = "text";
    quoteInput.id = "newQuoteText";
    quoteInput.placeholder = "Enter a new quote";

    const categoryInput = document.createElement("input");
    categoryInput.type = "text";
    categoryInput.id = "newQuoteCategory";
    categoryInput.placeholder = "Enter quote category";

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Quote";
    addBtn.addEventListener("click", addQuote);

    formContainer.appendChild(quoteInput);
    formContainer.appendChild(categoryInput);
    formContainer.appendChild(addBtn);

    document.body.appendChild(formContainer);
}


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
    const filteredQuotes = selectedCategory === "All"
        ? quotes
        : quotes.filter(q => q.category === selectedCategory);

    if (filteredQuotes.length === 0) {
        quoteDisplay.textContent = `No quotes in "${selectedCategory}" yet. Add one below!`;
        return;
    }

    const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
}


function addQuote() {
    const text = document.getElementById("newQuoteText").value.trim();
    const category = document.getElementById("newQuoteCategory").value.trim();

    if (!text || !category) {
        alert("Please fill in both fields!");
        return;
    }

    quotes.push({ text, category });
    populateCategories();
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    showRandomQuote();
    alert("Quote added successfully!");
}


newQuoteBtn.addEventListener("click", showRandomQuote);


populateCategories();
createAddQuoteForm();
