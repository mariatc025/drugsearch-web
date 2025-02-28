function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput').value;
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    
    if (searchInput.trim() === '') {
        showMessage('Please enter a search term', 'error');
        return;
    }
    
    // Redirect to search results page
    window.location.href = `search-results.html?search=${encodeURIComponent(searchInput)}&type=${searchType}`;
}
function displaySearchResults(query, type) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `<p class="text-center"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Searching for ${type}: "${query}"...</p>`;
    
    fetch(`../php/search_drug.php?search=${encodeURIComponent(query)}&type=${type}`)
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
                    
                    let html = `
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <h2 class="mb-0">Search Results for ${type}: "${query}"</h2>
                            <span class="badge bg-primary">${data.drugs.length} results</span>
                        </div>
                        <div class="row">
                    `;
                    
                    // Generate drug cards for current page
                    currentPageDrugs.forEach(drug => {
                        // Determine if we have a PubChem ID for the thumbnail
                        const hasPubChemImage = drug.pubchem_cid ? true : false;
                        const imageHtml = hasPubChemImage ? 
                            `<img src="https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${drug.pubchem_cid}&t=s" alt="${drug.drug_name}" class="drug-thumbnail">` : 
                            `<div class="no-image-placeholder">No structure image available</div>`;
                        
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
                        
                        // Generate page number buttons
                        for (let i = 1; i <= totalPages; i++) {
                            html += `
                                <li class="page-item ${i === pageNumber ? 'active' : ''}">
                                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                                </li>
                            `;
                        }
                        
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
                    
                    // Add event listeners to pagination buttons
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
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}
