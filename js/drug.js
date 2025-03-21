// Add event listener to hide loading spinner when content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('drugContent').style.display = 'block';
    }, 1000); // Simulating loading delay
});

// Function to loadDrugInfo
function loadDrugInfo(drugId) {
    // Get element drugInfo (found in drug.html) and create the container along with loading spinner
    const drugInfoContainer = document.getElementById('drugInfo');
    drugInfoContainer.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading drug information...</p>
        </div>
    `;
    
    // Obtain drugname
    const drugNameBreadcrumb = document.getElementById('drugName');
    
    // Fetch drug information from get_drug.php
    fetch(`php/get_drug.php?id=${drugId}`)
        .then(response => response.json())
        .then(drug => {
            // if the drug doesn't exist or it gives an error display error screen
            if (!drug || drug.status === 'error') {
                drugInfoContainer.innerHTML = `
                    <div class="alert alert-danger m-4">
                        <h4 class="alert-heading">Error!</h4>
                        <p>Could not load drug information. The drug may not exist or there was a server error.</p>
                    </div>
                `;
                return;
            }
            // Update breadcrumb with drug name
            if (drugNameBreadcrumb) {
                drugNameBreadcrumb.textContent = drug.drug_name;
            }

            // Check if the drug is already saved
            const checkSavedPromise = isSavedDrug(drugId);
            
            checkSavedPromise.then(isSaved => {
                // Create HTML for drug info and give the option to save drug
                let html = `
                <!-- Tabs navigation - Moved above the drug header -->
                <ul class="nav nav-tabs mb-4" id="drugInfoTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab" aria-controls="overview" aria-selected="true">Overview</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="side-effects-tab" data-bs-toggle="tab" data-bs-target="#sideEffectsTab" type="button" role="tab" aria-controls="sideEffectsTab" aria-selected="false">Side Effects</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="manufacturers-tab" data-bs-toggle="tab" data-bs-target="#manufacturersTab" type="button" role="tab" aria-controls="manufacturersTab" aria-selected="false">Manufacturers</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="interactions-tab" data-bs-toggle="tab" data-bs-target="#interactionsTab" type="button" role="tab" aria-controls="interactionsTab" aria-selected="false">Drug Interactions</button>
                    </li>
                </ul>

                <div class="drug-header d-flex justify-content-between align-items-center">
                    <h1>${drug.drug_name}</h1>
                    ${isSaveButtonEnabled() ? `
                    <button id="saveDrugBtn" class="btn btn-outline-primary" onclick="saveDrug(${drugId}, '${drug.drug_name}')" ${isSaved ? 'disabled' : ''}>
                            <i class="heart-icon">${isSaved ? '♥' : '♡'}</i> ${isSaved ? 'Saved' : 'Save Drug'}
                    </button>
                    ` : ''}
                </div>

                <!-- Tab content -->
                <div class="tab-content" id="drugInfoTabContent">
                    <!-- Overview Tab -->
                    <div class="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
                        <div class="drug-details">
                            <div class="drug-info-columns d-flex">
                                <div class="drug-info-text flex-grow-1">
                                    <p><strong>DrugBank ID:</strong> 
                                        ${drug.drugbank_id ? `<a href="https://go.drugbank.com/drugs/${drug.drugbank_id}" target="_blank">${drug.drugbank_id}</a>` : 'Not available'}
                                    </p>
                                    <p><strong>Formula:</strong> ${drug.molecular_formula || 'Not available'}</p>
                                    <p><strong>Weight:</strong> ${drug.molecular_weight || 'Not available'} g/mol</p>
                                    <p><strong>Classification:</strong> ${drug.Classification_direct_parent || 'Not available'}</p>
                                </div>
                                <!-- Image container moved to the right -->
                                <div class="drug-image-container ml-auto" id="drugImageContainer">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading structure image...</span>
                                    </div>
                                    <p class="mt-2">Loading structure image...</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="drug-description">
                            <h2>Description</h2>
                            <p>${drug.description || 'No description available'}</p>
                        </div>
                        
                        <div class="drug-indications">
                            <h2>Indications</h2>
                            <p>${drug.indications ? drug.indications.replace(/;/g, ', ') : 'No indications available'}</p>
                        </div>
                    </div>
                    
                    <!-- Side Effects Tab -->
                    <div class="tab-pane fade" id="sideEffectsTab" role="tabpanel" aria-labelledby="side-effects-tab">
                        <h2>Side Effects</h2>
                        <div class="scrollable-content" id="sideEffects">
                            <div class="text-center py-3">
                                <div class="spinner-border text-primary spinner-border-sm" role="status">
                                    <span class="visually-hidden">Loading side effects...</span>
                                </div>
                                <p class="mt-2">Loading side effects...</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Manufacturers Tab -->
                    <div class="tab-pane fade" id="manufacturersTab" role="tabpanel" aria-labelledby="manufacturers-tab">
                        <h2>Manufacturers</h2>
                        <div class="scrollable-content" id="manufacturers">
                            <div class="text-center py-3">
                                <div class="spinner-border text-primary spinner-border-sm" role="status">
                                    <span class="visually-hidden">Loading manufacturers...</span>
                                </div>
                                <p class="mt-2">Loading manufacturers...</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Drug Interactions Tab -->
                    <div class="tab-pane fade" id="interactionsTab" role="tabpanel" aria-labelledby="interactions-tab">
                        <h2>Drug Interactions</h2>
                        <div class="scrollable-content" id="interactions">
                            <div class="text-center py-3">
                                <div class="spinner-border text-primary spinner-border-sm" role="status">
                                    <span class="visually-hidden">Loading interactions...</span>
                                </div>
                                <p class="mt-2">Loading interactions...</p>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            
                drugInfoContainer.innerHTML = html;
                
                // Load PubChem image
                loadPubChemImage(drugId);
                
                // Load additional information such as side effects, manufacturers and interactions
                loadSideEffects(drugId);
                loadManufacturers(drugId);
                loadInteractions(drugId);
            });
        })
        .catch(error => {
            drugInfoContainer.innerHTML = `
                <div class="alert alert-danger m-4">
                    <h4 class="alert-heading">Error!</h4>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        });
}


function loadSideEffects(drugId) {
    // Get the sideEffects container
    const container = document.getElementById('sideEffects');
    // Fetch the side effects for that specific drug id
    fetch(`php/get_side_effects.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // if there are no side effects display this
            if (!data || data.length === 0) {
                container.innerHTML = '<p>No side effects information available.</p>';
                return;
            }
            
            // Sort the side effects by percentage (higher to lower)
            data.sort((a, b) => {
                // Convert values to numbers for proper comparison
                const percentA = parseFloat(a.frequency_percent) || 0;
                const percentB = parseFloat(b.frequency_percent) || 0;
                
                // If both have percentages, compare them
                if (percentA > 0 && percentB > 0) {
                    return percentB - percentA;
                }
                
                // If only one has a percentage, prioritize it
                if (percentA > 0) return -1;
                if (percentB > 0) return 1;
                
                // If neither has a percentage, use upper bound
                const upperA = parseFloat(a.upper_bound) || 0;
                const upperB = parseFloat(b.upper_bound) || 0;
                
                return upperB - upperA;
            });
            
            // Create the HTML for the side effects list
            let html = '<ul class="side-effects-list">';
            data.forEach(effect => {
                let frequencyInfo = '';

                // Convert values to numbers for proper comparison
                const lower = parseFloat(effect.lower_bound);
                const upper = parseFloat(effect.upper_bound);
                const percent = parseFloat(effect.frequency_percent);

                // Only show percentages if they are meaningful
                if (!isNaN(percent) && percent > 0) {
                    frequencyInfo = ` <span class="badge bg-info text-white">${effect.frequency_percent}</span>`;
                } else if (!isNaN(lower) && !isNaN(upper) && (lower > 0 || upper > 0)) {
                    frequencyInfo = ` <span class="badge bg-info text-white">${effect.lower_bound}% to ${effect.upper_bound}%</span>`;
                }

                // Always show the side effect name, but hide zero percentages
                html += `<li>${effect.se_name}${frequencyInfo}</li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<p class="text-danger">Error loading side effects: ${error.message}</p>`;
        });
}

// Function to check if save button should be enabled (user logged in)
function isSaveButtonEnabled() {
    return sessionStorage.getItem('user_id') !== null;
}

// Function to save a drug
function saveDrug(drugId, drugName) {
    const userId = sessionStorage.getItem('user_id');
    
    if (!userId) {
        showMessage('Please log in to save drugs', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'save_drug');
    formData.append('user_id', userId);
    formData.append('drug_id', drugId);
    
    fetch('php/save_drug.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage(`${drugName} has been saved`, 'success');
            // Update the save button to indicate it's saved
            const saveDrugBtn = document.getElementById('saveDrugBtn');
            if (saveDrugBtn) {
                saveDrugBtn.innerHTML = '<i class="heart-icon">♥</i> Saved';
                saveDrugBtn.disabled = true;
            }
        } else {
            showMessage(data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error saving drug: ' + error.message, 'error');
    });
}

// Function to check if a drug is already saved by the user
function isSavedDrug(drugId) {
    const userId = sessionStorage.getItem('user_id');
    
    if (!userId) {
        return Promise.resolve(false);
    }
    
    return fetch(`php/get_saved_drugs.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.savedDrugs) {
                // Use strict equality and convert to string to ensure correct comparison
                return data.savedDrugs.some(drug => String(drug.idDrug) === String(drugId));
            }
            return false;
        })
        .catch(() => false);
}

// Function to load pubchem image
function loadPubChemImage(drugId) {
    const container = document.getElementById('drugImageContainer');
    
    if (!container) {
        console.error("Error: 'drugImageContainer' not found.");
        return;
    }

    fetch(`php/get_pubchem_cid.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.pubchem_cid) {
                const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${data.pubchem_cid}&t=l`;
                const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/compound/${data.pubchem_cid}`;

                container.innerHTML = `
                    <a href="${pubchemUrl}" target="_blank">
                        <img src="${imageUrl}" alt="Drug structure" class="drug-structure-image">
                    </a>
                    <p class="image-caption">Click the image to view on PubChem</p>
                `;
            } else {
                container.innerHTML = '<p class="text-muted">No structure image available</p>';
            }
        })
        .catch(error => {
            container.innerHTML = '<p class="text-muted">No structure image available</p>';
            console.error("Error fetching PubChem image:", error);
        });
}

