// Execute when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only proceed with admin-specific code if on admin pages
    if (window.location.pathname.includes('admin_panel.html')) {
        // Load initial tab content (requests tab)
        loadAdminRequests();
        
        // Setup tab change listeners
        const userTab = document.getElementById('users-tab');
        if (userTab) {
            userTab.addEventListener('click', loadUsers);
        }
        
        // Set up modal events
        const saveRoleButton = document.getElementById('saveRoleButton');
        if (saveRoleButton) {
            saveRoleButton.addEventListener('click', updateUserRole);
        }
    }
    
    // Add admin request form listener - this can be on profile page
    const adminRequestForm = document.getElementById('adminRequestForm');
    if (adminRequestForm) {
        adminRequestForm.addEventListener('submit', handleAdminRequest);
    }
});

// Function to load admin requests
function loadAdminRequests() {
    const requestsList = document.getElementById('requestsList');
    const requestsLoader = document.getElementById('requestsLoader');
    
    // Show loader
    if (requestsLoader) requestsLoader.style.display = 'block';
    
    // Fetch admin requests
    fetch('php/admin.php?action=getRequests')
        .then(response => response.json())
        .then(data => {
            // Hide loader
            if (requestsLoader) requestsLoader.style.display = 'none';
            
            if (data.status === 'success' && requestsList) {
                if (data.requests && data.requests.length > 0) {
                    let html = '<div class="table-responsive">';
                    html += '<table class="table table-striped">';
                    html += '<thead><tr><th>Request ID</th><th>Email</th><th>Request Date</th><th>Reason</th><th>Actions</th></tr></thead>';
                    html += '<tbody>';
                    
                    data.requests.forEach(request => {
                        const requestDate = new Date(request.request_date).toLocaleDateString();
                        const statusBadge = getStatusBadge(request.status);
                        html += `<tr>
                            <td>${request.idRequest || 'N/A'}</td>
                            <td>${request.idEmail}</td>
                            <td>${requestDate}</td>
                            <td>${request.reason}</td>
                            <td>${statusBadge} 
                                <button class="btn btn-sm btn-success me-2" onclick="approveRequest('${request.idEmail}')" ${request.status !== 'pending' ? 'disabled' : ''}>Approve</button>
                                <button class="btn btn-sm btn-danger" onclick="denyRequest('${request.idEmail}')" ${request.status !== 'pending' ? 'disabled' : ''}>Deny</button>
                            </td>
                        </tr>`;
                    });
                    
                    html += '</tbody></table></div>';
                    requestsList.innerHTML = html;
                } else {
                    requestsList.innerHTML = '<div class="alert alert-info">No admin requests found.</div>';
                }
            } else {
                requestsList.innerHTML = '<div class="alert alert-danger">Error loading requests: ' + (data.message || 'Unknown error') + '</div>';
            }
        })
        .catch(error => {
            if (requestsLoader) requestsLoader.style.display = 'none';
            if (requestsList) {
                requestsList.innerHTML = '<div class="alert alert-danger">Error loading requests: ' + error.message + '</div>';
            }
        });
}

// Function to get status badge
function getStatusBadge(status) {
    switch(status) {
        case 'approved':
            return '<span class="badge bg-success">Approved</span>';
        case 'denied':
            return '<span class="badge bg-danger">Denied</span>';
        case 'pending':
        default:
            return '<span class="badge bg-warning text-dark">Pending</span>';
    }
}

// Function to load all users
function loadUsers() {
    const usersList = document.getElementById('usersList');
    const usersLoader = document.getElementById('usersLoader');
    
    // Show loader
    if (usersLoader) usersLoader.style.display = 'block';
    
    // Fetch users
    fetch('php/admin.php?action=getUsers')
        .then(response => response.json())
        .then(data => {
            // Hide loader
            if (usersLoader) usersLoader.style.display = 'none';
            
            if (data.status === 'success' && usersList) {
                if (data.users && data.users.length > 0) {
                    let html = '<div class="table-responsive">';
                    html += '<table class="table table-striped">';
                    html += '<thead><tr><th>Email</th><th>Username</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>';
                    html += '<tbody>';
                    
                    data.users.forEach(user => {
                        const createdDate = new Date(user.created_at).toLocaleDateString();
                        html += `<tr>
                            <td>${user.idEmail}</td>
                            <td>${user.username}</td>
                            <td>${user.role_name}</td>
                            <td>${createdDate}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editUserRole('${user.idEmail}', '${user.username}', ${user.idRole})">Edit Role</button>
                            </td>
                        </tr>`;
                    });
                    
                    html += '</tbody></table></div>';
                    usersList.innerHTML = html;
                } else {
                    usersList.innerHTML = '<div class="alert alert-info">No users found.</div>';
                }
            } else {
                usersList.innerHTML = '<div class="alert alert-danger">Error loading users: ' + (data.message || 'Unknown error') + '</div>';
            }
        })
        .catch(error => {
            if (usersLoader) usersLoader.style.display = 'none';
            if (usersList) {
                usersList.innerHTML = '<div class="alert alert-danger">Error loading users: ' + error.message + '</div>';
            }
        });
}

