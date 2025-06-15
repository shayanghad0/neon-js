/**
 * NeonChange Trading Interface JavaScript
 * Handles trading operations, chart initialization, and real-time price updates
 */

// Global tradingview widget
let tradingViewWidget = null;
let currentInterval = "15";

// TradingView chart configuration
function initTradingViewWidget(symbol, interval = "15") {
    // Clear previous chart if any
    document.querySelector('#tradingview_chart').innerHTML = `
        <div class="tradingview-chart-loading text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p class="mt-2">در حال بارگذاری نمودار...</p>
        </div>
    `;
    
    // Save the current interval
    currentInterval = interval;
    
    // Update active timeframe button
    document.querySelectorAll('[data-timeframe]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-timeframe="${interval}"]`).classList.add('active');
    
    // Create a more advanced TradingView chart with official integration
    tradingViewWidget = new TradingView.widget({
        "autosize": true,
        "symbol": symbol + "USDT",
        "interval": interval,
        "timezone": "Asia/Tehran",
        "theme": "dark",
        "style": "1",
        "locale": "fa_IR",
        "toolbar_bg": "#121424",
        "enable_publishing": false,
        "withdateranges": true,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "details": true,
        "hotlist": true,
        "calendar": true,
        "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            "BB@tv-basicstudies"
        ],
        "container_id": "tradingview_chart",
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "650",
        "customer": "neonchange",
        "height": 500,
        "save_image": true
    });
    
    console.log(`TradingView chart initialized for ${symbol}USDT with ${interval} interval`);
}

// Initialize variables
let currentCoin = '';
let currentPositionType = 'long';
let currentLeverage = 1;
let currentPrice = 0;
let userBalance = 0;
let isPositionOpen = false;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Get the current coin from the URL
    const pathParts = window.location.pathname.split('/');
    currentCoin = pathParts[pathParts.length - 1].replace('USDT', '');
    
    // Get user balance
    userBalance = parseFloat(document.getElementById('user-balance').dataset.balance || 0);
    
    // Initialize the TradingView chart
    initTradingViewWidget(currentCoin);
    
    // Initialize UI elements
    initializeTradeInterface();
});

// Initialize the trading interface
function initializeTradeInterface() {
    // Position type selectors
    const longBtn = document.getElementById('btn-long');
    const shortBtn = document.getElementById('btn-short');
    
    longBtn.addEventListener('click', function() {
        setPositionType('long');
    });
    
    shortBtn.addEventListener('click', function() {
        setPositionType('short');
    });
    
    // Timeframe buttons
    document.querySelectorAll('[data-timeframe]').forEach(btn => {
        btn.addEventListener('click', function() {
            const timeframe = this.getAttribute('data-timeframe');
            // Reinitialize chart with the new timeframe
            initTradingViewWidget(currentCoin, timeframe);
        });
    });
    
    // Leverage slider
    const leverageSlider = document.getElementById('leverage-slider');
    const leverageValue = document.getElementById('leverage-value');
    
    // Set max leverage based on coin
    function updateLeverageMax() {
        // Set max leverage: 500x for BTC, 250x for others
        if (currentCoin === 'BTC') {
            leverageSlider.max = 500;
            document.querySelector('.leverage-max-info').textContent = '(حداکثر: 500x)';
        } else {
            leverageSlider.max = 250;
            document.querySelector('.leverage-max-info').textContent = '(حداکثر: 250x)';
        }
        
        // Update leverage display markers
        const maxLeverage = parseInt(leverageSlider.max);
        const leverageLabels = document.querySelector('.leverage-labels');
        leverageLabels.innerHTML = `
            <small>1x</small>
            <small>${Math.round(maxLeverage * 0.25)}x</small>
            <small>${Math.round(maxLeverage * 0.5)}x</small>
            <small>${maxLeverage}x</small>
        `;
    }
    
    // Call once at initialization
    updateLeverageMax();
    
    leverageSlider.addEventListener('input', function() {
        setLeverage(parseInt(this.value));
        leverageValue.textContent = this.value + 'x';
    });
    
    // Amount input
    const amountInput = document.getElementById('trade-amount');
    const tradeValueDisplay = document.getElementById('trade-value');
    
    amountInput.addEventListener('input', function() {
        updateTradeValue();
    });
    
    // Max button
    const maxBtn = document.getElementById('btn-max');
    maxBtn.addEventListener('click', function() {
        amountInput.value = userBalance.toFixed(2);
        updateTradeValue();
    });
    
    // Open position button
    const openPositionBtn = document.getElementById('btn-open-position');
    openPositionBtn.addEventListener('click', function() {
        openPosition();
    });
    
    // Close position buttons (will be attached in the updateOpenPositions function)
    
    // Set defaults
    setPositionType('long');
    setLeverage(1);
    
    // Initial update of open positions
    updateOpenPositions();
    
    // Setup real-time price updates
    startPriceUpdates();
}

