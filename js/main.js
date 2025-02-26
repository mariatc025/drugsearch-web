document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements based on current page
    initializePage();
    
    // Setup search functionality if search form exists
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Setup login/register forms if they exist
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Setup logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function initializePage() {
    // Check if we're on the drug information page
    const urlParams = new URLSearchParams(window.location.search);
    const drugId = urlParams.get('id');
    
    if (drugId && document.getElementById('drugInfo')) {
        loadDrugInfo(drugId);
    }
    
    // Check if we're on search results page
    const searchType = urlParams.get('type');
    const searchQuery = urlParams.get('search');
    
    if (searchQuery && document.getElementById('searchResults')) {
        displaySearchResults(searchQuery, searchType);
    }
    
    // Update nav based on login status
    updateNavigation();
}

function updateNavigation() {
    // Check if user is logged in (can be stored in localStorage or sessionStorage)
    const isLoggedIn = sessionStorage.getItem('user_id') !== null;
    const navLoginEl = document.getElementById('navLogin');
    const navLogoutEl = document.getElementById('navLogout');
    const navUsernameEl = document.getElementById('navUsername');
    
    if (navLoginEl && navLogoutEl && navUsernameEl) {
        if (isLoggedIn) {
            navLoginEl.style.display = 'none';
            navLogoutEl.style.display = 'block';
            navUsernameEl.textContent = sessionStorage.getItem('username');
            navUsernameEl.style.display = 'block';
        } else {
            navLoginEl.style.display = 'block';
            navLogoutEl.style.display = 'none';
            navUsernameEl.style.display = 'none';
        }
    }
}
