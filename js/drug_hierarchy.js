document.addEventListener('DOMContentLoaded', function() {
    // Load drug hierarchy
    loadDrugHierarchy();
    
    // Initialize search functionality
    const searchInput = document.getElementById('searchTree');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTree(this.value.toLowerCase());
        });
    }
    
    // Update navigation based on login status
    updateNavigation();
});

function loadDrugHierarchy() {
    const treeContainer = document.getElementById('treeContainer');
    
    fetch('php/get_drug_hierarchy.php')
        .then(response => response.json())
        .then(data => {
            if (!data || data.status === 'error') {
                treeContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h4 class="alert-heading">Error!</h4>
                        <p>Could not load drug hierarchy. ${data.message || 'Unknown error'}</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            // Render kingdoms
            data.forEach(kingdom => {
                html += `
                    <div class="tree-node tree-node-kingdom" data-id="${kingdom.idDrug_kingdom}">
                        <span class="toggle-icon">▶</span>
                        ${kingdom.drug_kingdom_name}
                        <span class="drug-count">(${countDrugsInKingdom(kingdom)})</span>
                    </div>
                    <div class="kingdom-content hidden" id="kingdom-${kingdom.idDrug_kingdom}">
                `;
                
                // Render superclasses
                kingdom.superclasses.forEach(superclass => {
                    html += `
                        <div class="tree-node tree-node-superclass" data-id="${superclass.idDrug_superclass}">
                            <span class="toggle-icon">▶</span>
                            ${superclass.drug_superclass_name}
                            <span class="drug-count">(${countDrugsInSuperclass(superclass)})</span>
                        </div>
                        <div class="superclass-content hidden" id="superclass-${superclass.idDrug_superclass}">
                    `;
                    
                    // Render classes
                    superclass.classes.forEach(drugClass => {
                        html += `
                            <div class="tree-node tree-node-class" data-id="${drugClass.idDrug_class}">
                                <span class="toggle-icon">▶</span>
                                ${drugClass.drug_class_name}
                                <span class="drug-count">(${drugClass.drugs.length})</span>
                            </div>
                            <div class="class-content hidden" id="class-${drugClass.idDrug_class}">
                        `;
                        
                        // Render drugs
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

function countDrugsInKingdom(kingdom) {
    let count = 0;
    kingdom.superclasses.forEach(superclass => {
        count += countDrugsInSuperclass(superclass);
    });
    return count;
}

function countDrugsInSuperclass(superclass) {
    let count = 0;
    superclass.classes.forEach(drugClass => {
        count += drugClass.drugs.length;
    });
    return count;
}

function addTreeNodeListeners() {
    // Kingdom node listeners
    document.querySelectorAll('.tree-node-kingdom').forEach(node => {
        node.addEventListener('click', function() {
            const kingdomId = this.getAttribute('data-id');
            const contentElement = document.getElementById(`kingdom-${kingdomId}`);
            
            toggleNode(this, contentElement);
        });
    });
    
    // Superclass node listeners
    document.querySelectorAll('.tree-node-superclass').forEach(node => {
        node.addEventListener('click', function(e) {
            e.stopPropagation();
            const superclassId = this.getAttribute('data-id');
            const contentElement = document.getElementById(`superclass-${superclassId}`);
            
            toggleNode(this, contentElement);
        });
    });
    
    // Class node listeners
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
    // Toggle visibility
    contentElement.classList.toggle('hidden');
    
    // Update toggle icon
    const toggleIcon = nodeElement.querySelector('.toggle-icon');
    if (contentElement.classList.contains('hidden')) {
        toggleIcon.textContent = '▶';
    } else {
        toggleIcon.textContent = '▼';
    }
}

function filterTree(searchTerm) {
    if (!searchTerm) {
        // Reset tree if search is empty
        document.querySelectorAll('.tree-node, .kingdom-content, .superclass-content, .class-content').forEach(elem => {
            if (elem.classList.contains('tree-node')) {
                elem.style.display = 'block';
                // Reset toggle icons
                const toggleIcon = elem.querySelector('.toggle-icon');
                if (toggleIcon) {
                    toggleIcon.textContent = '▶';
                }
            } else {
                elem.classList.add('hidden');
            }
        });
        return;
    }
    
    // Hide all nodes initially
    document.querySelectorAll('.tree-node').forEach(node => {
        node.style.display = 'none';
    });
    
    // Show drugs that match the search term
    let matchedDrugs = document.querySelectorAll('.tree-node-drug');
    let matchedNodes = new Set();
    
    matchedDrugs.forEach(drugNode => {
        const drugName = drugNode.textContent.toLowerCase();
        if (drugName.includes(searchTerm)) {
            drugNode.style.display = 'block';
            
            // Find parent class node
            const classContent = drugNode.parentElement;
            const classNode = classContent.previousElementSibling;
            matchedNodes.add(classNode);
            
            // Find parent superclass node
            const superclassContent = classContent.parentElement;
            const superclassNode = superclassContent.previousElementSibling;
            matchedNodes.add(superclassNode);
            
            // Find parent kingdom node
            const kingdomContent = superclassContent.parentElement;
            const kingdomNode = kingdomContent.previousElementSibling;
            matchedNodes.add(kingdomNode);
        }
    });
    
    // Also match class, superclass and kingdom names
    document.querySelectorAll('.tree-node-class, .tree-node-superclass, .tree-node-kingdom').forEach(node => {
        if (node.textContent.toLowerCase().includes(searchTerm)) {
            matchedNodes.add(node);
            
            // If it's a class, also show its drugs
            if (node.classList.contains('tree-node-class')) {
                const classId = node.getAttribute('data-id');
                const classContent = document.getElementById(`class-${classId}`);
                classContent.querySelectorAll('.tree-node-drug').forEach(drugNode => {
                    drugNode.style.display = 'block';
                });
                
                // Find parent nodes
                const superclassContent = node.parentElement;
                const superclassNode = superclassContent.previousElementSibling;
                matchedNodes.add(superclassNode);
                
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
                
                // Find parent kingdom
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