// Set the position type (long or short)
function setPositionType(type) {
    currentPositionType = type;
    
    // Update UI
    document.getElementById('btn-long').classList.remove('active');
    document.getElementById('btn-short').classList.remove('active');
    document.getElementById('btn-' + type).classList.add('active');
    
    // Update TP/SL hints based on position type
    const takeProfitHint = document.getElementById('take-profit-hint');
    const stopLossHint = document.getElementById('stop-loss-hint');
    
    if (type === 'long') {
        // Long position hints
        takeProfitHint.textContent = 'موقعیت در صورت افزایش قیمت به این مقدار با سود بسته می‌شود';
        stopLossHint.textContent = 'موقعیت در صورت کاهش قیمت به این مقدار با ضرر بسته می‌شود';
    } else {
        // Short position hints
        takeProfitHint.textContent = 'موقعیت در صورت کاهش قیمت به این مقدار با سود بسته می‌شود';
        stopLossHint.textContent = 'موقعیت در صورت افزایش قیمت به این مقدار با ضرر بسته می‌شود';
    }
    
    // Clear TP/SL inputs when switching position type
    document.getElementById('take-profit').value = '';
    document.getElementById('stop-loss').value = '';
    
    // Update liquidation price
    updateLiquidationPrice();
}

// Set the leverage value
function setLeverage(value) {
    currentLeverage = value;
    
    // Update UI
    document.getElementById('leverage-slider').value = value;
    document.getElementById('leverage-value').textContent = value + 'x';
    
    // Update liquidation price
    updateLiquidationPrice();
}

// Update the trade value based on amount and leverage
function updateTradeValue() {
    const amount = parseFloat(document.getElementById('trade-amount').value) || 0;
    const tradeValue = amount * currentLeverage;
    
    // Update UI
    document.getElementById('trade-value').textContent = tradeValue.toFixed(2) + ' $';
    
    // Update liquidation price
    updateLiquidationPrice();
}

// Calculate and update the liquidation price
function updateLiquidationPrice() {
    const amount = parseFloat(document.getElementById('trade-amount').value) || 0;
    
    if (amount <= 0 || currentPrice <= 0) {
        document.getElementById('liquidation-price').textContent = '0';
        return;
    }
    
    let liquidationPrice;
    
    if (currentPositionType === 'long') {
        liquidationPrice = currentPrice * (1 - (1 / currentLeverage));
    } else {
        liquidationPrice = currentPrice * (1 + (1 / currentLeverage));
    }
    
    // Update UI
    document.getElementById('liquidation-price').textContent = liquidationPrice.toFixed(2) + ' $';
}

