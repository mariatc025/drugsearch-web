// Function to handleLogin
function handleLogin(event) {
    // prevent the default form submission
    event.preventDefault();
    // Obtain email and password submitted by the user
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    // if any of them is missing show this message
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', email);
    formData.append('password', password);
    
    // Send the login data to login.php
    fetch('php/login.php', {
        method: 'POST',
        body: formData
    })

    .then(response => response.json())
    .then(data => {
        // if the response login is a succes store the data in session storage 
        if (data.status === 'success') {
            // Store user information in session storage
            sessionStorage.setItem('user_id', data.user_id || email);
            sessionStorage.setItem('username', data.username || email.split('@')[0]);
            sessionStorage.setItem('role', data.role || 'user'); // Store role
            
            //showMessage('Login successful', 'success');
            
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

// Function to register
function handleRegister(event) {
    // prevent the default form submission
    event.preventDefault();

    // Obtain all the data submitted by the user
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // If any of them are empty show a error message
    if (!email || !username || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    // If the password is not equal to the confirm password also show an error message
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
    
    // Send the register data to login.php
    fetch('php/login.php', {
        method: 'POST',
        body: formData
    })

    .then(response => response.json())
    .then(data => {
    // if the response login is a succes show a message and redirect to login page
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

// Function to logout
function handleLogout(event) {
    // prevent the default form submission
    event.preventDefault();
    // send a fetch request to logout.php 
    fetch('php/logout.php')
        .then(response => response.json())
        .then(data => {
            // Clear user_id and username from session storage
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

// Function to update profile
function handleUpdateProfile(event) {
    // prevent the default form submission
    event.preventDefault();
    
    // Obtain all the elements from the edit section
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const newPassword = document.getElementById('editPassword').value;
    const confirmPassword = document.getElementById('confirmEditPassword').value;
    const currentPassword = document.getElementById('currentPassword').value;
    
    // Check that confirm password is the same as newPassword
    if (newPassword && newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    // If currentPassword doesn't exist show a message
    if (!currentPassword) {
        showMessage('Current password is required to update profile', 'error');
        return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('action', 'updateProfile');
    formData.append('user_id', sessionStorage.getItem('user_id'));
    formData.append('username', username);
    formData.append('email', email);
    formData.append('currentPassword', currentPassword);
    // if there's a new password also add it to the form data
    if (newPassword) {
        formData.append('newPassword', newPassword);
    }

    // Send the data to profile.php
    fetch('php/profile.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // if the response is a success upate the session with the new data
        if (data.status === 'success') {
            // Update session storage with new info
            sessionStorage.setItem('user_id', email);
            sessionStorage.setItem('username', username);
            
            showMessage('Profile updated successfully', 'success');
            
            // Switch back to view mode and refresh displayed info
            switchToViewMode();
            loadProfileInfo();
            

        } else {
            showMessage('Update failed: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message, 'error');
    });
}

// Function to load the profile information
function loadProfileInfo() {
    // OBtain username and email from sessionStorage
    const username = sessionStorage.getItem('username');
    const email = sessionStorage.getItem('user_id');
    
    // if they exist
    if (username && email) {
        // Update the elements that should contain the username and email
        const profileUsernameElements = document.querySelectorAll('#profileUsername, #viewUsername');
        const profileEmailElements = document.querySelectorAll('#profileEmail, #viewEmail');
        
        profileUsernameElements.forEach(element => {
            if (element) element.textContent = username;
        });
        
        profileEmailElements.forEach(element => {
            if (element) element.textContent = email;
        });
        
        // Fill edit mode fields
        const editUsernameField = document.getElementById('editUsername');
        const editEmailField = document.getElementById('editEmail');
        
        if (editUsernameField) editUsernameField.value = username;
        if (editEmailField) editEmailField.value = email;
    } else {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
    }
}
// Function to switch to edit mode when called (stops displaying the viewSection and displays the editSection)
function switchToEditMode() {
    const viewSection = document.getElementById('profileView');
    const editSection = document.getElementById('profileEdit');
    
    if (viewSection && editSection) {
        viewSection.style.display = 'none';
        editSection.style.display = 'block';
    }
}

// Function to switch to view mode when called (stops displaying the editSection and displays the viewSection)
function switchToViewMode() {
    const viewSection = document.getElementById('profileView');
    const editSection = document.getElementById('profileEdit');
    
    if (viewSection && editSection) {
        viewSection.style.display = 'block';
        editSection.style.display = 'none';
    }
}
