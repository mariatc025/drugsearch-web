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
            
            // Create HTML for drug info
            let html = `
                <h1>${drug.drug_name}</h1>
                <div class="drug-details">
                    <div class="drug-info-columns">
                        <div class="drug-info-text">
                            <p><strong>DrugBank ID:</strong> ${drug.drugbank_id}</p>
                            <p><strong>Formula:</strong> ${drug.molecular_formula || 'Not available'}</p>
                            <p><strong>Weight:</strong> ${drug.molecular_weight || 'Not available'} g/mol</p>
                            <p><strong>Classification:</strong> ${drug.Classification_direct_parent || 'Not available'}</p>
                        </div>
                        <div class="drug-image-container" id="drugImageContainer">
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
                    <p>${drug.indications || 'No indications available'}</p>
                </div>
                
                <div id="sideEffects">
                    <h2>Side Effects</h2>
                    <div class="text-center py-3">
                        <div class="spinner-border text-primary spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading side effects...</span>
                        </div>
                        <p class="mt-2">Loading side effects...</p>
                    </div>
                </div>
                
                <div id="manufacturers">
                    <h2>Manufacturers</h2>
                    <div class="text-center py-3">
                        <div class="spinner-border text-primary spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading manufacturers...</span>
                        </div>
                        <p class="mt-2">Loading manufacturers...</p>
                    </div>
                </div>
                
                <div id="interactions">
                    <h2>Drug Interactions</h2>
                    <div class="text-center py-3">
                        <div class="spinner-border text-primary spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading interactions...</span>
                        </div>
                        <p class="mt-2">Loading interactions...</p>
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

// Function to load pubchem image
function loadPubChemImage(drugId) {
    // Get the drugImage container
    const container = document.getElementById('drugImageContainer');
    // Fetch the pubchem cid for that specific drug id
    fetch(`../php/get_pubchem_cid.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // If the fetching is successful modify the pubchem url with that id
            if (data.status === 'success' && data.pubchem_cid) {
                // PubChem image URL
                const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${data.pubchem_cid}&t=l`;
                
                // Add the obtained image into the container along with a caption
                container.innerHTML = `
                    <img src="${imageUrl}" alt="Drug structure" class="drug-structure-image">
                    <p class="image-caption">Structure from PubChem</p>
                `;
            } else {
                container.innerHTML = '<p class="text-muted">No structure image available</p>';
            }
        })
        .catch(error => {
            container.innerHTML = '<p class="text-muted">No structure image available</p>';
        });
}

function loadSideEffects(drugId) {
    // Get the sideEffects container
    const container = document.getElementById('sideEffects');
    // Fetch the side effects for that specific drug id
    fetch(`../php/get_side_effects.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // if there are no side effecs display this
            if (!data || data.length === 0) {
                container.innerHTML = '<h2>Side Effects</h2><p>No side effects information available.</p>';
                return;
            }
            // Otherwise iterate through the side effects creating a list and display the frequency percent or the lower and upper bound
            let html = '<h2>Side Effects</h2><ul class="side-effects-list">';
            data.forEach(effect => {
                let frequencyInfo = '';
                if (effect.frequency_percent) {
                    frequencyInfo = ` <span class="badge bg-info text-white">${effect.frequency_percent}</span>`;
                } else if (effect.lower_bound && effect.upper_bound) {
                    frequencyInfo = ` <span class="badge bg-info text-white">${effect.lower_bound}% to ${effect.upper_bound}%</span>`;
                }
                
                html += `<li>${effect.se_name}${frequencyInfo}</li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<h2>Side Effects</h2><p class="text-danger">Error loading side effects: ${error.message}</p>`;
        });
}

function loadManufacturers(drugId) {
    // Get the manufacturers container
    const container = document.getElementById('manufacturers');
    // Fetch the manufacturers for that specific drug id
    fetch(`../php/get_manufacturers.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // if there are no manufacturers display this
            if (!data || data.length === 0) {
                container.innerHTML = '<h2>Manufacturers</h2><p>No manufacturer information available.</p>';
                return;
            }
            // Otherwise iterate through the manufacturers creating a list
            let html = '<h2>Manufacturers</h2><ul class="manufacturers-list">';
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
    fetch(`../php/get_interactions.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // if there are no interactions display this
            if (!data || data.length === 0) {
                container.innerHTML = '<h2>Drug Interactions</h2><p>No interactions information available.</p>';
                return;
            }
            // Otherwise iterate through the interactions creating a list alogn with link to the other drug along with a description
            let html = '<h2>Drug Interactions</h2><ul class="interactions-list">';
            data.forEach(interaction => {
                html += `
                    <li>
                        <a href="drug.html?id=${interaction.idDrug}" class="text-primary">${interaction.drug_name}</a>
                        ${interaction.interaction_description ? ' - ' + interaction.interaction_description : ''}
                    </li>
                `;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<h2>Drug Interactions</h2><p class="text-danger">Error loading interactions: ${error.message}</p>`;
        });
}