// Start real-time price updates
function startPriceUpdates() {
    function updatePrices() {
        fetchWithCSRF('/api/prices', { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                // Update current price
                const pair = currentCoin + '/USDT';
                if (data[pair]) {
                    // Check if price has changed
                    const previousPrice = currentPrice;
                    currentPrice = data[pair];
                    
                    // Update price display
                    const priceElement = document.getElementById('current-price');
                    priceElement.textContent = currentPrice.toFixed(2) + ' $';
                    
                    // Highlight price changes with animation
                    if (previousPrice !== 0 && previousPrice !== currentPrice) {
                        const changeDirection = currentPrice > previousPrice ? 'up' : 'down';
                        const changeClass = changeDirection === 'up' ? 'price-up' : 'price-down';
                        
                        priceElement.classList.remove('price-up', 'price-down');
                        priceElement.classList.add(changeClass);
                        
                        // Remove animation class after animation completes
                        setTimeout(() => {
                            priceElement.classList.remove(changeClass);
                        }, 1000);
                        
                        // Log price change
                        console.log(`Price changed from ${previousPrice.toFixed(2)} to ${currentPrice.toFixed(2)} (${changeDirection})`);
                        
                        // Check all open positions to see if TP/SL should be triggered
                        checkTakeProfitStopLoss(data);
                    }
                    
                    // Update liquidation price
                    updateLiquidationPrice();
                    
                    // If admin changed the price, we should update all positions and the chart
                    if (previousPrice !== 0 && previousPrice !== currentPrice) {
                        // Update open positions to reflect new prices
                        updateOpenPositions();
                        
                        // Force TradingView chart update when price changes significantly
                        // (This will refresh the chart to show the new price)
                        const priceChangePct = Math.abs((currentPrice - previousPrice) / previousPrice) * 100;
                        if (priceChangePct > 1) { // If price change is more than 1%
                            console.log(`Significant price change detected (${priceChangePct.toFixed(2)}%). Refreshing chart...`);
                            
                            // Refresh the chart by destroying and recreating the TradingView widget
                            const chartContainer = document.getElementById('tradingview-widget-container');
                            if (chartContainer) {
                                chartContainer.innerHTML = '';
                                setTimeout(() => {
                                    initTradingViewWidget(currentCoin, "15");
                                }, 500);
                            }
                        }
                    }
                }
            })
            .catch(error => console.error('Error fetching prices:', error));
    }
    
    // Function to check all positions for TP/SL conditions
    function checkTakeProfitStopLoss(prices) {
        // Get positions from the DOM since they're already up-to-date
        const positionElements = document.querySelectorAll('.position-card');
        
        positionElements.forEach(posElement => {
            const positionId = posElement.getAttribute('data-position-id');
            const positionCoin = posElement.getAttribute('data-coin');
            const positionType = posElement.getAttribute('data-type');
            const entryPrice = parseFloat(posElement.getAttribute('data-entry-price'));
            const takeProfit = parseFloat(posElement.getAttribute('data-take-profit')) || null;
            const stopLoss = parseFloat(posElement.getAttribute('data-stop-loss')) || null;
            
            // If position has no TP/SL, skip it
            if (!takeProfit && !stopLoss) return;
            
            // Get current price for this coin
            const currentPrice = prices[positionCoin + '/USDT'];
            if (!currentPrice) return;
            
            let shouldClose = false;
            let closeReason = '';
            
            // Check if TP/SL conditions are met
            if (positionType === 'long') {
                // For long positions: TP is triggered when price goes above the TP level
                if (takeProfit && currentPrice >= takeProfit) {
                    shouldClose = true;
                    closeReason = 'حد سود';
                }
                // For long positions: SL is triggered when price goes below the SL level
                else if (stopLoss && currentPrice <= stopLoss) {
                    shouldClose = true;
                    closeReason = 'حد ضرر';
                }
            } else {
                // For short positions: TP is triggered when price goes below the TP level
                if (takeProfit && currentPrice <= takeProfit) {
                    shouldClose = true;
                    closeReason = 'حد سود';
                }
                // For short positions: SL is triggered when price goes above the SL level
                else if (stopLoss && currentPrice >= stopLoss) {
                    shouldClose = true;
                    closeReason = 'حد ضرر';
                }
            }
            
            // If TP/SL is triggered, close the position
            if (shouldClose) {
                console.log(`Auto-closing position ${positionId} (${positionType} ${positionCoin}) at ${currentPrice} due to ${closeReason}`);
                
                // Close position with API call
                fetchWithCSRF(`/api/close-position/${positionId}`, {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const profitLoss = parseFloat(data.profit_loss) || 0;
                        
                        // Show notification
                        showAlert(`موقعیت با ${closeReason} بسته شد. سود/زیان: ${profitLoss.toFixed(2)} $`, 
                                  profitLoss >= 0 ? 'success' : 'warning');
                        
                        // Get current balance from the server
                        fetch('/api/prices', { method: 'GET' })
                            .then(response => response.json())
                            .then(data => {
                                // The server will return the updated balance after calculations
                                if (data.user_balance !== undefined) {
                                    userBalance = parseFloat(data.user_balance);
                                } else {
                                    // If server doesn't return balance, update client-side approximation
                                    // Check for liquidation
                                    if (profitLoss < 0 && Math.abs(profitLoss) >= userBalance) {
                                        // User was liquidated - balance is 0
                                        userBalance = 0;
                                    } else {
                                        // Normal case - add profit/loss to balance
                                        userBalance += profitLoss; 
                                    }
                                }
                                
                                // Update UI
                                document.getElementById('user-balance').textContent = userBalance.toFixed(2) + ' $';
                                document.getElementById('user-balance').dataset.balance = userBalance.toFixed(2);
                                
                                // Log to console
                                console.log(`Balance updated after position close. New balance: ${userBalance.toFixed(2)}`);
                            })
                            .catch(error => {
                                console.error('Error fetching updated balance:', error);
                            });
                        
                        // Update open positions
                        updateOpenPositions();
                    }
                })
                .catch(error => console.error('Error in auto-closing position:', error));
            }
        });
    }
    
    // Update immediately and then every 2 seconds to catch admin price changes quickly
    updatePrices();
    setInterval(updatePrices, 2000);
}