function loadManufacturers(drugId) {
    // Get the manufacturers container
    const container = document.getElementById('manufacturers');
    // Fetch the manufacturers for that specific drug id
    fetch(`php/get_manufacturers.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // if there are no manufacturers display this
            if (!data || data.length === 0) {
                container.innerHTML = '<h2>Manufacturers</h2><p>No manufacturer information available.</p>';
                return;
            }
            // Otherwise iterate through the manufacturers creating a list
            let html = '<ul class="manufacturers-list">';
            data.forEach(manufacturer => {
                html += `<li>${manufacturer.manufacturer_name}</li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<h2>Manufacturers</h2><p class="text-danger">Error loading manufacturers: ${error.message}</p>`;
        });
}

function loadInteractions(drugId) {
    // Get the interactions container
    const container = document.getElementById('interactions');
    // Fetch the interactions for that specific drug id
    fetch(`php/get_interactions.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // if there are no interactions display this
            if (!data || data.length === 0) {
                container.innerHTML = '<p>No interactions information available.</p>';
                return;
            }
            // Create a table for interactions
            let html = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Drug Name</th>
                                <th>Interaction Description</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.forEach(interaction => {
                html += `
                    <tr>
                        <td><a href="drug.html?id=${interaction.idDrug}" class="text-primary">${interaction.drug_name}</a></td>
                        <td>${interaction.interaction_description || 'No description available'}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<p class="text-danger">Error loading interactions: ${error.message}</p>`;
        });
}