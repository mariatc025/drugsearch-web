document.addEventListener('DOMContentLoaded', function() {
    initializeInteractionPage();
});

function initializeInteractionPage() {
    // Setup form submission
    const interactionForm = document.getElementById('interactionForm');
    if (interactionForm) {
        interactionForm.addEventListener('submit', handleInteractionCheck);
    }
    
    // Setup add drug button
    const addDrugBtn = document.getElementById('addDrugBtn');
    if (addDrugBtn) {
        addDrugBtn.addEventListener('click', addDrugField);
    }
}

function addDrugField() {
    const additionalDrugsContainer = document.getElementById('additionalDrugs');
    const drugCount = document.querySelectorAll('.drug-selection .form-group').length + 1;
    
    const newDrugField = document.createElement('div');
    newDrugField.className = 'form-group';
    newDrugField.innerHTML = `
        <div class="drug-field-wrapper">
            <label for="drug${drugCount}">Additional Medication</label>
            <div class="input-with-button">
                <input type="text" 
                     id="drug${drugCount}" 
                     name="drug${drugCount}" 
                     class="form-control" 
                     placeholder="Enter medication name" 
                     required>
                <button type="button" class="btn-remove-drug" title="Remove this medication">&times;</button>
            </div>
        </div>
    `;
    
    additionalDrugsContainer.appendChild(newDrugField);
    
    // Add event listener to the remove button
    const removeButton = newDrugField.querySelector('.btn-remove-drug');
    removeButton.addEventListener('click', function() {
        additionalDrugsContainer.removeChild(newDrugField);
    });
    
    // Focus on the new input
    newDrugField.querySelector('input').focus();
}

function handleInteractionCheck(event) {
    event.preventDefault();
    
    // Get all drug inputs with name starting with "drug"
    const drugInputs = document.querySelectorAll('.drug-selection input[name^="drug"]');
    const validDrugs = [];
    
    // Validate and collect drug names
    drugInputs.forEach(input => {
        const value = input.value.trim();
        if (value === '') {
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
            validDrugs.push(value);
        }
    });
    
    // Validate minimum 2 drugs
    if (validDrugs.length < 2) {
        showMessage('Please enter at least two valid medications', 'error');
        return;
    }
    
    // Show loading indicator
    const loader = document.getElementById('interactionLoader');
    const resultsContainer = document.getElementById('interactionResults');
    loader.style.display = 'block';
    
    // Prepare form data
    const formData = new URLSearchParams();
    validDrugs.forEach((drug, index) => {
        formData.append(`drug${index + 1}`, drug);
    });

    // Send request to backend
    fetch('php/check_interactions.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        loader.style.display = 'none';
        displayInteractionResults(data, validDrugs);
    })
    .catch(error => {
        loader.style.display = 'none';
        console.error('Error:', error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error!</h4>
                <p>Failed to check interactions. Details: ${error.message}</p>
            </div>
        `;
    });
}

function displayInteractionResults(data, drugs) {
    const resultsContainer = document.getElementById('interactionResults');
    
    // Handle errors
    if (data.status === 'error') {
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error!</h4>
                <p>${data.message || 'Database query failed'}</p>
            </div>
        `;
        return;
    }

    // Handle no interactions found
    if (data.interactions.length === 0) {
        resultsContainer.innerHTML = `
            <div class="interaction-summary no-interactions">
                <h2>No Known Interactions Found</h2>
                <div class="drugs-checked">
                    <h3>Medications Checked:</h3>
                    <ul>
                        ${drugs.map(drug => `<li>${drug}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        return;
    }

    // Build results HTML
    let html = `
        <div class="interaction-summary">
            <h2>${data.interactions.length} Potential Interaction${data.interactions.length > 1 ? 's' : ''} Found</h2>
            <div class="drugs-checked">
                <h3>Medications Checked:</h3>
                <ul>
                    ${drugs.map(drug => `<li>${drug}</li>`).join('')}
                </ul>
            </div>
        </div>
        <div class="interaction-list">
            <div class="accordion" id="interactionAccordion">
    `;

    // Add interaction details
    data.interactions.forEach((interaction, index) => {
        html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" 
                          type="button" 
                          data-bs-toggle="collapse" 
                          data-bs-target="#collapse${index}">
                        ${interaction.drug1_id ? `Drug ID ${interaction.drug1_id}` : interaction.drug1} 
                        + 
                        ${interaction.drug2_id ? `Drug ID ${interaction.drug2_id}` : interaction.drug2}
                        ${interaction.severity ? `
                        <span class="severity-badge">
                            ${interaction.severity}
                        </span>` : ''}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
                    <div class="accordion-body">
                        ${interaction.description ? `
                        <div class="interaction-description">
                            <h5>Description</h5>
                            <p>${interaction.description}</p>
                        </div>` : ''}
                        ${interaction.management ? `
                        <div class="interaction-management">
                            <h5>Management</h5>
                            <p>${interaction.management}</p>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    resultsContainer.innerHTML = html;
}
