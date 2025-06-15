/**
 * NeonChange Admin Panel JavaScript
 * Handles admin functionality including user management, request processing, and price manipulation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabbed navigation
    initializeTabs();
    
    // Initialize modals
    initializeModals();
    
    // Initialize price management
    initializePriceManagement();
    
    // Initialize request handling
    initializeRequestHandling();
    
    // Initialize user management
    initializeUserManagement();
});

// Initialize tabbed navigation
function initializeTabs() {
    const tabLinks = document.querySelectorAll('.nav-link[data-toggle="tab"]');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabLinks.forEach(t => t.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Show the corresponding tab content
            const tabId = this.getAttribute('href').substring(1);
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active', 'show');
            });
            document.getElementById(tabId).classList.add('active', 'show');
        });
    });
}

// Initialize modals
function initializeModals() {
    // Open modal functionality
    document.querySelectorAll('[data-toggle="modal"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetModal = this.getAttribute('data-target');
            document.querySelector(targetModal).classList.add('show');
        });
    });
    
    // Close modal functionality
    document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('show');
        });
    });
    
    // Close modal when clicking outside of modal content
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

// Initialize price management
function initializePriceManagement() {
    const priceForm = document.getElementById('price-form');
    
    if (priceForm) {
        priceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'در حال پردازش...';
            
            // Get form data
            const formData = new FormData(this);
            const coin = formData.get('coin');
            const price = formData.get('price');
            const duration = formData.get('duration');
            
            // Use CSRF-protected fetch to submit the data
            fetchWithCSRF('/admin/price', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    // Show success message
                    showAlert(`قیمت ${coin} با موفقیت به ${price}$ تغییر یافت و برای ${duration} دقیقه اعمال خواهد شد.`, 'success');
                    
                    // Log the price change
                    console.log(`Price changed for ${coin} to $${price} for ${duration} minutes`);
                    
                    // Reset form and button
                    priceForm.reset();
                } else {
                    showAlert(data?.message || 'خطا در تغییر قیمت', 'danger');
                }
            })
            .catch(error => {
                console.error('Error changing price:', error);
                showAlert('خطا در ارتباط با سرور', 'danger');
            })
            .finally(() => {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
}

// Initialize request handling
function initializeRequestHandling() {
    // Approve deposit
    document.querySelectorAll('.approve-deposit').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            document.getElementById('approve-deposit-form').action = `/admin/request/deposit/${requestId}`;
            document.getElementById('approve-deposit-modal').classList.add('show');
        });
    });
    
    // Reject deposit
    document.querySelectorAll('.reject-deposit').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            document.getElementById('reject-deposit-form').action = `/admin/request/deposit/${requestId}`;
            document.getElementById('reject-deposit-modal').classList.add('show');
        });
    });
    
    // Approve withdrawal
    document.querySelectorAll('.approve-withdrawal').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            document.getElementById('approve-withdrawal-form').action = `/admin/request/withdrawal/${requestId}`;
            document.getElementById('approve-withdrawal-modal').classList.add('show');
        });
    });
    
    // Reject withdrawal
    document.querySelectorAll('.reject-withdrawal').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            document.getElementById('reject-withdrawal-form').action = `/admin/request/withdrawal/${requestId}`;
            document.getElementById('reject-withdrawal-modal').classList.add('show');
        });
    });
}

// Initialize user management
function initializeUserManagement() {
    // Ban user
    document.querySelectorAll('.ban-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const userName = this.getAttribute('data-name');
            
            document.getElementById('ban-user-form').action = `/admin/user/${userId}`;
            document.getElementById('ban-user-name').textContent = userName;
            document.getElementById('ban-user-modal').classList.add('show');
        });
    });
    
    // Unban user
    document.querySelectorAll('.unban-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const userName = this.getAttribute('data-name');
            
            document.getElementById('unban-user-form').action = `/admin/user/${userId}`;
            document.getElementById('unban-user-name').textContent = userName;
            document.getElementById('unban-user-modal').classList.add('show');
        });
    });
    
    // Edit user
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const userName = this.getAttribute('data-name');
            const userEmail = this.getAttribute('data-email');
            const userBalance = this.getAttribute('data-balance');
            
            document.getElementById('edit-user-form').action = `/admin/user/${userId}`;
            document.getElementById('edit-user-name').value = userName;
            document.getElementById('edit-user-email').value = userEmail;
            document.getElementById('edit-user-balance').value = userBalance;
            document.getElementById('edit-user-modal').classList.add('show');
        });
    });
    
    // User search functionality
    const userSearchInput = document.getElementById('user-search');
    
    if (userSearchInput) {
        userSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const userRows = document.querySelectorAll('.user-row');
            
            userRows.forEach(row => {
                const username = row.querySelector('.user-username').textContent.toLowerCase();
                const email = row.querySelector('.user-email').textContent.toLowerCase();
                const name = row.querySelector('.user-name').textContent.toLowerCase();
                
                if (username.includes(searchTerm) || email.includes(searchTerm) || name.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// Show an alert message
function showAlert(message, type) {
    const alertsContainer = document.getElementById('alerts-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    alertsContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alertsContainer.removeChild(alert);
        }, 300);
    }, 5000);
}
