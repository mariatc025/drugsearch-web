document.addEventListener('DOMContentLoaded', function() {
    // Load drug hierarchy
    loadDrugHierarchy();
    
    // Obtain searchTree input field and add event listener for input
    // turning to lowercase the input value and filtering the tree by that value
    const searchInput = document.getElementById('searchTree');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTree(this.value.toLowerCase());
        });
    }
    
});

function loadDrugHierarchy() {
    // Obtain treeContainer
    const treeContainer = document.getElementById('treeContainer');
    
    // Fetch data from get_drug_hierarchy.php
    fetch('php/get_drug_hierarchy.php')
        .then(response => response.json())
        .then(data => {
            // If there's no data or an error happens show error screen
            if (!data || data.status === 'error') {
                treeContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h4 class="alert-heading">Error!</h4>
                        <p>Could not load drug hierarchy. ${data.message || 'Unknown error'}</p>
                    </div>
                `;
                return;
            }
            // string where we will build the hiererchical tree
            let html = '';
            
            // Iterate through the kingdoms creating clickable nodes for each and adding the total count
            data.forEach(kingdom => {
                html += `
                    <div class="tree-node tree-node-kingdom" data-id="${kingdom.idDrug_kingdom}">
                        <span class="toggle-icon">▶</span>
                        ${kingdom.drug_kingdom_name}
                        <span class="drug-count">(${countDrugsInKingdom(kingdom)})</span>
                    </div>
                    <div class="kingdom-content hidden" id="kingdom-${kingdom.idDrug_kingdom}">
                `;
                
                // Iterates through the superclasses inside kingdom creating clickable nodes for each and adding the total count
                kingdom.superclasses.forEach(superclass => {
                    html += `
                        <div class="tree-node tree-node-superclass" data-id="${superclass.idDrug_superclass}">
                            <span class="toggle-icon">▶</span>
                            ${superclass.drug_superclass_name}
                            <span class="drug-count">(${countDrugsInSuperclass(superclass)})</span>
                        </div>
                        <div class="superclass-content hidden" id="superclass-${superclass.idDrug_superclass}">
                    `;
                    
                    // Iterates through the classes inside superclass creating clickable nodes for each and adding the total count
                    superclass.classes.forEach(drugClass => {
                        html += `
                            <div class="tree-node tree-node-class" data-id="${drugClass.idDrug_class}">
                                <span class="toggle-icon">▶</span>
                                ${drugClass.drug_class_name}
                                <span class="drug-count">(${drugClass.drugs.length})</span>
                            </div>
                            <div class="class-content hidden" id="class-${drugClass.idDrug_class}">
                        `;
                        
                        // Iterates through the drugs for each class creating clickable nodes for each
                        drugClass.drugs.forEach(drug => {
                            html += `
                                <div class="tree-node tree-node-drug" data-drug-id="${drug.idDrug}">
                                    <a href="drug.html?id=${drug.idDrug}">${drug.drug_name}</a>
                                </div>
                            `;
                        });
                        
                        html += `</div>`;
                    });
                    
                    html += `</div>`;
                });
                
                html += `</div>`;
            });
            
            // Add the created HTML to the tree container
            treeContainer.innerHTML = html;
            
            // Add event listeners for expanding/collapsing nodes
            addTreeNodeListeners();
        })
        .catch(error => {
            treeContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error!</h4>
                    <p>Error loading drug hierarchy: ${error.message}</p>
                </div>
            `;
        });
}

// Function to count the number of drugs for each kingdom
function countDrugsInKingdom(kingdom) {
    let count = 0;
    kingdom.superclasses.forEach(superclass => {
        count += countDrugsInSuperclass(superclass);
    });
    return count;
}

// Function to count the number of drugs for each superclass
function countDrugsInSuperclass(superclass) {
    let count = 0;
    superclass.classes.forEach(drugClass => {
        count += drugClass.drugs.length;
    });
    return count;
}

function addTreeNodeListeners() {
    // Add event listener for each kingdom node, when it is clicked it displays the content inside that kingdom and the arrow points down
    document.querySelectorAll('.tree-node-kingdom').forEach(node => {
        node.addEventListener('click', function() {
            const kingdomId = this.getAttribute('data-id');
            const contentElement = document.getElementById(`kingdom-${kingdomId}`);
            
            toggleNode(this, contentElement);
        });
    });
    
    // Add event listener for each superclass node, when it is clicked it displays the content inside that superclass and the arrow points down
    document.querySelectorAll('.tree-node-superclass').forEach(node => {
        node.addEventListener('click', function(e) {
            e.stopPropagation();
            const superclassId = this.getAttribute('data-id');
            const contentElement = document.getElementById(`superclass-${superclassId}`);
            
            toggleNode(this, contentElement);
        });
    });
    
    // Add event listener for each class node, when it is clicked it displays the content inside that class and the arrow points down
    document.querySelectorAll('.tree-node-class').forEach(node => {
        node.addEventListener('click', function(e) {
            e.stopPropagation();
            const classId = this.getAttribute('data-id');
            const contentElement = document.getElementById(`class-${classId}`);
            
            toggleNode(this, contentElement);
        });
    });
}

function toggleNode(nodeElement, contentElement) {
    // Makes content element hidden, if it was already hidden when executing this the opposite would happen and it becomes visible
    contentElement.classList.toggle('hidden');
    
    // Update toggle icon depending if the content element is currently hidden or not 
    const toggleIcon = nodeElement.querySelector('.toggle-icon');
    if (contentElement.classList.contains('hidden')) {
        toggleIcon.textContent = '▶';
    } else {
        toggleIcon.textContent = '▼';
    }
}

function filterTree(searchTerm) {
    // if the searchTerm is empty
    if (!searchTerm) {
        // Reset the tree
        document.querySelectorAll('.tree-node, .kingdom-content, .superclass-content, .class-content').forEach(elem => {
            if (elem.classList.contains('tree-node')) {
                // Make tree-node elements visible again
                elem.style.display = 'block';
                // Reset toggle icons
                const toggleIcon = elem.querySelector('.toggle-icon');
                if (toggleIcon) {
                    toggleIcon.textContent = '▶';
                }
            } else {
                // Make the other elements hidden
                elem.classList.add('hidden');
            }
        });
        return;
    }
    
    // Hide all nodes initially
    document.querySelectorAll('.tree-node').forEach(node => {
        node.style.display = 'none';
    });
    
    
    // Get all drug nodes
    let matchedDrugs = document.querySelectorAll('.tree-node-drug');
    // Create a set to keep track of the parent nodes
    let matchedNodes = new Set();

    // Match drug names

    // Iterate through all matchedDrugs
    matchedDrugs.forEach(drugNode => {
        // Convert it to lowercase
        const drugName = drugNode.textContent.toLowerCase();
        // If the drugName includes the searchterm
        if (drugName.includes(searchTerm)) {
            // display the drug node
            drugNode.style.display = 'block';
            
            // Find parent class of the drug node
            // Get conteiner for the class
            const classContent = drugNode.parentElement;
            // Get the classNode
            const classNode = classContent.previousElementSibling;
            matchedNodes.add(classNode);
            
            // Find parent superclass of the class
            const superclassContent = classContent.parentElement;
            const superclassNode = superclassContent.previousElementSibling;
            matchedNodes.add(superclassNode);
            
            // Find parent kingdom of the superclass
            const kingdomContent = superclassContent.parentElement;
            const kingdomNode = kingdomContent.previousElementSibling;
            matchedNodes.add(kingdomNode);
        }
    });
    
    // Also match class, superclass and kingdom names
    // Select all the nodes and iterate trough them
    document.querySelectorAll('.tree-node-class, .tree-node-superclass, .tree-node-kingdom').forEach(node => {
        // if the node include the searchTerm add them to matcheNodes
        if (node.textContent.toLowerCase().includes(searchTerm)) {
            matchedNodes.add(node);
            
            // If it's a class, also show its drugs
            if (node.classList.contains('tree-node-class')) {
                const classId = node.getAttribute('data-id');
                const classContent = document.getElementById(`class-${classId}`);
                classContent.querySelectorAll('.tree-node-drug').forEach(drugNode => {
                    drugNode.style.display = 'block';
                });
                
                // Show superclass of the class
                const superclassContent = node.parentElement;
                const superclassNode = superclassContent.previousElementSibling;
                matchedNodes.add(superclassNode);
                
                // Show kingdom of the superclass
                const kingdomContent = superclassContent.parentElement;
                const kingdomNode = kingdomContent.previousElementSibling;
                matchedNodes.add(kingdomNode);
            }
            
            // If it's a superclass, show its classes
            if (node.classList.contains('tree-node-superclass')) {
                const superclassId = node.getAttribute('data-id');
                document.querySelectorAll(`.tree-node-class`).forEach(classNode => {
                    if (classNode.parentElement.id === `superclass-${superclassId}`) {
                        matchedNodes.add(classNode);
                    }
                });
                
                // Show kingdom of the superclass
                const kingdomContent = node.parentElement;
                const kingdomNode = kingdomContent.previousElementSibling;
                matchedNodes.add(kingdomNode);
            }
        }
    });
    
    // Display matched nodes and expand their containers
    matchedNodes.forEach(node => {
        node.style.display = 'block';
        
        // Expand content
        if (node.classList.contains('tree-node-kingdom')) {
            const kingdomId = node.getAttribute('data-id');
            const content = document.getElementById(`kingdom-${kingdomId}`);
            content.classList.remove('hidden');
            node.querySelector('.toggle-icon').textContent = '▼';
        }
        else if (node.classList.contains('tree-node-superclass')) {
            const superclassId = node.getAttribute('data-id');
            const content = document.getElementById(`superclass-${superclassId}`);
            content.classList.remove('hidden');
            node.querySelector('.toggle-icon').textContent = '▼';
        }
        else if (node.classList.contains('tree-node-class')) {
            const classId = node.getAttribute('data-id');
            const content = document.getElementById(`class-${classId}`);
            content.classList.remove('hidden');
            node.querySelector('.toggle-icon').textContent = '▼';
        }
    });
}