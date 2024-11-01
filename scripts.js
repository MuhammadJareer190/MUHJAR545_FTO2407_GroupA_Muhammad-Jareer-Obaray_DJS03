import { books, authors, genres, BOOKS_PER_PAGE } from './data.js';

let page = 1;
let matches = books;

// Define the BookPreview Web Component
class BookPreview extends HTMLElement {
    constructor() {
        super();

        // Attach shadow DOM for encapsulation
        this.attachShadow({ mode: 'open' });

        // Define template and style for the component
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin: 4px 0;
                }
                .preview {
                    border-width: 0;
                    width: 100%;
                    font-family: Roboto, sans-serif;
                    padding: 0.5rem 1rem;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    text-align: left;
                    border-radius: 8px;
                    border: 1px solid rgba(var(--color-dark), 0.15);
                    background: rgba(var(--color-light), 1);
                }

                .preview:hover {
                    background: rgba(var(--color-blue), 0.05);
                }
                .preview__image {
                    width: 48px;
                    eight: 70px;
                    object-fit: cover;
                    background: grey;
                    border-radius: 2px;
                    box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                    0px 1px 1px 0px rgba(0, 0, 0, 0.1), 0px 1px 3px 0px rgba(0, 0, 0, 0.1);
                }
                .preview__info {
                    padding: 1rem;
                }
                .preview__title {
                    margin: 0 0 0.5rem;
                    font-weight: bold;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;  
                    overflow: hidden;
                    color: rgba(var(--color-dark), 0.8)
                }
                .preview__author {
                color: rgba(var(--color-dark), 0.4);
                }
            </style>
            <button class="preview">
                <img class="preview__image" src="" alt="Book cover" />
                <div class="preview__info">
                    <h3 class="preview__title"></h3>
                    <div class="preview__author"></div>
                </div>
            </button>
        `;
    }

    // Method to set book data for the component
    set bookData({ image, title, authorName }) {
        this.shadowRoot.querySelector('.preview__image').src = image;
        this.shadowRoot.querySelector('.preview__title').textContent = title;
        this.shadowRoot.querySelector('.preview__author').textContent = authorName;
    }
}

// Register the custom element
customElements.define('book-preview', BookPreview);

// Function to create and return a BookPreview element
function createBookElement({ author, id, image, title }) {
    const bookElement = document.createElement('book-preview');
    bookElement.bookData = { image, title, authorName: authors[author] };
    bookElement.setAttribute('data-preview', id);
    return bookElement;
}

// Function to render books on the page
function renderBooks(bookList, append = false) {
    const fragment = document.createDocumentFragment();
    bookList.slice(0, BOOKS_PER_PAGE).forEach(book => {
        const bookElement = createBookElement(book);
        fragment.appendChild(bookElement);
    });

    const listItems = document.querySelector('[data-list-items]');
    if (!append) listItems.innerHTML = '';
    listItems.appendChild(fragment);
}

// Initialize book display
renderBooks(matches);

// Function to populate dropdowns
function populateDropdown(data, targetElement, defaultOptionText) {
    const fragment = document.createDocumentFragment();
    const firstElement = document.createElement('option');
    firstElement.value = 'any';
    firstElement.innerText = defaultOptionText;
    fragment.appendChild(firstElement);

    Object.entries(data).forEach(([id, name]) => {
        const optionElement = document.createElement('option');
        optionElement.value = id;
        optionElement.innerText = name;
        fragment.appendChild(optionElement);
    });

    document.querySelector(targetElement).appendChild(fragment);
}

// Populate genre and author dropdowns
populateDropdown(genres, '[data-search-genres]', 'All Genres');
populateDropdown(authors, '[data-search-authors]', 'All Authors');

// Function to update theme based on user selection
function updateTheme(theme) {
    const dark = theme === 'night' ? '255, 255, 255' : '10, 10, 20';
    const light = theme === 'night' ? '10, 10, 20' : '255, 255, 255';
    document.documentElement.style.setProperty('--color-dark', dark);
    document.documentElement.style.setProperty('--color-light', light);
    document.querySelector('[data-settings-theme]').value = theme;
}

// Set initial theme based on user preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    updateTheme('night');
} else {
    updateTheme('day');
}

// Update "Show More" button text
function updateShowMoreButton() {
    const remainingBooks = matches.length - (page * BOOKS_PER_PAGE);
    document.querySelector('[data-list-button]').innerHTML = `
        <span>Show more</span>
        <span class="list__remaining">(${Math.max(remainingBooks, 0)})</span>
    `;
    document.querySelector('[data-list-button]').disabled = remainingBooks <= 0;
}

updateShowMoreButton();

// Event handlers for toggling overlays
function toggleOverlay(elementSelector, open = true) {
    document.querySelector(elementSelector).open = open;
}

document.querySelector('[data-search-cancel]').addEventListener('click', () => toggleOverlay('[data-search-overlay]', false));
document.querySelector('[data-settings-cancel]').addEventListener('click', () => toggleOverlay('[data-settings-overlay]', false));
document.querySelector('[data-header-search]').addEventListener('click', () => toggleOverlay('[data-search-overlay]'));
document.querySelector('[data-header-settings]').addEventListener('click', () => toggleOverlay('[data-settings-overlay]'));
document.querySelector('[data-list-close]').addEventListener('click', () => toggleOverlay('[data-list-active]', false));

// Theme change event
document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);
    updateTheme(theme);
    toggleOverlay('[data-settings-overlay]', false);
});

// Function to handle search filtering
function filterBooks(filters) {
    return books.filter(book => {
        const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
        const authorMatch = filters.author === 'any' || book.author === filters.author;
        const titleMatch = filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase());
        return genreMatch && authorMatch && titleMatch;
    });
}

// Search form event
document.querySelector('[data-search-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    
    matches = filterBooks(filters);
    page = 1;
    renderBooks(matches);
    updateShowMoreButton();

    document.querySelector('[data-list-message]').classList.toggle('list__message_show', matches.length < 1);
    toggleOverlay('[data-search-overlay]', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Load more books
document.querySelector('[data-list-button]').addEventListener('click', () => {
    const nextPageItems = matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE);
    renderBooks(nextPageItems, true);
    page += 1;
    updateShowMoreButton();
});

// Handle book preview display
document.querySelector('[data-list-items]').addEventListener('click', (event) => {
    const previewId = event.target.closest('[data-preview]')?.getAttribute('data-preview');
    if (previewId) {
        const activeBook = books.find(book => book.id === previewId);
        if (activeBook) {
            document.querySelector('[data-list-active]').open = true;
            document.querySelector('[data-list-blur]').src = activeBook.image;
            document.querySelector('[data-list-image]').src = activeBook.image;
            document.querySelector('[data-list-title]').innerText = activeBook.title;
            document.querySelector('[data-list-subtitle]').innerText = `${authors[activeBook.author]} (${new Date(activeBook.published).getFullYear()})`;
            document.querySelector('[data-list-description]').innerText = activeBook.description;
        }
    }
});