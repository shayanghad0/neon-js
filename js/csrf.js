/**
 * CSRF Token Helper for API Calls
 * Provides utilities for working with CSRF tokens in fetch requests
 */

// Get CSRF token from the meta tag
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

// Enhanced fetch that automatically adds CSRF token to requests
function fetchWithCSRF(url, options = {}) {
    // Get the CSRF token
    const token = getCSRFToken();
    
    if (!token) {
        console.error('CSRF token not found');
        throw new Error('Security token missing, please refresh the page');
    }
    
    // Prepare headers with CSRF token
    const headers = {
        ...(options.headers || {}),
        'X-CSRFToken': token
    };
    
    // If sending JSON data, set content type
    if (options.body && !(options.headers && options.headers['Content-Type'])) {
        headers['Content-Type'] = 'application/json';
    }
    
    // Create enhanced options with CSRF token and credentials
    const enhancedOptions = {
        credentials: 'same-origin', // Always include cookies
        ...options,
        headers
    };
    
    // Return fetch with enhanced options
    return fetch(url, enhancedOptions);
}

// Function to handle API errors consistently
function handleAPIError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);
    
    // If we have a structured error response, extract the message
    if (error.response && error.response.json) {
        return error.response.json()
            .then(data => {
                return data.message || defaultMessage;
            })
            .catch(() => defaultMessage);
    }
    
    // Return the error message or default
    return error.message || defaultMessage;
}