// Open a new position
function openPosition() {
    const amount = parseFloat(document.getElementById('trade-amount').value) || 0;
    
    // Validate input
    if (amount <= 0) {
        showAlert('لطفا مقدار معتبر وارد کنید', 'danger');
        return;
    }
    
    if (amount > userBalance) {
        showAlert('موجودی ناکافی', 'danger');
        return;
    }
    
    // Get take profit and stop loss values if provided
    const takeProfitElement = document.getElementById('take-profit');
    const stopLossElement = document.getElementById('stop-loss');
    
    let takeProfit = takeProfitElement && takeProfitElement.value ? parseFloat(takeProfitElement.value) : null;
    let stopLoss = stopLossElement && stopLossElement.value ? parseFloat(stopLossElement.value) : null;
    
    // Validate take profit and stop loss based on position type
    if (takeProfit !== null || stopLoss !== null) {
        if (currentPositionType === 'long') {
            // For long positions: take profit must be higher than current price
            if (takeProfit !== null && takeProfit <= currentPrice) {
                showAlert('حد سود باید بالاتر از قیمت فعلی باشد', 'danger');
                return;
            }
            // For long positions: stop loss must be lower than current price
            if (stopLoss !== null && stopLoss >= currentPrice) {
                showAlert('حد ضرر باید پایین‌تر از قیمت فعلی باشد', 'danger');
                return;
            }
        } else { // short position
            // For short positions: take profit must be lower than current price
            if (takeProfit !== null && takeProfit >= currentPrice) {
                showAlert('حد سود باید پایین‌تر از قیمت فعلی باشد', 'danger');
                return;
            }
            // For short positions: stop loss must be higher than current price
            if (stopLoss !== null && stopLoss <= currentPrice) {
                showAlert('حد ضرر باید بالاتر از قیمت فعلی باشد', 'danger');
                return;
            }
        }
    }
    
    // Prepare data for API call
    const data = {
        coin: currentCoin,
        amount: amount,
        leverage: currentLeverage,
        type: currentPositionType,
        take_profit: takeProfit,
        stop_loss: stopLoss
    };
    
    // Show loading state
    const openPositionBtn = document.getElementById('btn-open-position');
    openPositionBtn.disabled = true;
    openPositionBtn.textContent = 'در حال پردازش...';
    
    // Send API request with CSRF token
    fetchWithCSRF('/api/open-position', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            
            // Update balance
            userBalance -= amount;
            document.getElementById('user-balance').textContent = userBalance.toFixed(2) + ' $';
            document.getElementById('user-balance').dataset.balance = userBalance.toFixed(2);
            
            // Clear form
            document.getElementById('trade-amount').value = '';
            updateTradeValue();
            
            // Update open positions
            updateOpenPositions();
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error opening position:', error);
        showAlert('خطا در باز کردن موقعیت', 'danger');
    })
    .finally(() => {
        // Reset button state
        openPositionBtn.disabled = false;
        openPositionBtn.textContent = 'باز کردن موقعیت';
    });
}

