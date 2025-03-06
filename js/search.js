// Function to handle a search
function handleSearch(event) {
    // Prevents the default form submission
    event.preventDefault();
    // Obtain the searchInput and the filter option that is currently checked
    const searchInput = document.getElementById('searchInput').value;
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    
    // Give an error if no input is provided
    if (searchInput.trim() === '') {
        showMessage('Please enter a search term', 'error');
        return;
    }
    
    // Redirect to search results page with the input and type as URL parameters
    window.location.href = `search-results.html?search=${encodeURIComponent(searchInput)}&type=${searchType}`;
}
// Function for the autocomplete container which appears below the search bar
function initializeAutocomplete() {
    // Obtain the search input and create a container autocomplete-container that is initially hidden
    const searchInput = document.getElementById('searchInput');
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    autocompleteContainer.style.display = 'none';
    
    // Insert autocomplete container after search input
    searchInput.parentNode.insertBefore(autocompleteContainer, searchInput.nextSibling);
    
    // Add event listeners for changes in the searchInput (what the user is writing)
    searchInput.addEventListener('input', function() {
        // get the value of the input field, if it is lower than 2 characters don't show the autocomplete container
        const query = this.value.trim();
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Get checked search type
        const searchType = document.querySelector('input[name="searchType"]:checked').value;
        
        // Request suggestions for autocomplete through the autocomplete.php file
        fetch(`php/autocomplete.php?search=${encodeURIComponent(query)}&type=${searchType}`)
            // If the fetch is successful we obtain a response which we parse and if it is bigger than 0 we display in the autocomplete container
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.suggestions.length > 0) {
                    // Display suggestions
                    renderSuggestions(data.suggestions, autocompleteContainer);
                    autocompleteContainer.style.display = 'block';
                } else {
                    autocompleteContainer.style.display = 'none';
                }
            })
            // If the fetch gives an error the autocomplete container won't be displayed
            .catch(error => {
                console.error('Autocomplete error:', error);
                autocompleteContainer.style.display = 'none';
            });
    });
    
    // Hide suggestions when clicking outside of the autocomplete container
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
    
    // Show suggestions when input is focused if there's content (even if the user is not currently writing)
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            // Trigger the input event to show suggestions
            this.dispatchEvent(new Event('input'));
        }
    });
}
// Function to display the suggestions inside the autocomplete container
function renderSuggestions(suggestions, container) {
    // erase current text in the conteiner
    container.innerHTML = '';
    // iterate through the suggestions
    suggestions.forEach(suggestion => {
        // create a suggestion element for each suggestion adding in the text
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'autocomplete-item';
        suggestionElement.textContent = suggestion.text;
        
        // Add event listener in the suggestion element that detects if it is clicked 
        // and puts that text into searchinput and makes the container not visible
        suggestionElement.addEventListener('click', function() {
            document.getElementById('searchInput').value = suggestion.text;
            container.style.display = 'none';            
        });
        // Append the suggestion element to the container
        container.appendChild(suggestionElement);
    });
}
// Displays the results of the search fetching data from search_drug.php
function displaySearchResults(query, type) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `<p class="text-center"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Searching for ${type}: "${query}"...</p>`;
    
    fetch(`php/search_drug.php?search=${encodeURIComponent(query)}&type=${type}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Handle no results case
                if (data.drugs.length === 0) {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-info">
                            <p class="mb-0">No results found for ${type}: "${query}"</p>
                        </div>
                        <div class="text-center mt-4">
                            <a href="index.html" class="btn btn-primary">Try a New Search</a>
                        </div>
                    `;
                    return;
                }
                
                // Pagination settings
                const itemsPerPage = 18;
                const totalPages = Math.ceil(data.drugs.length / itemsPerPage);
                let currentPage = 1;
                
                // Function to render a specific page
                function renderPage(pageNumber) {
                    // Calculate start and end indices for the current page
                    const startIndex = (pageNumber - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, data.drugs.length);
                    const currentPageDrugs = data.drugs.slice(startIndex, endIndex);
                    // Modify the type for better readability
                    const formattedType = type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                    let resultText = data.drugs.length === 1 ? '1 result' : `${data.drugs.length} results`;
                    let html = `
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <h2 class="mb-0">Search Results for ${formattedType}: "${query}"</h2>
                            <span class="badge" style="background-color: #73839E;">${resultText}</span>
                        </div>
                        <div class="row">
                    `;
                    
                    // Generate drug cards for current page
                    currentPageDrugs.forEach(drug => {
                        // Determine if we have a PubChem ID for the thumbnail
                        const hasPubChemImage = drug.pubchem_cid ? true : false;
                        const imageHtml = hasPubChemImage ? 
                            `<img src="https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${drug.pubchem_cid}&t=s" alt="${drug.drug_name}" class="drug-thumbnail">` : 
                            `<div class="no-image">No structure image available</div>`;
                        
                        // Show synonym match if applicable
                        const synonymMatch = drug.matched_synonym ? 
                            `<div class="synonym-match alert alert-info py-1 px-2 mt-2 mb-0">
                                <small>Matched synonym: <strong>${drug.matched_synonym}</strong></small>
                             </div>` : '';
                        
                        html += `
                            <div class="col-md-6 col-lg-4 mb-4">
                                <div class="drug-card h-100">
                                    <div class="drug-card-content">
                                        <div class="drug-thumbnail-container">
                                            ${imageHtml}
                                        </div>
                                        <div class="drug-card-info">
                                            <h3>${drug.drug_name}</h3>
                                            <p class="text-muted"><strong>DrugBank ID:</strong> ${drug.drugbank_id}</p>
                                            <p>${drug.description ? truncateText(drug.description, 120) : 'No description available'}</p>
                                            ${synonymMatch}
                                        </div>
                                    </div>
                                    <a href="drug.html?id=${drug.idDrug}" class="btn btn-primary text-white w-100 mt-auto">View Details</a>
                                </div>
                            </div>
                        `;
                    });
                    
                    html += `</div>`;
                    
                    // Add pagination controls if more than one page
                    if (totalPages > 1) {
                        html += `
                            <nav aria-label="Search results pagination" class="mt-4">
                                <ul class="pagination justify-content-center">
                                    <li class="page-item ${pageNumber === 1 ? 'disabled' : ''}">
                                        <a class="page-link" href="#" data-page="${pageNumber - 1}" aria-label="Previous">
                                            <span aria-hidden="true">&laquo;</span>
                                        </a>
                                    </li>
                        `;
                        
                        // Generate page number buttons with improved display logic
                        const displayPages = getPageNumbersToDisplay(pageNumber, totalPages);
                        
                        displayPages.forEach(i => {
                            if (i === '...') {
                                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                            } else {
                                html += `
                                    <li class="page-item ${i === pageNumber ? 'active' : ''}">
                                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                                    </li>
                                `;
                            }
                        });
                        
                        html += `
                                    <li class="page-item ${pageNumber === totalPages ? 'disabled' : ''}">
                                        <a class="page-link" href="#" data-page="${pageNumber + 1}" aria-label="Next">
                                            <span aria-hidden="true">&raquo;</span>
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        `;
                    }
                    
                    // Add New Search button
                    html += `
                        <div class="text-center mt-4">
                            <a href="index.html" class="btn btn-secondary">New Search</a>
                        </div>
                    `;
                    
                    resultsContainer.innerHTML = html;
                    
                    // Add event listeners to clicks in the pagination buttons
                    document.querySelectorAll('.pagination .page-link').forEach(button => {
                        button.addEventListener('click', function(e) {
                            e.preventDefault();
                            const newPage = parseInt(this.dataset.page);
                            if (newPage >= 1 && newPage <= totalPages) {
                                currentPage = newPage;
                                renderPage(currentPage);
                                // Scroll to top of results
                                resultsContainer.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    });
                }
                
                // Helper function to determine which page numbers to display
                function getPageNumbersToDisplay(currentPage, totalPages) {
                    let displayPages = [];
                    
                    // Always show first page
                    displayPages.push(1);
                    
                    // For small number of pages, show all
                    if (totalPages <= 7) {
                        for (let i = 2; i < totalPages; i++) {
                            displayPages.push(i);
                        }
                    } else {
                        // For larger number of pages, show smart pagination
                        if (currentPage > 3) {
                            displayPages.push('...');
                        }
                        
                        // Show pages around current page
                        const startPage = Math.max(2, currentPage - 1);
                        const endPage = Math.min(totalPages - 1, currentPage + 1);
                        
                        for (let i = startPage; i <= endPage; i++) {
                            displayPages.push(i);
                        }
                        
                        if (currentPage < totalPages - 2) {
                            displayPages.push('...');
                        }
                    }
                    
                    // Always show last page if there is more than one page
                    if (totalPages > 1) {
                        displayPages.push(totalPages);
                    }
                    
                    return displayPages;
                }
                
                // Initial page render
                renderPage(currentPage);
            } else {
                showMessage('Error fetching search results: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message, 'error');
        });
}

function truncateText(text, maxLength) {
    if (text.length >= maxLength) {
        return text.substring(0, maxLength); 
    }

    const padding = ' '.repeat(maxLength - text.length); 
    return text + padding; 
}

