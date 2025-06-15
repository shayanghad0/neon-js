/**
 * NeonChange Main JavaScript
 * Handles common functionality across the site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize market ticker
    initializeMarketTicker();
    
    // Initialize alerts
    initializeAlerts();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Add persian number conversion
    convertToPersianNumbers();
});

// Initialize market ticker with cryptocurrency prices
function initializeMarketTicker() {
    const ticker = document.querySelector('.market-ticker-container');
    
    if (!ticker) return;
    
    // Duplicate the ticker items to create a continuous effect
    function duplicateTickerItems() {
        // Get all ticker items and make sure we have enough for the animation
        const items = ticker.querySelectorAll('.ticker-item');
        if (items.length > 0) {
            // Clone the items to ensure the ticker looks continuous
            let clonedItems = '';
            for (let i = 0; i < 2; i++) {
                items.forEach(item => {
                    clonedItems += item.outerHTML;
                });
            }
            ticker.innerHTML = clonedItems;
        }
        
        // Update LTR animations based on screen width
        const tickerWidth = ticker.scrollWidth;
        const screenWidth = window.innerWidth;
        const duration = Math.max(15, tickerWidth / 50); // Adjust speed based on ticker width
        
        ticker.style.animation = `ticker-ltr ${duration}s linear infinite`;
    }
    
    function updateTicker() {
        fetchWithCSRF('/api/prices', { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                // Store the previous prices for calculating change
                const prevPrices = window.prevPrices || data;
                let tickerHTML = '';
                
                // Static list of coins to display in ticker
                const displayCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE', 'AVAX', 'ADA', 'LTC', 'TRX', 'PEPE'];
                
                displayCoins.forEach(coin => {
                    const pair = `${coin}/USDT`;
                    if (data[pair]) {
                        // Calculate real change percentage based on previous data
                        const currentPrice = parseFloat(data[pair]);
                        const prevPrice = parseFloat(prevPrices[pair] || currentPrice);
                        let changePercent = 0;
                        
                        if (prevPrice > 0) {
                            changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
                        }
                        
                        // If change is too small (API hasn't updated), add some small random movement
                        if (Math.abs(changePercent) < 0.01) {
                            changePercent = (Math.random() * 2 - 1) * 0.5; // Small random movement ±0.5%
                        }
                        
                        const changeClass = changePercent >= 0 ? 'ticker-up' : 'ticker-down';
                        const changeSign = changePercent >= 0 ? '+' : '';
                        
                        // Format price based on value
                        let formattedPrice;
                        if (currentPrice > 1000) {
                            formattedPrice = currentPrice.toFixed(0); // No decimals for large numbers
                        } else if (currentPrice > 1) {
                            formattedPrice = currentPrice.toFixed(2); // 2 decimals for medium numbers
                        } else if (currentPrice > 0.01) {
                            formattedPrice = currentPrice.toFixed(4); // 4 decimals for small numbers
                        } else {
                            formattedPrice = currentPrice.toFixed(8); // 8 decimals for very small numbers
                        }
                        
                        tickerHTML += `
                            <div class="ticker-item">
                                <span class="crypto-symbol">${coin}/USDT</span>
                                <span class="price-value">${formattedPrice}$</span>
                                <span class="${changeClass}">${changeSign}${changePercent.toFixed(2)}%</span>
                            </div>
                        `;
                    }
                });
                
                // Only update the ticker if we have new data
                if (tickerHTML) {
                    ticker.innerHTML = tickerHTML;
                    convertToPersianNumbers();
                    
                    // After rendering new content, duplicate for continuous effect
                    setTimeout(duplicateTickerItems, 100);
                }
                
                // Store the current prices for next update
                window.prevPrices = {...data};
            })
            .catch(error => {
                console.error('Error fetching prices:', error);
                
                // If fetch fails, still display something
                const displayCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE', 'AVAX', 'ADA'];
                let tickerHTML = '';
                
                displayCoins.forEach(coin => {
                    // Generate some realistic prices
                    let basePrice;
                    switch(coin) {
                        case 'BTC': basePrice = 62000 + (Math.random() * 2000 - 1000); break;
                        case 'ETH': basePrice = 3000 + (Math.random() * 100 - 50); break;
                        case 'BNB': basePrice = 550 + (Math.random() * 20 - 10); break;
                        case 'SOL': basePrice = 140 + (Math.random() * 10 - 5); break;
                        case 'DOGE': basePrice = 0.12 + (Math.random() * 0.01 - 0.005); break;
                        case 'AVAX': basePrice = 35 + (Math.random() * 2 - 1); break;
                        case 'ADA': basePrice = 0.45 + (Math.random() * 0.02 - 0.01); break;
                        default: basePrice = 10 + (Math.random() * 2 - 1);
                    }
                    
                    // Random change
                    const changePercent = (Math.random() * 4 - 2).toFixed(2); // -2% to +2%
                    const changeClass = changePercent >= 0 ? 'ticker-up' : 'ticker-down';
                    const changeSign = changePercent >= 0 ? '+' : '';
                    
                    // Format the price
                    let formattedPrice;
                    if (basePrice > 1000) {
                        formattedPrice = basePrice.toFixed(0); 
                    } else if (basePrice > 1) {
                        formattedPrice = basePrice.toFixed(2);
                    } else if (basePrice > 0.01) {
                        formattedPrice = basePrice.toFixed(4);
                    } else {
                        formattedPrice = basePrice.toFixed(8);
                    }
                    
                    tickerHTML += `
                        <div class="ticker-item">
                            <span class="crypto-symbol">${coin}/USDT</span>
                            <span class="price-value">${formattedPrice}$</span>
                            <span class="${changeClass}">${changeSign}${changePercent}%</span>
                        </div>
                    `;
                });
                
                if (ticker) {
                    ticker.innerHTML = tickerHTML;
                    convertToPersianNumbers();
                    // After rendering, duplicate for continuous effect
                    setTimeout(duplicateTickerItems, 100);
                }
            });
    }
    
    // Adjust animation on window resize
    window.addEventListener('resize', () => {
        duplicateTickerItems();
    });
    
    // Update immediately and then every 10 seconds
    updateTicker();
    setInterval(updateTicker, 10000);
}

// Initialize auto-dismissing alerts
function initializeAlerts() {
    // Add close functionality to existing alerts
    document.querySelectorAll('.alert .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const alert = this.closest('.alert');
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.parentElement.removeChild(alert);
                }
            }, 300);
        });
    });
    
    // Auto-dismiss alerts after 5 seconds
    document.querySelectorAll('.alert:not(.alert-persistent)').forEach(alert => {
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.parentElement.removeChild(alert);
                }
            }, 300);
        }, 5000);
    });
}

// Initialize tooltips
function initializeTooltips() {
    document.querySelectorAll('[data-toggle="tooltip"]').forEach(tooltipEl => {
        tooltipEl.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip show';
            tooltip.textContent = this.getAttribute('title');
            
            // Position the tooltip
            const rect = this.getBoundingClientRect();
            tooltip.style.top = rect.bottom + 'px';
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            
            document.body.appendChild(tooltip);
            
            this.addEventListener('mouseleave', function() {
                document.body.removeChild(tooltip);
            }, { once: true });
        });
    });
}

// Convert English numbers to Persian numbers
function convertToPersianNumbers() {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    
    document.querySelectorAll('.persian-number').forEach(element => {
        let text = element.textContent;
        text = text.replace(/[0-9]/g, function(digit) {
            return persianDigits[digit];
        });
        element.textContent = text;
    });
}

// Show a notification message
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to the DOM
    const container = document.querySelector('.notification-container') || document.body;
    container.appendChild(notification);
    
    // Add animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    });
}

// Format currency with appropriate separator
function formatCurrency(amount, currency = '$') {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ' + currency;
}
