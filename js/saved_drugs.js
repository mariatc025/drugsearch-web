// Function to load saved drugs
function loadSavedDrugs() {
    // Get the user ID from session storage
    const userId = sessionStorage.getItem('user_id');
    
    // If no user is logged in, redirect to login
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get the saved drugs list container
    const savedDrugsList = document.getElementById('savedDrugsList');
    
    // Show loading indicator
    savedDrugsList.innerHTML = `
        <div class="col-12 text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading saved drugs...</p>
        </div>
    `;
    
    // Fetch saved drugs
    fetch(`php/get_saved_drugs.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            // Handle no saved drugs case
            if (data.status === 'error' || !data.savedDrugs || data.savedDrugs.length === 0) {
                savedDrugsList.innerHTML = `
                    <div class="col-12">
                        <div class="alert text-center" style="background-color: #e2e8f0">
                            <p>You haven't saved any drugs yet.</p>
                            <a href="index.html" class="btn btn-primary mt-3">Start Searching</a>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Fetch full drug details for each saved drug
            const drugPromises = data.savedDrugs.map(savedDrug => 
                fetch(`php/search_drug.php?search=${encodeURIComponent(savedDrug.drug_name)}&type=drug`)
                    .then(response => response.json())
                    .then(searchData => {
                        const drug = searchData.drugs.find(drug => drug.idDrug === savedDrug.idDrug);
                        return drug ? { ...drug, saved_at: savedDrug.saved_at } : null;
                    })
            );
            
            Promise.all(drugPromises)
            .then(drugs => {
                // Filter out any null results
                const validDrugs = drugs.filter(drug => drug !== null);
                
                // Sort drugs by saved date (most recent first)
                validDrugs.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
                
                let html = `
                    <div class="col-12">
                        <h2 class="mb-4">Saved Drugs <span class="badge bg-secondary ms-2">${validDrugs.length}</span></h2>
                        <div class="list-group">
                `;
                
                // Generate list items
                validDrugs.forEach(drug => {
                    html += `
                        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-1">${drug.drug_name}</h5>
                                <div class="small text-muted">
                                    <strong>DrugBank ID:</strong> ${drug.drugbank_id || 'N/A'}
                                    <br>
                                    <strong>Molecular Formula:</strong> ${drug.molecular_formula || 'Not available'}
                                </div>
                            </div>
                            <div class="d-flex flex-column">
                                <a href="drug.html?id=${drug.idDrug}" class="btn btn-primary btn-sm mb-2">View Details</a>
                                <button class="btn btn-danger btn-sm" onclick="removeSavedDrug(${drug.idDrug})">Remove</button>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
                
                savedDrugsList.innerHTML = html;
            })
            .catch(error => {
                savedDrugsList.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <p>Error loading saved drugs: ${error.message}</p>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => {
            savedDrugsList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <p>Error fetching saved drugs: ${error.message}</p>
                    </div>
                </div>
            `;
        });
}

// Function to remove a saved drug
function removeSavedDrug(drugId) {
    const userId = sessionStorage.getItem('user_id');
    
    const formData = new FormData();
    formData.append('action', 'remove_saved_drug');
    formData.append('user_id', userId);
    formData.append('drug_id', drugId);
    
    fetch('php/save_drug.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage('Drug removed from saved list', 'success');
            // Reload saved drugs to update the list
            loadSavedDrugs();
        } else {
            showMessage(data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error removing drug: ' + error.message, 'error');
    });
}

// When the page loads, call loadSavedDrugs
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page navigation and user status
    initializePage();
    
    // Load saved drugs
    loadSavedDrugs();
});