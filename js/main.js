// Execute js when the HTML has been loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements based on current page (URL parameters)
    initializePage();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        initializeAutocomplete();
    }

    
    // Add event listener for searchForm and if it is submitted execute handleSearch
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Add event listener for loginForm and if it is submitted execute handleLogin
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add event listener for registerForm and if it is submitted execute handleRegister
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Add event listener for navLogout and if it is clicked execute handleLogout
    const navLogout = document.getElementById('navLogout');
    if (navLogout) {
        navLogout.addEventListener('click', handleLogout);
    }
});

// Function for page initialization
function initializePage() {

    // Check if we're on the drug information page

    // Get URL parameters and put them into an object
    const urlParams = new URLSearchParams(window.location.search);
    // Get parameter id from urlParams
    const drugId = urlParams.get('id'); // id passed from search results html in search.js

    // If element drugId exists and the html contains element with id drugInfo call function loadDrugInfo
    // Meaning that we are in href drug.html?id=${drug.idDrug}
    if (drugId && document.getElementById('drugInfo')) {
        loadDrugInfo(drugId);
    }
    
    // Check if we're on search results page
    
    // Get parameter type from urlParams
    const searchType = urlParams.get('type');
    // Get parameter search from urlParams
    const searchQuery = urlParams.get('search');
    // If element searchQuery exists and the html contains element with id searchResults call function displaySearchResults
    // Meaning that we are in search-results.html?search=${encodeURIComponent(searchInput)}&type=${searchType} (search.js)
    if (searchQuery && document.getElementById('searchResults')) {
        displaySearchResults(searchQuery, searchType);
    }
    
    // Update nav based on login status
    updateNavigation();
}


function updateNavigation() {
    // Check if user is logged in
    // If user_id is not null isLoggedIn will be true
    const isLoggedIn = sessionStorage.getItem('user_id') !== null;
    // Obtain the  login, logout and username items of the html
    const navLogin = document.getElementById('navLogin');
    const navLogout = document.getElementById('navLogout');
    const navUsername = document.getElementById('navUsername');

    // If they all exist
    if (navLogin && navLogout && navUsername) {
        if (isLoggedIn) {
            // if isLoggedIn is true show the logout item and the username iterm
            navLogin.style.display = 'none';
            navLogout.style.display = 'inline-block';
            navUsername.style.display = 'inline-block';
            navUsername.textContent = sessionStorage.getItem('username');
        } else {
            // else show the login button and hide the others
            navLogin.style.display = 'inline-block';
            navLogout.style.display = 'none';
            navUsername.style.display = 'none';
        }
    }
}
