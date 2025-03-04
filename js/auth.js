function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', email);
    formData.append('password', password);
    
    fetch('php/login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Store user information in session storage
            sessionStorage.setItem('user_id', data.user_id || email);
            sessionStorage.setItem('username', data.username || email.split('@')[0]);
            sessionStorage.setItem('role', data.role || 'user'); // Store role
            
            showMessage('Login successful', 'success');
            
            // Redirect to home page after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage('Login failed: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message, 'error');
    });
}

function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !username || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    
    // Adjust the path to match your directory structure
    const phpPath = 'php/login.php';
    
    fetch(phpPath, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage('Registration successful. You can now log in.', 'success');
            
            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage('Registration failed: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message, 'error');
    });
}

function handleLogout(event) {
    event.preventDefault();
    
    fetch('php/logout.php')
        .then(response => response.json())
        .then(data => {
            // Clear session storage
            sessionStorage.removeItem('user_id');
            sessionStorage.removeItem('username');
            
            showMessage('Logout successful', 'success');
            
            // Update navigation
            updateNavigation();
            
            // Redirect to home page after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        })
        .catch(error => {
            showMessage('Error: ' + error.message, 'error');
        });
}


document.addEventListener('DOMContentLoaded', function () {
    updateNavigation();

    if (window.location.pathname.includes('profile.html')) {
        const username = sessionStorage.getItem('username');
        const email = sessionStorage.getItem('user_id');

        if (username && email) {
            document.getElementById('profileUsername').textContent = username;
            document.getElementById('profileEmail').textContent = email;
        } else {
            window.location.href = 'login.html'; 
        }

        document.getElementById('logoutButton').addEventListener('click', handleLogout);
    }
});

function handleUpdateProfile(event) {
    event.preventDefault();
    
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const newPassword = document.getElementById('editPassword').value;
    const confirmPassword = document.getElementById('confirmEditPassword').value;
    const currentPassword = document.getElementById('currentPassword').value;
    
    // Verify password if changing
    if (newPassword && newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    if (!currentPassword) {
        showMessage('Current password is required to update profile', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'updateProfile');
    formData.append('user_id', sessionStorage.getItem('user_id'));
    formData.append('username', username);
    formData.append('email', email);
    formData.append('currentPassword', currentPassword);
    
    if (newPassword) {
        formData.append('newPassword', newPassword);
    }
    
    fetch('php/profile.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update session storage with new info
            sessionStorage.setItem('user_id', email);
            sessionStorage.setItem('username', username);
            
            showMessage('Profile updated successfully', 'success');
            
            // Switch back to view mode and refresh displayed info
            switchToViewMode();
            loadProfileInfo();
            
            // Update navigation to reflect changes
            updateNavigation();
        } else {
            showMessage('Update failed: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message, 'error');
    });
}

function loadProfileInfo() {
    const username = sessionStorage.getItem('username');
    const email = sessionStorage.getItem('user_id');
    
    if (username && email) {
        // Update view mode displays
        const profileUsernameElements = document.querySelectorAll('#profileUsername, #viewUsername');
        const profileEmailElements = document.querySelectorAll('#profileEmail, #viewEmail');
        
        profileUsernameElements.forEach(element => {
            if (element) element.textContent = username;
        });
        
        profileEmailElements.forEach(element => {
            if (element) element.textContent = email;
        });
        
        // Populate edit form fields
        const editUsernameField = document.getElementById('editUsername');
        const editEmailField = document.getElementById('editEmail');
        
        if (editUsernameField) editUsernameField.value = username;
        if (editEmailField) editEmailField.value = email;
    } else {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
    }
}

function switchToEditMode() {
    const viewSection = document.getElementById('profileView');
    const editSection = document.getElementById('profileEdit');
    
    if (viewSection && editSection) {
        viewSection.style.display = 'none';
        editSection.style.display = 'block';
    }
}

function switchToViewMode() {
    const viewSection = document.getElementById('profileView');
    const editSection = document.getElementById('profileEdit');
    
    if (viewSection && editSection) {
        viewSection.style.display = 'block';
        editSection.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateNavigation();

    // Profile page specific functionality
    if (window.location.pathname.includes('profile.html')) {
        loadProfileInfo();
        
        // Setup event listeners for profile editing
        const editProfileBtn = document.getElementById('editProfileBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const updateProfileForm = document.getElementById('updateProfileForm');
        const logoutButton = document.getElementById('logoutButton');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', switchToEditMode);
        }
        
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', switchToViewMode);
        }
        
        if (updateProfileForm) {
            updateProfileForm.addEventListener('submit', handleUpdateProfile);
        }
        
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }
});