// Close an open position
function closePosition(positionId) {
    // Show confirmation dialog
    if (!confirm('آیا از بستن این موقعیت اطمینان دارید؟')) {
        return;
    }
    
    // Show loading state
    const closeBtn = document.querySelector(`[data-position-id="${positionId}"]`);
    closeBtn.disabled = true;
    closeBtn.textContent = 'در حال پردازش...';
    
    // Send API request with CSRF token
    fetchWithCSRF(`/api/close-position/${positionId}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const profitLoss = parseFloat(data.profit_loss) || 0;
            const profitLossFormatted = profitLoss >= 0 ? 
                `+${profitLoss.toFixed(2)}` : 
                profitLoss.toFixed(2);
                
            showAlert(`موقعیت با موفقیت بسته شد. سود/زیان: ${profitLossFormatted} $`, 
                      profitLoss >= 0 ? 'success' : 'warning');
            
            // Update balance, handling liquidation case (negative balance becomes 0)
            if (profitLoss < 0 && Math.abs(profitLoss) >= userBalance) {
                // User was liquidated
                userBalance = 0;
                console.log('Liquidation occurred. Balance set to 0.');
            } else {
                // Normal case
                userBalance += profitLoss;
            }
            document.getElementById('user-balance').textContent = userBalance.toFixed(2) + ' $';
            document.getElementById('user-balance').dataset.balance = userBalance.toFixed(2);
            
            // Update open positions
            updateOpenPositions();
            
            // Log to console for debugging
            console.log(`Position closed with profit/loss: ${profitLossFormatted}. New balance: ${userBalance.toFixed(2)}`);
        } else {
            showAlert(data.message, 'danger');
            
            // Re-enable button
            closeBtn.disabled = false;
            closeBtn.textContent = 'بستن';
        }
    })
    .catch(error => {
        console.error('Error closing position:', error);
        showAlert('خطا در بستن موقعیت', 'danger');
        
        // Re-enable button
        closeBtn.disabled = false;
        closeBtn.textContent = 'بستن';
    });
}

// Update the list of open positions
function updateOpenPositions() {
    const positionsContainer = document.getElementById('open-positions-container');
    
    // Get open positions from the server with CSRF token
    fetch('/api/positions', { 
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        .then(response => response.json())
        .then(positions => {
            if (positions.length === 0) {
                positionsContainer.innerHTML = '<p class="text-center">موقعیت باز وجود ندارد</p>';
                return;
            }
            
            // Build HTML for positions
            let html = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>ارز</th>
                            <th>نوع</th>
                            <th>مقدار</th>
                            <th>اهرم</th>
                            <th>قیمت ورود</th>
                            <th>قیمت فعلی</th>
                            <th>حد سود</th>
                            <th>حد ضرر</th>
                            <th>سود/ضرر</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            positions.forEach(position => {
                // Ensure values are numbers
                const amount = parseFloat(position.amount) || 0;
                const leverage = parseFloat(position.leverage) || 1;
                const entryPrice = parseFloat(position.entry_price) || 0;
                
                // Get current price from the position data (added by the backend)
                const coinCurrentPrice = parseFloat(position.current_price) || currentPrice;
                
                // Use the profit/loss data from the API if available, otherwise calculate it
                let profitLoss, priceChangePercentage;
                
                if (position.current_profit_loss !== undefined) {
                    profitLoss = parseFloat(position.current_profit_loss);
                    priceChangePercentage = parseFloat(position.price_change_percentage) / 100;
                } else {
                    // Calculate profit/loss if not provided by API
                    let priceDifference;
                    if (position.type === 'long') {
                        priceDifference = coinCurrentPrice - entryPrice;
                    } else {
                        priceDifference = entryPrice - coinCurrentPrice;
                    }
                    
                    priceChangePercentage = entryPrice > 0 ? priceDifference / entryPrice : 0;
                    profitLoss = amount + (amount * leverage * priceChangePercentage);
                }
                
                const profitLossClass = profitLoss >= 0 ? 'text-success' : 'text-danger';
                
                // Get take profit and stop loss values
                const takeProfit = position.take_profit !== null ? parseFloat(position.take_profit) : null;
                const stopLoss = position.stop_loss !== null ? parseFloat(position.stop_loss) : null;
                
                // Format TP/SL for display
                const takeProfitDisplay = takeProfit !== null ? `${takeProfit.toFixed(2)} $` : '-';
                const stopLossDisplay = stopLoss !== null ? `${stopLoss.toFixed(2)} $` : '-';
                
                // Add TP/SL indicators to the position table
                html += `
                    <tr class="position-card" 
                        data-position-id="${position.id}" 
                        data-coin="${position.coin}" 
                        data-type="${position.type}" 
                        data-entry-price="${entryPrice.toFixed(2)}" 
                        data-take-profit="${takeProfit !== null ? takeProfit.toFixed(2) : ''}" 
                        data-stop-loss="${stopLoss !== null ? stopLoss.toFixed(2) : ''}">
                        <td>${position.coin}</td>
                        <td>${position.type === 'long' ? 'خرید' : 'فروش'}</td>
                        <td>${amount.toFixed(2)} $</td>
                        <td>${leverage}x</td>
                        <td>${entryPrice.toFixed(2)} $</td>
                        <td>${coinCurrentPrice.toFixed(2)} $</td>
                        <td>${takeProfitDisplay}</td>
                        <td>${stopLossDisplay}</td>
                        <td class="${profitLossClass}">${profitLoss.toFixed(2)} $ (${(priceChangePercentage * leverage * 100).toFixed(2)}%)</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="closePosition('${position.id}')" data-position-id="${position.id}">بستن</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            positionsContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching positions:', error);
            positionsContainer.innerHTML = '<p class="text-center text-danger">خطا در دریافت موقعیت‌ها</p>';
        });
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

// No longer needed as we now have a real API endpoint for positions
