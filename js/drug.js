function loadDrugInfo(drugId) {
    const drugInfoContainer = document.getElementById('drugInfo');
    drugInfoContainer.innerHTML = '<p>Loading drug information...</p>';
    
    // Fetch drug basic information
    fetch(`../php/get_drug.php?id=${drugId}`)
        .then(response => response.json())
        .then(drug => {
            if (!drug || drug.status === 'error') {
                drugInfoContainer.innerHTML = '<p>Error loading drug information.</p>';
                return;
            }
            
            // Create HTML for drug info
            let html = `
                <h1>${drug.drug_name}</h1>
                <div class="drug-details">
                    <p><strong>DrugBank ID:</strong> ${drug.drugbank_id}</p>
                    <p><strong>Formula:</strong> ${drug.molecular_formula || 'Not available'}</p>
                    <p><strong>Weight:</strong> ${drug.molecular_weight || 'Not available'} g/mol</p>
                    <p><strong>Classification:</strong> ${drug.Classification_direct_parent || 'Not available'}</p>
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
                    <p>Loading side effects...</p>
                </div>
                
                <div id="manufacturers">
                    <h2>Manufacturers</h2>
                    <p>Loading manufacturers...</p>
                </div>
                
                <div id="interactions">
                    <h2>Drug Interactions</h2>
                    <p>Loading interactions...</p>
                </div>
            `;
            
            drugInfoContainer.innerHTML = html;
            
            // Load additional information
            loadSideEffects(drugId);
            loadManufacturers(drugId);
            loadInteractions(drugId);
        })
        .catch(error => {
            drugInfoContainer.innerHTML = `<p>Error: ${error.message}</p>`;
        });
}

function loadSideEffects(drugId) {
    const container = document.getElementById('sideEffects');
    
    fetch(`../php/get_side_effects.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                container.innerHTML = '<p>No side effects information available.</p>';
                return;
            }
            
            let html = '<ul class="side-effects-list">';
            data.forEach(effect => {
                let frequencyInfo = '';
                if (effect.frequency_percent) {
                    frequencyInfo = ` - ${effect.frequency_percent}`;
                } else if (effect.lower_bound && effect.upper_bound) {
                    frequencyInfo = ` - ${effect.lower_bound}% to ${effect.upper_bound}%`;
                }
                
                html += `<li>${effect.se_name}${frequencyInfo}</li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<p>Error loading side effects: ${error.message}</p>`;
        });
}

function loadManufacturers(drugId) {
    const container = document.getElementById('manufacturers');
    
    fetch(`../php/get_drug_manufacturers.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                container.innerHTML = '<p>No manufacturer information available.</p>';
                return;
            }
            
            let html = '<ul class="manufacturers-list">';
            data.forEach(manufacturer => {
                html += `<li>${manufacturer.manufacturer_name}</li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<p>Error loading manufacturers: ${error.message}</p>`;
        });
}

function loadInteractions(drugId) {
    const container = document.getElementById('interactions');
    
    fetch(`../php/get_interactions.php?id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                container.innerHTML = '<p>No interactions information available.</p>';
                return;
            }
            
            let html = '<ul class="interactions-list">';
            data.forEach(interaction => {
                html += `
                    <li>
                        <a href="drug.html?id=${interaction.idDrug}">${interaction.drug_name}</a>
                        ${interaction.interaction_description ? ' - ' + interaction.interaction_description : ''}
                    </li>
                `;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = `<p>Error loading interactions: ${error.message}</p>`;
        });
}
