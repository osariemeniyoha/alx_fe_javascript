let quotes = JSON.parse(localStorage.getItem('quotes')) || [];
let lastCategory = localStorage.getItem('lastCategory') || 'all';

document.addEventListener('DOMContentLoaded', () => {
    populateCategories();
    filterQuotes();
    document.getElementById('categoryFilter').value = lastCategory;
});

function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Populate categories from quotes
function populateCategories() {
    const categorySelect = document.getElementById('categoryFilter');
    const categories = ['all', ...new Set(quotes.map(q => q.category))];

    categorySelect.innerHTML = categories
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
}

// Filter quotes based on selected category
function filterQuotes() {
    const category = document.getElementById('categoryFilter').value;
    lastCategory = category;
    localStorage.setItem('lastCategory', category);

    const filtered = category === 'all'
        ? quotes
        : quotes.filter(q => q.category === category);

    displayQuotes(filtered);
}

function displayQuotes(quotesArray) {
    const container = document.getElementById('quoteDisplay');
    container.innerHTML = quotesArray.length
        ? quotesArray.map(q => `<p>"${q.text}" - ${q.author} [${q.category}]</p>`).join('')
        : '<p>No quotes found in this category.</p>';
}

// Add a new quote
function addQuote() {
    const text = document.getElementById('quoteText').value.trim();
    const author = document.getElementById('quoteAuthor').value.trim();
    const category = document.getElementById('quoteCategory').value.trim();

    if (text && author && category) {
        quotes.push({ text, author, category });
        saveQuotes();
        populateCategories();
        filterQuotes();

        document.getElementById('quoteText').value = '';
        document.getElementById('quoteAuthor').value = '';
        document.getElementById('quoteCategory').value = '';
    } else {
        alert('Please fill all fields.');
    }
}

// Export quotes to JSON
function exportToJsonFile() {
    const jsonStr = JSON.stringify(quotes);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Import quotes from JSON
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuotes)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                populateCategories();
                filterQuotes();
                alert('Quotes imported successfully!');
            } else {
                alert('Invalid JSON format.');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    fileReader.readAsText(event.target.files[0]);
}
