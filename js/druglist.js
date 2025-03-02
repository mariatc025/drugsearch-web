// druglist.js
document.addEventListener('DOMContentLoaded', function() {
    // Configuration constants
    const PAGE_SIZE = 20;
    const CACHE_TTL = 300000; // 5 minutes in milliseconds
    
    // State management
    let currentState = {
        page: 1,
        letter: 'A',
        searchQuery: '',
        lastUpdated: 0
    };

    // DOM elements
    const domElements = {
        loader: document.getElementById('interactionLoader'),
        drugList: document.getElementById('drugListContent'),
        pagination: document.getElementById('paginationControls'),
        searchInput: document.getElementById('drugFilterInput'),
        alphabetLinks: document.getElementById('alphabetLinks')
    };

    // Initialize application
    function initialize() {
        setupAlphabetNavigation();
        setupSearchHandler();
        loadDrugs();
    }

    // Set up alphabet navigation
    function setupAlphabetNavigation() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        domElements.alphabetLinks.innerHTML = letters.map(letter => `
            <a href="#" class="alphabet-link" 
               data-letter="${letter}" 
               onclick="handleLetterClick('${letter}')">
                ${letter}
            </a>
        `).join('');
    }

    // Handle letter clicks
    window.handleLetterClick = function(letter) {
        currentState.letter = letter;
        currentState.page = 1;
        loadDrugs();
    }

    // Set up search input handler with debounce
    function setupSearchHandler() {
        let timeout;
        domElements.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentState.searchQuery = e.target.value.trim();
                currentState.page = 1;
                loadDrugs();
            }, 300);
        });
    }

    // Main data loading function
    async function loadDrugs() {
        try {
            showLoader();
            
            // Check cache first
            const cacheKey = generateCacheKey();
            const cachedData = getCachedData(cacheKey);
            if (cachedData) {
                updateUI(cachedData);
                return;
            }

            // Fetch new data
            const response = await fetch(buildAPIUrl());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.status !== 'success') throw new Error(data.message);

            // Update cache and UI
            cacheData(cacheKey, data.data);
            updateUI(data.data);
            
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoader();
        }
    }

    // UI update functions
    function updateUI(data) {
        updateDrugList(data.drugs);
        updatePagination(data.pagination);
        updateActiveStates();
    }

    function updateDrugList(drugs) {
        domElements.drugList.innerHTML = drugs.length ? `
            <div class="drug-section">
                <h2 class="section-letter">${currentState.letter}</h2>
                <div class="drug-items">
                    ${drugs.map(drug => `
                        <div class="drug-item">
                            <h3><a href="drug.html?id=${drug.idDrug}">${drug.drug_name}</a></h3>
                            <div class="drug-info">
                                ${drug.category ? `<span class="category">${drug.category}</span>` : ''}
                                ${drug.molecular_formula ? `<span class="formula">${drug.molecular_formula}</span>` : ''}
                                <p>${drug.description || 'No description available'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : `<div class="alert alert-info">No medications found</div>`;
    }

    function updatePagination(pagination) {
        domElements.pagination.innerHTML = `
            <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" data-page="${pagination.currentPage - 1}">Previous</a>
            </li>
            ${Array.from({length: pagination.totalPages}, (_, i) => i + 1).map(page => `
                <li class="page-item ${page === pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" data-page="${page}">${page}</a>
                </li>
            `).join('')}
            <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" data-page="${pagination.currentPage + 1}">Next</a>
            </li>
        `;

        // Add pagination event listeners
        domElements.pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentState.page = parseInt(e.target.dataset.page);
                loadDrugs();
            });
        });
    }

    // Helper functions
    function buildAPIUrl() {
        const params = new URLSearchParams({
            letter: currentState.letter,
            page: currentState.page,
            pageSize: PAGE_SIZE,
            search: currentState.searchQuery
        });
        return `php/get_drug_list.php?${params}`;
    }

    function generateCacheKey() {
        return `${currentState.letter}-${currentState.page}-${currentState.searchQuery}`;
    }

    function getCachedData(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const { data, timestamp } = JSON.parse(item);
        return (Date.now() - timestamp < CACHE_TTL) ? data : null;
    }

    function cacheData(key, data) {
        localStorage.setItem(key, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    }

    function updateActiveStates() {
        // Update alphabet links
        document.querySelectorAll('.alphabet-link').forEach(link => {
            link.classList.toggle('active', link.dataset.letter === currentState.letter);
        });
    }

    function showLoader() {
        domElements.loader.style.display = 'block';
    }

    function hideLoader() {
        domElements.loader.style.display = 'none';
    }

    function showError(message) {
        domElements.drugList.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error</h4>
                <p>${message}</p>
            </div>
        `;
    }

    // Start the application
    initialize();
});
