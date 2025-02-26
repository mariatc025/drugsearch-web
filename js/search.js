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
    resultsContainer.innerHTML = `<p>Searching for ${type}: "${query}"...</p>`;
    
    fetch(`../php/search_drug.php?search=${encodeURIComponent(query)}&type=${type}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.drugs.length === 0) {
                    resultsContainer.innerHTML = `<p>No results found for ${type}: "${query}"</p>`;
                    return;
                }
                
                let html = `<h2>Search Results for ${type}: "${query}"</h2>
                           <div class="drug-results">`;
                
                data.drugs.forEach(drug => {
                    html += `
                        <div class="drug-card">
                            <h3>${drug.drug_name}</h3>
                            <p><strong>DrugBank ID:</strong> ${drug.drugbank_id}</p>
                            <p>${drug.description ? drug.description.substring(0, 150) + '...' : 'No description available'}</p>
                            <a href="drug.html?id=${drug.idDrug}" class="btn">View Details</a>
                        </div>
                    `;
                });
                
                html += '</div>';
                resultsContainer.innerHTML = html;
            } else {
                showMessage('Error fetching search results: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message, 'error');
        });
}
