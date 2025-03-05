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
    
    // Initialize autocomplete for initial drug inputs
    initializeDrugAutocomplete('drug1');
    initializeDrugAutocomplete('drug2');
}

function initializeDrugAutocomplete(inputId) {
    const drugInput = document.getElementById(inputId);
    if (!drugInput) return;

    // Create autocomplete container
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    autocompleteContainer.style.display = 'none';
    
   // Insert autocomplete container after the input's container
    drugInput.closest('.search-input-container').appendChild(autocompleteContainer);

    // Add event listeners for changes in the input
    drugInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Request suggestions through autocomplete.php
        fetch(`php/autocomplete.php?search=${encodeURIComponent(query)}&type=drug`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.suggestions.length > 0) {
                    // Display suggestions
                    renderDrugSuggestions(data.suggestions, autocompleteContainer, drugInput);
                    autocompleteContainer.style.display = 'block';
                } else {
                    autocompleteContainer.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Autocomplete error:', error);
                autocompleteContainer.style.display = 'none';
            });
    });
    
    // Hide suggestions when clicking outside of the autocomplete container
    document.addEventListener('click', function(e) {
        if (!drugInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
    
    // Show suggestions when input is focused if there's content
    drugInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            // Trigger the input event to show suggestions
            this.dispatchEvent(new Event('input'));
        }
    });
}

function renderDrugSuggestions(suggestions, container, inputElement) {
    // Clear current text in the container
    container.innerHTML = '';
    
    // Iterate through the suggestions
    suggestions.forEach(suggestion => {
        // Create a suggestion element for each suggestion
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'autocomplete-item';
        suggestionElement.textContent = suggestion.text;
        
        // Add event listener to set the input value when clicked
        suggestionElement.addEventListener('click', function() {
            inputElement.value = suggestion.text;
            container.style.display = 'none';            
        });
        
        // Append the suggestion element to the container
        container.appendChild(suggestionElement);
    });
}

function addDrugField() {
    const additionalDrugsContainer = document.getElementById('additionalDrugs');
    const drugCount = document.querySelectorAll('.drug-selection .form-group').length + 1;
    
    const newDrugField = document.createElement('div');
    newDrugField.className = 'form-group';
    newDrugField.innerHTML = `
        <div class="drug-field-wrapper">
            <label for="drug${drugCount}">Additional Medication</label>
            <div class="search-input-container">
                <input type="text" 
                     id="drug${drugCount}" 
                     name="drug${drugCount}" 
                     class="form-control" 
                     placeholder="Enter medication name" 
                     required>
                <button type="button" class="btn-secondary btn-remove-drug" title="Remove this medication">&times;</button>
            </div>
        </div>
    `;
    
    additionalDrugsContainer.appendChild(newDrugField);
    
    // Add event listener to the remove button
    const removeButton = newDrugField.querySelector('.btn-remove-drug');
    removeButton.addEventListener('click', function() {
        additionalDrugsContainer.removeChild(newDrugField);
    });

    // Initialize autocomplete for the new drug input
    initializeDrugAutocomplete(`drug${drugCount}`);
    
    
    // Focus on the new input
    newDrugField.querySelector('input').focus();
}

function handleInteractionCheck(event) {
    event.preventDefault();
    
    // Get references to key elements ONCE
    const resultsContainer = document.getElementById('interactionResults');
    const loader = document.getElementById('interactionLoader');
    
    // Clear any previous results
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
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
        if (typeof showMessage === 'function') {
            showMessage('Please enter at least two valid medications', 'error');
        } else {
            alert('Please enter at least two valid medications');
        }
        return;
    }
    
    // Show loading indicator
    if (loader) {
        loader.style.display = 'block';
    }
    
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
    .then(response => {
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Hide loader
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Validate data structure
        if (!data) {
            throw new Error('No data received from server');
        }
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Unknown error occurred');
        }
        
        if (!Array.isArray(data.interactions)) {
            throw new Error('Invalid interactions data');
        }
        
        // Display results
        if (resultsContainer) {
            displayInteractionResults(data, validDrugs);
        }
    })
    .catch(error => {
        // Hide loader
        if (loader) {
            loader.style.display = 'none';
        }
        
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error!</h4>
                    <p>Failed to check interactions. ${error.message}</p>
                </div>
            `;
        } else {
            alert(`Failed to check interactions: ${error.message}`);
        }
    });
}

function displayInteractionResults(data, drugs) {
    const resultsContainer = document.getElementById('interactionResults');
    resultsContainer.classList.add('has-results');
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
                        ${interaction.drug1_name} + ${interaction.drug2_name}
                        
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
                    <div class="accordion-body">
                        ${interaction.description ? `
                        <div class="interaction-description">
                            <h5>Description</h5>
                            <p>${interaction.description}</p>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    resultsContainer.innerHTML = html;
}
