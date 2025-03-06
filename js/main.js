// Execute js when the HTML has been loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize elements based on current page (URL parameters)
    initializePage();
    
    // For element searchInput call initializeAutocomplete (to give suggestions of possible search terms)
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

    // Add event listener for userAvatar and when it is clicked show the dropdown menu (do stopPropagations to avoid the event from propagating to the document click listener)
    const userAvatar = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (userAvatar && profileDropdown) {
        userAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
    }
    
    // Add event listener for the document to close the dropdown when clicking outside of it
    document.addEventListener('click', function(e) {
        // if the dropdown is shown and if the clicked in the document is outside of the dropdown, make dropdown invisible
        if (profileDropdown && profileDropdown.classList.contains('show')) {
            if (!profileDropdown.contains(e.target) && e.target !== userAvatar) {
                profileDropdown.classList.remove('show');
            }
        }
    });

    // Add event listener to filterTitle and if it is clicked and the height of the options 
    // is 0px (it is hidden), change the height so all the options become visible
    const filterTitle = document.querySelector('.filter-title');
    const filterOptions = document.getElementById('filterOptions');
    
    if (filterTitle && filterOptions) {
        // Initially hide the filter options
        filterOptions.style.maxHeight = '0';
        filterOptions.style.overflow = 'hidden';
        
        filterTitle.addEventListener('click', function() {
            if (filterOptions.style.maxHeight === '0px') {
                filterOptions.style.maxHeight = filterOptions.scrollHeight + 'px';
            } else {
                filterOptions.style.maxHeight = '0';
            }
        })
    }

    // Profile page specific functionality
    if (window.location.pathname.includes('profile.html')) {
        loadProfileInfo();
        
        // Add event listeners for profile editing buttons
        const editProfileBtn = document.getElementById('editProfileBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const updateProfileForm = document.getElementById('updateProfileForm');
        const logoutButton = document.getElementById('logoutButton');
        const deleteAccountButton = document.getElementById('deleteAccountButton');
        const confirmDeleteAccountBtn = document.getElementById('confirmDeleteAccountBtn');
        const deleteAccountDialog = new bootstrap.Modal(document.getElementById('deleteAccountDialog'));

        
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
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener('click', () => {
                deleteAccountDialog.show();
            });
        }
    
        if (confirmDeleteAccountBtn) {
            confirmDeleteAccountBtn.addEventListener('click', () => {
                handleDeleteAccount(event);
                deleteAccountDialog.hide();
            });
        }

    }

    // Add event listener for adminRequestForm and if it is submitted execute handleAdminRequest
    const adminRequestForm = document.getElementById('adminRequestForm');
    if (adminRequestForm) {
        adminRequestForm.addEventListener('submit', handleAdminRequest);
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
    // Check if we're in profile page
    if (window.location.pathname.includes('profile.html')) {
        // obtain username and email from the storage
        const username = sessionStorage.getItem('username');
        const email = sessionStorage.getItem('user_id');

        if (username && email) {
            // if they both exist display them in the profile
            document.getElementById('profileUsername').textContent = username;
            document.getElementById('profileEmail').textContent = email;
            
            // Hide admin request section if user is already an admin
            const userRole = sessionStorage.getItem('role');
            const adminRequestSection = document.getElementById('adminRequestSection');
            if (adminRequestSection && userRole === 'Admin') {
                adminRequestSection.style.display = 'none';
            }
        } else {
            // else go to login page
            window.location.href = 'login.html'; 
        }

    }

    // Update nav based on login status
    updateNavigation();
}


function updateNavigation() {

    // Check if user is logged in
    // If user_id is not null isLoggedIn will be true
    const isLoggedIn = sessionStorage.getItem('user_id') !== null;
    // Obtain the  login, avatar, role, image, username and admin items of the document
    const navLogin = document.getElementById('navLogin');
    const avatarContainer = document.getElementById('avatarContainer');
    const dropdownUsername = document.getElementById('dropdownUsername');
    const avatarImage = document.getElementById('avatarImage');
    const userRole = sessionStorage.getItem('role');
    const adminMenuItems = document.querySelectorAll('.admin-only');

    // If navLogin and avatarContainer exist
    if (navLogin && avatarContainer) {
        if (isLoggedIn) {
            // if isLoggedIn is true show the avatar and add the username 
            // to the dropdown menu and the default image to the avatar
            navLogin.style.display = 'none';
            avatarContainer.style.display = 'block';
            if (dropdownUsername) {
                dropdownUsername.textContent = sessionStorage.getItem('username') || 'User';
            }
            adminMenuItems.forEach(item => {
                if (userRole === 'Admin') {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            if (avatarImage) {
                avatarImage.src = 'img/avatar.png';
            }
        } else {
            // else show the login button and hide the avatar
            navLogin.style.display = 'inline-block';
            avatarContainer.style.display = 'none';
        }
    }
}