// Function to approve admin request
function approveRequest(idEmail) {
    // Load user data and open edit role modal
    fetch('php/admin.php?action=getUsers')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.users) {
                const user = data.users.find(u => u.idEmail === idEmail);
                if (user) {
                    editUserRole(idEmail, user.username, user.idRole);
                } else {
                    showMessage('User not found', 'error');
                }
            } else {
                showMessage('Error finding user information', 'error');
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message, 'error');
        });
}

// Function to deny admin request
function denyRequest(userEmail) {
    if (confirm('Are you sure you want to deny this admin request?')) {
        // Create form data
        const formData = new FormData();
        formData.append('action', 'denyRequest');
        formData.append('idEmail', userEmail);
        
        // Send the request to admin.php
        fetch('php/admin.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showMessage('Request denied successfully', 'success');
                loadAdminRequests();
            } else {
                showMessage('Failed to deny request: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message, 'error');
        });
    }
}

// Function to edit user role
function editUserRole(userEmail, username, currentRoleId = null) {
    // Set user information in the modal
    document.getElementById('editUserEmail').value = userEmail;
    document.getElementById('editUsername').textContent = username || userEmail;
    document.getElementById('displayUserEmail').textContent = userEmail;
    
    // Fetch available roles
    fetch('php/admin.php?action=getRoles')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const roleSelect = document.getElementById('editUserRole');
                roleSelect.innerHTML = '';
                
                // Add options for each role
                data.roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.idRole;
                    option.textContent = role.role_name + ' - ' + role.role_description;
                    
                    // Select current role if specified
                    if (currentRoleId && parseInt(role.idRole) === parseInt(currentRoleId)) {
                        option.selected = true;
                    }
                    
                    roleSelect.appendChild(option);
                });
                
                // Show the modal
                const editRoleModal = new bootstrap.Modal(document.getElementById('editRoleModal'));
                editRoleModal.show();
            } else {
                showMessage('Failed to load roles: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message, 'error');
        });
}

// Function to update user role
function updateUserRole() {
    const userEmail = document.getElementById('editUserEmail').value;
    const roleId = document.getElementById('editUserRole').value;
    
    // Create form data
    const formData = new FormData();
    formData.append('action', 'updateRole');
    formData.append('idEmail', userEmail);
    formData.append('role_id', roleId);
    
    // Send the update request to admin.php
    fetch('php/admin.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage('User role updated successfully', 'success');
            
            // Hide modal
            const editRoleModal = bootstrap.Modal.getInstance(document.getElementById('editRoleModal'));
            editRoleModal.hide();
            
            // Reload current tab
            const activeTab = document.querySelector('.nav-link.active');
            if (activeTab.id === 'requests-tab') {
                loadAdminRequests();
            } else if (activeTab.id === 'users-tab') {
                loadUsers();
            }
        } else {
            showMessage('Failed to update role: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message, 'error');
    });
}

// Function to handle admin request
function handleAdminRequest(event) {
    event.preventDefault();
    
    const reason = document.getElementById('adminRequestReason').value;
    
    if (!reason) {
        showMessage('Please provide a reason for your request', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'adminRequest');
    formData.append('user_id', sessionStorage.getItem('user_id'));
    formData.append('username', sessionStorage.getItem('username'));
    formData.append('reason', reason);
    
    fetch('php/admin.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage('Admin request submitted successfully', 'success');
            document.getElementById('adminRequestReason').value = '';
        } else {
            showMessage('Failed to submit request: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message, 'error');
    });
}